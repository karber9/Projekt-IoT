import { type Device } from "@/lib/api";
import { getDeviceEncryptionMeta } from "@/features/security/encryptionStatus";

type DevicesPanelProps = {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
};

export default function DevicesPanel({
  devices,
  selectedDeviceId,
}: DevicesPanelProps) {
  return (
    <section className="flex h-full flex-col rounded-xl bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 shrink-0">
        <h2 className="text-base font-semibold text-slate-800">Devices</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-2 lg:gap-0 lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">

        {devices.map((device) => {
          const isSelected = selectedDeviceId === device.device_id;
          const isOnline = device.status === "online";
          const statusLabel = device.status ?? "unknown";
          const encryptionMeta = getDeviceEncryptionMeta(device);

          return (
            <div
              key={device.device_id}
              className={`block min-w-[200px] rounded-lg border p-2 text-left transition lg:w-full lg:min-w-0 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : !isOnline
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
              title={
                isOnline
                  ? `Select ${device.device_id}`
                  : `${device.device_id} is offline`
              }
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-800">{device.device_id}</p>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  {statusLabel}
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </span>
              </div>
              {encryptionMeta && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${encryptionMeta.badgeClassName}`}
                    title={encryptionMeta.description}
                  >
                    {encryptionMeta.label}
                  </span>
                  {device.public_key_fingerprint && (
                    <span
                      className="max-w-[96px] truncate text-[10px] text-slate-400"
                      title={device.public_key_fingerprint}
                    >
                      {device.public_key_fingerprint}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {devices.length === 0 && (
          <div className="min-w-[200px] rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 lg:min-w-0">
            No devices available.
          </div>
        )}
      </div>
    </section>
  );
}
