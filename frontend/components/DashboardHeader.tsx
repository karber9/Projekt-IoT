import { DATA_MODE, IS_MOCK_MODE } from "@/lib/config";

export default function DashboardHeader() {
  return (
    <header className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            Control Center
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-800">
            Operations Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Send operations to the backend, monitor connected devices, and follow
            recent communication logs.
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            IS_MOCK_MODE
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {DATA_MODE} mode
        </span>
      </div>
    </header>
  );
}