import type { Device } from "@/lib/api";

type EncryptionStatusMeta = {
  label: string;
  badgeClassName: string;
  description: string;
};

export function getDeviceEncryptionMeta(
  device: Device
): EncryptionStatusMeta | null {
  if (
    !device.encryption_status &&
    !device.public_key_fingerprint &&
    !device.last_key_rotation
  ) {
    return null;
  }

  const status = (device.encryption_status ?? "unknown").toLowerCase();

  if (status === "available") {
    return {
      label: "Encryption ready",
      badgeClassName: "bg-green-50 text-green-700",
      description: buildDescription(device, "Backend reports encryption is available."),
    };
  }

  if (status === "missing_key") {
    return {
      label: "Missing key",
      badgeClassName: "bg-amber-50 text-amber-700",
      description: buildDescription(device, "Backend reports missing encryption key."),
    };
  }

  if (status === "error") {
    return {
      label: "Encryption error",
      badgeClassName: "bg-red-50 text-red-700",
      description: buildDescription(device, "Backend reports encryption error."),
    };
  }

  return {
    label: "Encryption unknown",
    badgeClassName: "bg-slate-100 text-slate-600",
    description: buildDescription(device, "Encryption status is not confirmed."),
  };
}

function buildDescription(device: Device, baseDescription: string) {
  const details = [baseDescription];

  if (device.public_key_fingerprint) {
    details.push(`Fingerprint: ${device.public_key_fingerprint}`);
  }

  if (device.last_key_rotation) {
    details.push(`Last key rotation: ${device.last_key_rotation}`);
  }

  return details.join(" ");
}
