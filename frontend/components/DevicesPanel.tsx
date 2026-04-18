import { useEffect, useState } from "react";
import { getDevices, type Device } from "@/lib/api";

type DevicesPanelProps = {
  devices?: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
};

export default function DevicesPanel({
  devices,
  selectedDeviceId,
  onSelectDevice,
}: DevicesPanelProps) {
  const [apiDevices, setApiDevices] = useState<Device[]>([]);

  useEffect(() => {
    if (devices) {
      setApiDevices(devices);
      return;
    }

    const loadDevices = async () => {
      const result = await getDevices();
      setApiDevices(result);
    };

    void loadDevices();
  }, [devices]);

  const visibleDevices = devices ?? apiDevices;

  return (
    <section className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">Devices</h2>
        <p className="mt-1 text-xs text-slate-500">
          Select a destination device and inspect recent communication flow.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
        {visibleDevices.map((device) => {
          const isSelected = selectedDeviceId === device.device_id;
          const isOnline = device.status === "online";

          return (
            <button
              key={device.device_id}
              type="button"
              onClick={() => onSelectDevice(device.device_id)}
              className={`block w-full rounded-xl border p-2 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-800">{device.device_id}</p>
                <span
                className={`inline-block h-3 w-3 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-red-500"
                }`}
                />
              </div>
            </button>
          );
        })}

        {visibleDevices.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No devices available.
          </div>
        )}
      </div>
    </section>
  );
}