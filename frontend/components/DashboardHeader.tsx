type DashboardHeaderProps = {
  userEmail: string | null;
  onLogout: () => void;
};

export default function DashboardHeader({
  userEmail,
  onLogout,
}: DashboardHeaderProps) {
    return (
      <header className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
            Control Center
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-800 sm:text-2xl">
            Operations Dashboard
          </h1>
          <p className="mt-1 max-w-3xl text-xs text-slate-500">
            Send operations to the backend, monitor connected devices, and follow
            recent communication logs.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          {userEmail && (
            <p className="max-w-full truncate text-xs font-medium text-slate-500 sm:max-w-[320px] lg:max-w-[240px]">
              Signed in as <span className="text-slate-800">{userEmail}</span>
            </p>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            Logout
          </button>
        </div>
      </header>
    );
  }
