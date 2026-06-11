import nacl from "tweetnacl";

const NONCE_LENGTH = nacl.secretbox.nonceLength;
const KEY_LENGTH = nacl.secretbox.keyLength;

function parseSecretKey(keyHex: string): Uint8Array {
  if (keyHex.length !== KEY_LENGTH * 2) {
    throw new Error("WebSocket secret key must be 32 bytes encoded as 64 hex characters");
  }

  const key = new Uint8Array(KEY_LENGTH);

  for (let index = 0; index < key.length; index += 1) {
    const byte = Number.parseInt(keyHex.slice(index * 2, index * 2 + 2), 16);

    if (Number.isNaN(byte)) {
      throw new Error("WebSocket secret key must be a hex string");
    }

    key[index] = byte;
  }

  return key;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function decryptWsPayload(ciphertext: string, keyHex: string): string {
  const key = parseSecretKey(keyHex);
  const raw = decodeBase64(ciphertext);

  if (raw.length < NONCE_LENGTH) {
    throw new Error("Encrypted WebSocket payload is too short");
  }

  const nonce = raw.slice(0, NONCE_LENGTH);
  const encrypted = raw.slice(NONCE_LENGTH);
  const decrypted = nacl.secretbox.open(encrypted, nonce, key);

  if (!decrypted) {
    throw new Error("Unable to decrypt WebSocket payload");
  }

  return new TextDecoder().decode(decrypted);
}

export function parseWsMessage(
  raw: string,
  decryptPayload?: (payload: string) => string
): unknown {
  const data = JSON.parse(raw) as unknown;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("WebSocket message must be a JSON object");
  }

  const record = data as Record<string, unknown>;

  if (!record.encrypted) {
    return data;
  }

  const payload = record.payload;

  if (typeof payload !== "string") {
    throw new Error("Encrypted WebSocket message missing payload");
  }

  if (!decryptPayload) {
    throw new Error("Encrypted WebSocket message received without decryption key");
  }

  const decrypted = decryptPayload(payload);
  const parsed = JSON.parse(decrypted) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Decrypted WebSocket payload must be a JSON object");
  }

  return parsed;
}
