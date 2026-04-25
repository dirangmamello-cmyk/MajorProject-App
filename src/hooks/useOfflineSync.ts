import { useState, useEffect, useCallback } from "react";
import { getQueueSummary, syncAll, onSyncChange, getIsSyncing, getSyncSettings, setSyncSettings } from "@/lib/syncQueue";
import { logSync } from "@/lib/extendedStore";
 
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
 
    // Log sync result to sync_logs table in Supabase
    const status = result.failed > 0 && result.synced === 0
      ? 'failed'
      : result.failed > 0
      ? 'partial'
      : 'success';
 
    logSync({
      sync_status: status,
      records_sent: result.synced,
      records_received: 0,
    }).catch(() => {}); // fire-and-forget, don't block UI
 
    return result;
  }, []);
 
  const toggleWifiOnly = useCallback((val: boolean) => {
    setWifiOnly(val);
    setSyncSettings({ wifiOnly: val });
  }, []);
 
  return { isOnline, isSyncing, summary, triggerSync, wifiOnly, toggleWifiOnly };
}