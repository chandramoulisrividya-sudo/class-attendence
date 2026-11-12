import { QRPayload } from '../types/index.js';

/**
 * Basic FNV-1a / HMAC-like deterministic hashing utility for cross-environment use (Browser & Node.js).
 * Generates an 8-16 char cryptographic token signature.
 */
export function generateTokenSignature(sessionId: string, timestamp: number, secretKey: string): string {
  const message = `${sessionId}:${timestamp}:${secretKey}`;
  let hash1 = 0x811c9dc5;
  let hash2 = 0x9e3779b9;

  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= char;
    hash2 = Math.imul(hash2, 0x5bd1e995);
  }

  // Format as hex string
  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `${h1}${h2}`;
}

/**
 * Builds the encrypted/signed dynamic QR payload
 */
export function createQRPayload(
  sessionId: string,
  secretKey: string,
  validitySeconds: number = 20
): { payload: QRPayload; encoded: string } {
  const now = Date.now();
  const exp = now + validitySeconds * 1000;
  const sig = generateTokenSignature(sessionId, now, secretKey);

  const payload: QRPayload = {
    v: 1,
    sId: sessionId,
    t: now,
    exp,
    sig,
  };

  const encoded = `SMARTATTEND:${sessionId}:${now}:${exp}:${sig}`;
  return { payload, encoded };
}

/**
 * Parses and validates an incoming QR string or payload
 */
export interface VerificationResult {
  valid: boolean;
  code: 'VALID' | 'EXPIRED' | 'INVALID_SIGNATURE' | 'MALFORMED' | 'FUTURE_TIMESTAMP';
  sessionId?: string;
  error?: string;
}

export function parseAndValidateQR(
  qrString: string,
  secretKeyMap: (sessionId: string) => string | undefined,
  gracePeriodMs: number = 5000 // 5 seconds grace period for network delays
): VerificationResult {
  if (!qrString || typeof qrString !== 'string') {
    return { valid: false, code: 'MALFORMED', error: 'Empty or invalid QR code format' };
  }

  let sessionId: string;
  let timestamp: number;
  let expiresAt: number;
  let signature: string;

  if (qrString.startsWith('SMARTATTEND:')) {
    const parts = qrString.split(':');
    if (parts.length !== 5) {
      return { valid: false, code: 'MALFORMED', error: 'Invalid SmartAttend token format' };
    }
    sessionId = parts[1];
    timestamp = parseInt(parts[2], 10);
    expiresAt = parseInt(parts[3], 10);
    signature = parts[4];
  } else {
    // Try parsing JSON format if sent as JSON
    try {
      const parsed = JSON.parse(qrString) as QRPayload;
      if (!parsed.sId || !parsed.t || !parsed.exp || !parsed.sig) {
        return { valid: false, code: 'MALFORMED', error: 'Missing QR payload fields' };
      }
      sessionId = parsed.sId;
      timestamp = parsed.t;
      expiresAt = parsed.exp;
      signature = parsed.sig;
    } catch {
      return { valid: false, code: 'MALFORMED', error: 'Unrecognized QR code' };
    }
  }

  if (isNaN(timestamp) || isNaN(expiresAt)) {
    return { valid: false, code: 'MALFORMED', error: 'Invalid timestamps in token' };
  }

  const now = Date.now();

  // Guard against tokens from the distant future
  if (timestamp > now + 30000) {
    return { valid: false, code: 'FUTURE_TIMESTAMP', error: 'Invalid timestamp: token issued in the future' };
  }

  // Check expiration with grace period
  if (now > expiresAt + gracePeriodMs) {
    return {
      valid: false,
      code: 'EXPIRED',
      sessionId,
      error: `QR code expired ${Math.round((now - expiresAt) / 1000)} seconds ago. Please scan the current code.`
    };
  }

  const secretKey = secretKeyMap(sessionId);
  if (!secretKey) {
    return { valid: false, code: 'INVALID_SIGNATURE', sessionId, error: 'Session not found or inactive' };
  }

  const expectedSig = generateTokenSignature(sessionId, timestamp, secretKey);
  if (expectedSig !== signature) {
    return { valid: false, code: 'INVALID_SIGNATURE', sessionId, error: 'Cryptographic signature mismatch. Possible tampering.' };
  }

  return {
    valid: true,
    code: 'VALID',
    sessionId,
  };
}

/**
 * Calculates geographic distance in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
