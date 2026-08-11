import { createHash, generateKeyPairSync, sign, verify, KeyObject } from 'crypto';
import { CryptographicProof } from '../../shared/types';
import { federationEventRepository } from './federationRepositories';

export class CryptographicProofEngine {
  private keyPairs: Map<string, { publicKey: KeyObject; privateKey: KeyObject }> = new Map();
  private proofs: Map<string, CryptographicProof> = new Map();

  constructor() {
    // In a real system, keys would be securely provisioned and distributed.
    // For this simulation, we'll generate them dynamically for hives.
  }

  public registerHive(hiveId: string) {
    if (this.keyPairs.has(hiveId)) return;
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    this.keyPairs.set(hiveId, { publicKey, privateKey });
  }

  public generateProof(taskId: string, providerHiveId: string, resultData: any): CryptographicProof {
    this.registerHive(providerHiveId);
    const keys = this.keyPairs.get(providerHiveId);
    if (!keys) throw new Error(`Keys not found for hive ${providerHiveId}`);

    const payloadString = JSON.stringify(resultData);
    const payloadHash = createHash('sha256').update(payloadString).digest('hex');

    const signature = sign('sha256', Buffer.from(payloadHash), keys.privateKey).toString('base64');

    const proof: CryptographicProof = {
      proofId: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      providerHiveId,
      payloadHash,
      signature,
      timestamp: new Date().toISOString(),
      verificationStatus: 'PENDING',
    };

    this.proofs.set(proof.proofId, proof);

    federationEventRepository.logEvent({
      eventId: `evt-proof-gen-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: providerHiveId,
      eventType: 'FEDERATED_TASK_SETTLED', // Using existing type for now
      details: { taskId, proofId: proof.proofId, payloadHash },
      governanceResult: 'ALLOWED',
      traceId: `trace-proof-${proof.proofId}`,
    });

    return proof;
  }

  public verifyProof(proofId: string): boolean {
    const proof = this.proofs.get(proofId);
    if (!proof) throw new Error(`Proof ${proofId} not found`);

    const keys = this.keyPairs.get(proof.providerHiveId);
    if (!keys) {
      proof.verificationStatus = 'INVALID';
      return false;
    }

    const isValid = verify(
      'sha256',
      Buffer.from(proof.payloadHash),
      keys.publicKey,
      Buffer.from(proof.signature, 'base64')
    );

    proof.verificationStatus = isValid ? 'VALID' : 'INVALID';

    federationEventRepository.logEvent({
      eventId: `evt-proof-ver-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'system',
      destinationHiveId: proof.providerHiveId,
      eventType: 'FEDERATED_TASK_SETTLED', // Reusing existing
      details: { taskId: proof.taskId, proofId, isValid },
      governanceResult: 'ALLOWED',
      traceId: `trace-verify-${proofId}`,
    });

    return isValid;
  }

  public getProof(proofId: string): CryptographicProof | undefined {
    return this.proofs.get(proofId);
  }
}

export const cryptographicProofEngine = new CryptographicProofEngine();
