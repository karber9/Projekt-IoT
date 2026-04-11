import { mockLogs } from "@/data/mockDevices";

type DevicesPanelProps = {
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
};

export default function DevicesPanel({
  selectedDeviceId,
  onSelectDevice,
}: DevicesPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">Devices</h2>
        <p className="mt-1 text-xs text-slate-500">
          Select a destination device and inspect recent communication flow.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
        {mockLogs.map((device) => {
          const isSelected = selectedDeviceId === device.id;
          const isOnline = device.status === "online";

          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelectDevice(device.id)}
              className={`block w-full rounded-xl border p-2 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-800">{device.id}</p>
                <span
                className={`inline-block h-3 w-3 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-red-500"
                }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}