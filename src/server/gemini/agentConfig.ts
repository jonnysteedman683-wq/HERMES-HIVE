import * as fs from 'fs';
import * as path from 'path';

export interface AgentAISettings {
  isEnabled: boolean;
  providerType: 'gemini' | 'openai' | 'ollama' | 'custom';
  apiUrl: string;
  apiKey: string;
  modelName: string;
  connectionStatus: 'disconnected' | 'connected' | 'error';
  lastConnectedAt?: string;
  errorMessage?: string;
}

const DEFAULT_SETTINGS: AgentAISettings = {
  isEnabled: false,
  providerType: 'gemini',
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  apiKey: '',
  modelName: 'gemini-2.5-flash',
  connectionStatus: 'disconnected',
};

class AgentConfigManager {
  private settingsPath: string;
  private currentSettings: AgentAISettings;

  constructor() {
    this.settingsPath = path.join(process.cwd(), 'src', 'server', 'gemini', 'agentConfig.json');
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.load();
  }

  public getSettings(): AgentAISettings {
    return { ...this.currentSettings };
  }

  public getSettingsSafe(): AgentAISettings {
    const safe = { ...this.currentSettings };
    if (safe.apiKey) {
      safe.apiKey = safe.apiKey.slice(0, 3) + '... ' + safe.apiKey.slice(-4);
    }
    return safe;
  }

  public updateSettings(newSettings: Partial<AgentAISettings>): AgentAISettings {
    const previousApiKey = this.currentSettings.apiKey;
    
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
    };

    // If API Key is masked or empty in client request, preserve existing key
    if (newSettings.apiKey === undefined || newSettings.apiKey.includes('...')) {
      this.currentSettings.apiKey = previousApiKey;
    }

    this.save();
    return this.getSettingsSafe();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        this.currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (err) {
      console.warn('[AgentConfigManager] Failed to load settings from file, using defaults.', err);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.currentSettings, null, 2), 'utf8');
    } catch (err) {
      console.error('[AgentConfigManager] Failed to save settings to file.', err);
    }
  }

  public async testConnection(settings: AgentAISettings): Promise<{ success: boolean; message: string }> {
    const provider = settings.providerType;
    const url = settings.apiUrl;
    const key = settings.apiKey;
    const model = settings.modelName;

    try {
      if (provider === 'gemini') {
        const fullUrl = `${url.replace(/\/$/, '')}/${model}:generateContent?key=${key}`;
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with exactly: Connection Successful' }] }]
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (generatedText) {
          return { success: true, message: `Connected to Gemini! Response: "${generatedText.trim()}"` };
        } else {
          return { success: true, message: 'Connected to Gemini, but empty response received.' };
        }
      } else if (provider === 'openai' || provider === 'ollama' || provider === 'custom') {
        const fullUrl = `${url.replace(/\/$/, '')}/chat/completions`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (key) {
          headers['Authorization'] = `Bearer ${key}`;
        }

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Respond with exactly: Connection Successful' }],
            max_tokens: 10,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Provider returned status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const generatedText = data?.choices?.[0]?.message?.content || '';
        if (generatedText) {
          return { success: true, message: `Connected to ${provider}! Response: "${generatedText.trim()}"` };
        } else {
          return { success: true, message: `Connected to ${provider}, but empty response received.` };
        }
      } else {
        throw new Error(`Unsupported provider type: ${provider}`);
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Unknown network error' };
    }
  }

  public async executeExternalCall(prompt: string, systemInstruction?: string): Promise<{ text: string; modelUsed: string }> {
    try {
      const settings = this.currentSettings;
      const provider = settings.providerType;
      const url = settings.apiUrl;
      const key = settings.apiKey;
      const model = settings.modelName;

      if (provider === 'gemini') {
        const fullUrl = `${url.replace(/\/$/, '')}/${model}:generateContent?key=${key}`;
        const payload: any = {
          contents: [{ parts: [{ text: prompt }] }]
        };
        if (systemInstruction) {
          payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API call failed with status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text, modelUsed: `external-gemini:${model}` };
      } else {
        // OpenAI/Ollama/Custom standard completions endpoint
        const fullUrl = `${url.replace(/\/$/, '')}/chat/completions`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (key) {
          headers['Authorization'] = `Bearer ${key}`;
        }

        const messages: any[] = [];
        if (systemInstruction) {
          messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model,
            messages,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Custom Agent API call failed with status ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const text = data?.choices?.[0]?.message?.content || '';
        return { text, modelUsed: `external-agent:${model}` };
      }
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[AgentConfigManager] External agent call failed: ${message}`);
    }
  }
}

export const agentConfigManager = new AgentConfigManager();
