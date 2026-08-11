import { useEffect, useRef, useState } from 'react';
import { TabType } from '../components/layout/Sidebar';

interface UseKeyboardShortcutsOptions {
  onNavigateTab: (tab: TabType) => void;
  onToggleShortcuts: () => void;
  onFocusCommandInput: () => void;
  onTriggerDemo: (scenario: string) => void;
  onRefreshData: () => void;
  onCloseModals: () => void;
  onToggleAskHermes?: () => void;
}

export function useKeyboardShortcuts({
  onNavigateTab,
  onToggleShortcuts,
  onFocusCommandInput,
  onTriggerDemo,
  onRefreshData,
  onCloseModals,
  onToggleAskHermes,
}: UseKeyboardShortcutsOptions) {
  const gKeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isGKeyPressed, setIsGKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Global Escape (closes modals/drawers or blurs input)
      if (e.key === 'Escape') {
        if (isInput) {
          (target as HTMLElement).blur();
        }
        onCloseModals();
        return;
      }

      // Cmd + K or Ctrl + K (Focus Command Input)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onFocusCommandInput();
        return;
      }

      // If user is typing in an input/textarea, ignore single-letter navigation shortcuts
      if (isInput) return;

      // Toggle Shortcuts Helper with ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onToggleShortcuts();
        return;
      }

      // Shift + A (Ask Hermes Widget)
      if (e.shiftKey && e.key.toUpperCase() === 'A') {
        e.preventDefault();
        onToggleAskHermes?.();
        return;
      }

      // Shift + D (Trigger Demo Audit)
      if (e.shiftKey && e.key.toUpperCase() === 'D') {
        e.preventDefault();
        onTriggerDemo('security_audit');
        return;
      }

      // Shift + R (Refresh Data)
      if (e.shiftKey && e.key.toUpperCase() === 'R') {
        e.preventDefault();
        onRefreshData();
        return;
      }

      // Direct Number Shortcuts: 1-9
      if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          onNavigateTab('dashboard');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          onNavigateTab('hermes');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          onNavigateTab('web');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          onNavigateTab('collective');
          return;
        }
        if (e.key === '5') {
          e.preventDefault();
          onNavigateTab('swarm');
          return;
        }
        if (e.key === '6') {
          e.preventDefault();
          onNavigateTab('missions');
          return;
        }
        if (e.key === '7') {
          e.preventDefault();
          onNavigateTab('memory');
          return;
        }
        if (e.key === '8') {
          e.preventDefault();
          onNavigateTab('events');
          return;
        }
        if (e.key === '9') {
          e.preventDefault();
          onNavigateTab('tools');
          return;
        }
      }

      // Two-key Chords starting with 'g' (e.g. g + d => dashboard)
      const key = e.key.toLowerCase();
      if (isGKeyPressed) {
        setIsGKeyPressed(false);
        if (gKeyTimeoutRef.current) clearTimeout(gKeyTimeoutRef.current);

        e.preventDefault();
        switch (key) {
          case 'd':
            onNavigateTab('dashboard');
            break;
          case 'h':
            onNavigateTab('hermes');
            break;
          case 'w':
            onNavigateTab('web');
            break;
          case 'c':
            onNavigateTab('collective');
            break;
          case 's':
            onNavigateTab('swarm');
            break;
          case 'm':
            onNavigateTab('missions');
            break;
          case 'k':
            onNavigateTab('memory');
            break;
          case 'e':
            onNavigateTab('events');
            break;
          case 't':
            onNavigateTab('tools');
            break;
          case 'g':
            onNavigateTab('governance');
            break;
          case 'o':
            onNavigateTab('cognition');
            break;
          case 'a':
            onNavigateTab('goals');
            break;
          case 'f':
            onNavigateTab('federation');
            break;
          case 'v':
            onNavigateTab('evolution');
            break;
          case 'x':
            onNavigateTab('diagnostics');
            break;
          case ',':
            onNavigateTab('settings');
            break;
          default:
            break;
        }
        return;
      }

      if (key === 'g' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        setIsGKeyPressed(true);
        if (gKeyTimeoutRef.current) clearTimeout(gKeyTimeoutRef.current);
        gKeyTimeoutRef.current = setTimeout(() => {
          setIsGKeyPressed(false);
        }, 1200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gKeyTimeoutRef.current) clearTimeout(gKeyTimeoutRef.current);
    };
  }, [
    isGKeyPressed,
    onNavigateTab,
    onToggleShortcuts,
    onFocusCommandInput,
    onTriggerDemo,
    onRefreshData,
    onCloseModals,
    onToggleAskHermes,
  ]);

  return { isGKeyPressed };
}
