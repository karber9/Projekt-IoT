"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OperationForm from "@/components/OperationForm";
import OperationResponseCard from "@/components/OperationResponseCard";
import DevicesPanel from "@/components/DevicesPanel";
import LogsPanel from "@/components/LogsPanel";
import DashboardHeader from "@/components/DashboardHeader";
import HistoryPanel from "@/components/HistoryPanel";
import BatchOperationsPanel from "@/components/BatchOperationsPanel";
import OperationModeSwitch, {
  type OperationMode,
} from "@/components/OperationModeSwitch";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDevices } from "@/features/dashboard/useDevices";
import { useSingleOperation } from "@/features/dashboard/useSingleOperation";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { deriveCommunicationLogs } from "@/features/logs/deriveLogs";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isReady, logout, token, userEmail } = useAuth();
  const realtime = useRealtimeEvents(isAuthenticated ? token : null);
  const logs = deriveCommunicationLogs(realtime.events);
  const [operationMode, setOperationMode] = useState<OperationMode>("single");
  const handleUnauthorized = useCallback(() => {
    logout("expired");
    router.replace("/login");
  }, [logout, router]);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  const {
    devices,
    selectedDevice,
    selectedDeviceId,
    selectedDeviceUnavailable,
    toggleSelectedDevice,
  } = useDevices({
    enabled: isReady && isAuthenticated,
    realtimeEvents: realtime.events,
    realtimeStatus: realtime.status,
    onUnauthorized: handleUnauthorized,
  });

  const singleOperation = useSingleOperation({
    selectedDeviceId,
    selectedDeviceUnavailable,
    realtimeEvents: realtime.events,
    onUnauthorized: handleUnauthorized,
  });

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-2 py-2 sm:px-4 sm:py-3 lg:h-screen lg:px-5 lg:py-4">
      <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-col lg:h-full">
        <DashboardHeader
          userEmail={userEmail}
          onLogout={() => {
            logout();
            router.replace("/login");
          }}
        />

        <div className="mt-3 grid flex-1 gap-3 lg:mt-4 lg:min-h-0 lg:grid-cols-12 lg:gap-4">
          <div className="min-h-0 lg:col-span-2">
            <DevicesPanel
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={toggleSelectedDevice}
            />
          </div>

          <section className="relative flex min-h-[480px] flex-col overflow-hidden rounded-xl bg-white shadow-sm lg:col-span-4 lg:min-h-0">
            <div className="relative flex min-h-0 flex-1 flex-col p-2.5 sm:p-3">
              <OperationModeSwitch
                mode={operationMode}
                onChange={setOperationMode}
              />
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {operationMode === "single" ? (
                  <OperationForm
                    operation={singleOperation.operation}
                    setOperation={singleOperation.setOperation}
                    a={singleOperation.a}
                    setA={singleOperation.setA}
                    b={singleOperation.b}
                    setB={singleOperation.setB}
                    loading={singleOperation.loading}
                    onSubmit={singleOperation.submitOperation}
                    error={singleOperation.error}
                    selectedDeviceId={selectedDeviceId}
                    selectedDeviceStatus={selectedDevice?.status}
                  />
                ) : (
                  <BatchOperationsPanel realtimeEvents={realtime.events} />
                )}
              </div>
            </div>

            <OperationResponseCard
              response={singleOperation.response}
              onClose={() => singleOperation.setResponse(null)}
            />
          </section>

          <div className="min-h-0 lg:col-span-2">
            <HistoryPanel history={singleOperation.history} />
          </div>

          <div className="min-h-0 lg:col-span-4">
            <LogsPanel
              devices={devices}
              logs={logs}
              connectionStatus={realtime.status}
              connectionError={realtime.error}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
