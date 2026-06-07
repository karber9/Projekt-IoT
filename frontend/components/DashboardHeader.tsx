export default function DashboardHeader() {
    return (
      <header className="rounded-2xl bg-white p-6 shadow-sm">
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
      </header>
    );
  }