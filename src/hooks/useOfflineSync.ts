import { useState, useEffect, useCallback } from "react";
import { getQueueSummary, syncAll, onSyncChange, getIsSyncing, getSyncSettings, setSyncSettings } from "@/lib/syncQueue";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(getIsSyncing());
  const [summary, setSummary] = useState(getQueueSummary());
  const [wifiOnly, setWifiOnly] = useState(getSyncSettings().wifiOnly);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSyncChange(() => {
      setSummary(getQueueSummary());
      setIsSyncing(getIsSyncing());
    });
    return () => { unsubscribe(); };
  }, []);

  const triggerSync = useCallback(async () => {
    const result = await syncAll();
    setSummary(getQueueSummary());
    return result;
  }, []);

  const toggleWifiOnly = useCallback((val: boolean) => {
    setWifiOnly(val);
    setSyncSettings({ wifiOnly: val });
  }, []);

  return { isOnline, isSyncing, summary, triggerSync, wifiOnly, toggleWifiOnly };
}
