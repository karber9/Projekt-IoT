import nacl from "tweetnacl";

function hexToBytes(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error("NACL secret key must be a 64-character hex string.");
  }

  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
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
  const key = hexToBytes(keyHex);
  const encrypted = decodeBase64(ciphertext);
  const nonce = encrypted.slice(0, nacl.secretbox.nonceLength);
  const boxed = encrypted.slice(nacl.secretbox.nonceLength);
  const decrypted = nacl.secretbox.open(boxed, nonce, key);

  if (!decrypted) {
    throw new Error("WebSocket payload decryption failed.");
  }

  return new TextDecoder().decode(decrypted);
}

export function parseWsMessage(raw: string, keyHex: string | null): unknown {
  const data = JSON.parse(raw) as unknown;

  if (!data || typeof data !== "object") {
    throw new Error("WebSocket message must be a JSON object.");
  }

  const record = data as Record<string, unknown>;

  if (!record.encrypted) {
    return data;
  }

  if (typeof record.payload !== "string") {
    throw new Error("Encrypted WebSocket message missing payload.");
  }

  if (!keyHex) {
    throw new Error("Encrypted WebSocket message received without NACL secret key.");
  }

  return JSON.parse(decryptWsPayload(record.payload, keyHex));
}
