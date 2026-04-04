export default function ConnectionStatusPanel() {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Connection status
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Live device-server connection events and activity logs will appear here.
        </p>
      </section>
    );
  }