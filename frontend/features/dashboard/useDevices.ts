import { useCallback, useEffect, useState } from "react";
import {
  ApiUnauthorizedError,
  getDevices,
  type Device,
} from "@/lib/api";
import type {
  RealtimeConnectionStatus,
  RealtimeEvent,
} from "@/features/realtime/types";

const DEVICE_REFRESH_INTERVAL_MS = 5000;

type UseDevicesOptions = {
  enabled: boolean;
  realtimeEvents: RealtimeEvent[];
  realtimeStatus: RealtimeConnectionStatus;
  onUnauthorized: () => void;
};

export function useDevices({
  enabled,
  realtimeEvents,
  realtimeStatus,
  onUnauthorized,
}: UseDevicesOptions) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const selectedDevice = selectedDeviceId
    ? devices.find((device) => device.device_id === selectedDeviceId)
    : undefined;
  const selectedDeviceUnavailable =
    Boolean(selectedDeviceId) && selectedDevice?.status !== "online";

  const loadDevices = useCallback(async () => {
    try {
      const result = await getDevices();
      setDevices(result);
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized();
      }
    }
  }, [onUnauthorized]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadDevices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [enabled, loadDevices]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadDevices();
    }, DEVICE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, loadDevices]);

  useEffect(() => {
    if (enabled && realtimeStatus === "connected") {
      const timeoutId = window.setTimeout(() => {
        void loadDevices();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [enabled, loadDevices, realtimeStatus]);

  useEffect(() => {
    const deviceEvents = realtimeEvents.filter(
      (event) => event.type === "device.updated"
    );

    if (deviceEvents.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDevices((currentDevices) => {
        const nextDevices = new Map(
          currentDevices.map((device) => [device.device_id, device])
        );

        for (const event of [...deviceEvents].reverse()) {
          const currentDevice = nextDevices.get(event.device_id);
          nextDevices.set(event.device_id, {
            ...currentDevice,
            device_id: event.device_id,
            status: event.status,
            last_seen: event.last_seen,
          });
        }

        return Array.from(nextDevices.values()).sort((left, right) =>
          left.device_id.localeCompare(right.device_id)
        );
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [realtimeEvents]);

  useEffect(() => {
    if (selectedDeviceUnavailable) {
      const timeoutId = window.setTimeout(() => {
        setSelectedDeviceId("");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [selectedDeviceUnavailable]);

  const toggleSelectedDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId((currentDeviceId) =>
      currentDeviceId === deviceId ? "" : deviceId
    );
  }, []);

  return {
    devices,
    selectedDevice,
    selectedDeviceId,
    selectedDeviceUnavailable,
    toggleSelectedDevice,
  };
}
