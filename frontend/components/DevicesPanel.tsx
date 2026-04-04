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
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Devices</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a destination device and inspect recent communication flow.
        </p>
      </div>

      <div className="space-y-4">
        {mockLogs.map((device) => {
          const isSelected = selectedDeviceId === device.id;
          const isServer = device.id === "server";

          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelectDevice(device.id)}
              className={`block w-full rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-800">{device.id}</h3>

                    {isServer && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        default
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500">{device.id}</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    device.level === "info"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {device.level}
                </span>
              </div>

              {isServer && (
                <p className="mt-3 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-700">
                  Default choice — the server will choose the destination device
                  for you.
                </p>
              )}

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">Route mode:</span>{" "}
                  {device.message}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Topic:</span>{" "}
                  {device.timestamp}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Last outbound:</span>{" "}
                  {device.timestamp}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Last inbound:</span>{" "}
                  {device.source}
                </p>

                <div>
                  <p className="mb-1 font-medium text-slate-700">
                    Payload preview:
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                    {device.message}
                  </pre>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}