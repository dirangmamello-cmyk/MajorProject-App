import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QueuedAction {
  id: string;
  table: 'transactions' | 'budgets' | 'goals' | 'goal_contributions';
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, any>;
  status: SyncStatus;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncState {
  queue: QueuedAction[];
  wifiOnly: boolean;
}

const STORAGE_KEY = 'ark_sync_queue';
const SETTINGS_KEY = 'ark_sync_settings';
const MAX_RETRIES = 5;

// ─── Queue Persistence (localStorage) ────────────────────────
function loadQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(queue: QueuedAction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getSyncSettings(): { wifiOnly: boolean } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { wifiOnly: false };
  } catch { return { wifiOnly: false }; }
}

export function setSyncSettings(settings: { wifiOnly: boolean }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Queue Operations ────────────────────────────────────────
export function enqueue(action: Omit<QueuedAction, 'id' | 'status' | 'createdAt' | 'retryCount'>): QueuedAction {
  const queue = loadQueue();
  const entry: QueuedAction = {
    ...action,
    id: crypto.randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(entry);
  saveQueue(queue);
  
  // Auto-trigger sync if online
  if (navigator.onLine) {
    syncAll();
  }
  return entry;
}

export function getQueue(): QueuedAction[] {
  return loadQueue();
}

export function clearSyncedItems() {
  const queue = loadQueue();
  saveQueue(queue.filter(q => q.status !== 'synced'));
}

export function getQueueSummary() {
  const queue = loadQueue();
  return {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    syncing: queue.filter(q => q.status === 'syncing').length,
    synced: queue.filter(q => q.status === 'synced').length,
    failed: queue.filter(q => q.status === 'failed').length,
  };
}

// ─── Conflict Resolution: Last-Write-Wins ───────────────────
function deduplicateQueue(queue: QueuedAction[]): QueuedAction[] {
  // For updates/deletes on the same record, keep only the latest
  const seen = new Map<string, QueuedAction>();
  for (const action of queue) {
    if (action.status === 'synced') continue;
    const key = `${action.table}:${action.operation}:${action.payload.id || 'new'}`;
    const existing = seen.get(key);
    if (!existing || new Date(action.createdAt) > new Date(existing.createdAt)) {
      seen.set(key, action);
    }
  }
  return Array.from(seen.values());
}

// ─── Execute a Single Sync Action ────────────────────────────
async function executeAction(action: QueuedAction): Promise<{ success: boolean; error?: string }> {
  try {
    const { table, operation, payload } = action;

    if (operation === 'insert') {
      const { error } = await supabase.from(table).insert(payload as any);
      if (error) return { success: false, error: error.message };
    } else if (operation === 'update') {
      const { id, ...rest } = payload;
      const { error } = await supabase.from(table).update(rest as any).eq('id', id);
      if (error) return { success: false, error: error.message };
    } else if (operation === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', payload.id);
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Unknown error' };
  }
}

// ─── Sync All Pending/Failed Items ──────────────────────────
let isSyncing = false;
const listeners: Set<() => void> = new Set();

export function onSyncChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners() {
  listeners.forEach(cb => cb());
}

export async function syncAll(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const settings = getSyncSettings();
  // Check Wi-Fi only preference using Network Information API
  if (settings.wifiOnly && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.type !== 'wifi' && conn.effectiveType !== '4g') {
      return { synced: 0, failed: 0 };
    }
  }

  isSyncing = true;
  notifyListeners();

  let queue = loadQueue();
  const actionable = deduplicateQueue(queue.filter(q => q.status === 'pending' || (q.status === 'failed' && q.retryCount < MAX_RETRIES)));

  let synced = 0;
  let failed = 0;

  // Sort by creation time (FIFO)
  actionable.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const action of actionable) {
    // Update status to syncing
    queue = loadQueue();
    const idx = queue.findIndex(q => q.id === action.id);
    if (idx >= 0) {
      queue[idx].status = 'syncing';
      saveQueue(queue);
      notifyListeners();
    }

    const result = await executeAction(action);

    queue = loadQueue();
    const idx2 = queue.findIndex(q => q.id === action.id);
    if (idx2 >= 0) {
      if (result.success) {
        queue[idx2].status = 'synced';
        synced++;
      } else {
        queue[idx2].status = 'failed';
        queue[idx2].retryCount++;
        queue[idx2].lastError = result.error;
        failed++;
      }
      saveQueue(queue);
      notifyListeners();
    }
  }

  // Clean synced items after a short delay
  setTimeout(() => {
    clearSyncedItems();
    notifyListeners();
  }, 3000);

  isSyncing = false;
  notifyListeners();
  return { synced, failed };
}

export function getIsSyncing() { return isSyncing; }

// ─── Auto-Sync on Reconnect ─────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncAll();
  });

  // Background retry every 30 seconds
  setInterval(() => {
    if (navigator.onLine) {
      const queue = loadQueue();
      const hasPending = queue.some(q => q.status === 'pending' || q.status === 'failed');
      if (hasPending) syncAll();
    }
  }, 30000);
}
