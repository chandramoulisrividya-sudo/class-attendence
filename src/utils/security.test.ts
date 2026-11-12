import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTokenSignature,
  createQRPayload,
  parseAndValidateQR,
  calculateDistanceMeters,
} from './security.js';

test('Security: generateTokenSignature produces deterministic signature', () => {
  const sessionId = 'sess-123';
  const timestamp = 1700000000000;
  const secretKey = 'college-secret-key-456';

  const sig1 = generateTokenSignature(sessionId, timestamp, secretKey);
  const sig2 = generateTokenSignature(sessionId, timestamp, secretKey);
  assert.equal(sig1, sig2);
  assert.equal(typeof sig1, 'string');
  assert.ok(sig1.length >= 8);
});

test('Security: Different secrets or sessions produce different signatures', () => {
  const t = 1700000000000;
  const s1 = generateTokenSignature('sess-1', t, 'secretA');
  const s2 = generateTokenSignature('sess-2', t, 'secretA');
  const s3 = generateTokenSignature('sess-1', t, 'secretB');

  assert.notEqual(s1, s2);
  assert.notEqual(s1, s3);
});

test('Security: createQRPayload generates valid formatted string and payload', () => {
  const sessionId = 'session-cse-301';
  const secret = 'super-secret';
  const { payload, encoded } = createQRPayload(sessionId, secret, 25);

  assert.equal(payload.sId, sessionId);
  assert.equal(payload.v, 1);
  assert.ok(payload.exp > payload.t);
  assert.ok(encoded.startsWith('SMARTATTEND:session-cse-301:'));
});

test('Security: parseAndValidateQR succeeds on fresh token', () => {
  const sessionId = 'session-math-101';
  const secretKey = 'math-secret-key';
  const { encoded } = createQRPayload(sessionId, secretKey, 20);

  const keyMap = (sId: string) => (sId === sessionId ? secretKey : undefined);
  const result = parseAndValidateQR(encoded, keyMap);

  assert.equal(result.valid, true);
  assert.equal(result.code, 'VALID');
  assert.equal(result.sessionId, sessionId);
});

test('Security: parseAndValidateQR detects expired QR code', () => {
  const sessionId = 'session-expired';
  const secretKey = 'my-secret';
  // generate a token expired 10 seconds ago
  const now = Date.now();
  const pastTimestamp = now - 25000;
  const pastExpires = now - 10000;
  const sig = generateTokenSignature(sessionId, pastTimestamp, secretKey);
  const expiredQr = `SMARTATTEND:${sessionId}:${pastTimestamp}:${pastExpires}:${sig}`;

  const keyMap = (sId: string) => (sId === sessionId ? secretKey : undefined);
  const result = parseAndValidateQR(expiredQr, keyMap, 1000); // 1s grace period

  assert.equal(result.valid, false);
  assert.equal(result.code, 'EXPIRED');
  assert.ok(result.error?.includes('expired'));
});

test('Security: parseAndValidateQR detects forged signature', () => {
  const sessionId = 'session-tamper';
  const secretKey = 'correct-secret';
  const now = Date.now();
  const forgedSig = '0000000000000000';
  const forgedQr = `SMARTATTEND:${sessionId}:${now}:${now + 20000}:${forgedSig}`;

  const keyMap = (sId: string) => (sId === sessionId ? secretKey : undefined);
  const result = parseAndValidateQR(forgedQr, keyMap);

  assert.equal(result.valid, false);
  assert.equal(result.code, 'INVALID_SIGNATURE');
});

test('Security: calculateDistanceMeters accurately calculates classroom proximity', () => {
  // LH-101 coordinates vs student standing right nearby (within 10-15 meters)
  const lhLat = 12.9716;
  const lhLon = 77.5946;
  const studentNearbyLat = 12.97165;
  const studentNearbyLon = 77.59465;

  const distance = calculateDistanceMeters(lhLat, lhLon, studentNearbyLat, studentNearbyLon);
  assert.ok(distance > 0 && distance < 30, `Expected distance < 30m, got ${distance}`);

  // Someone 2 km away off campus
  const farLat = 12.9900;
  const farLon = 77.5946;
  const farDistance = calculateDistanceMeters(lhLat, lhLon, farLat, farLon);
  assert.ok(farDistance > 1000);
});
