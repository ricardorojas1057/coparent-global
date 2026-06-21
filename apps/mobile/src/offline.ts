import { QueuedMutation } from './api';
import * as SecureStore from 'expo-secure-store';

// Family snapshots remain in memory. Only pending mutations persist in encrypted device storage.
const memoryCache = new Map<string, unknown>();
let mutationQueue: QueuedMutation[] = [];
let queueLoaded = false;
const QUEUE_STORAGE_KEY = 'coparent.offline.mutations.v1';
const MAX_QUEUED_MUTATIONS = 50;

async function loadMutationQueue() {
  if (queueLoaded) return;
  queueLoaded = true;
  try {
    const stored = await SecureStore.getItemAsync(QUEUE_STORAGE_KEY);
    mutationQueue = stored ? (JSON.parse(stored) as QueuedMutation[]) : [];
  } catch {
    mutationQueue = [];
  }
}

async function persistMutationQueue() {
  if (!mutationQueue.length) {
    await SecureStore.deleteItemAsync(QUEUE_STORAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(QUEUE_STORAGE_KEY, JSON.stringify(mutationQueue));
}

export async function cacheData<T>(key: string, value: T) {
  memoryCache.set(key, value);
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  return (memoryCache.get(key) as T | undefined) ?? null;
}

export function createMutationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export async function queueMutation(input: Omit<QueuedMutation, 'id' | 'createdAt'>) {
  await loadMutationQueue();
  const mutation: QueuedMutation = {
    ...input,
    id: createMutationId(),
    createdAt: new Date().toISOString(),
  };
  mutationQueue = [...mutationQueue, mutation].slice(-MAX_QUEUED_MUTATIONS);
  await persistMutationQueue();
  return mutation;
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  await loadMutationQueue();
  return [...mutationQueue];
}

export async function flushQueuedMutations(execute: (mutation: QueuedMutation) => Promise<unknown>) {
  await loadMutationQueue();
  const remaining: QueuedMutation[] = [];
  let synced = 0;
  for (const mutation of mutationQueue) {
    try {
      await execute(mutation);
      synced += 1;
    } catch {
      remaining.push(mutation);
    }
  }
  mutationQueue = remaining;
  await persistMutationQueue();
  return { synced, remaining: remaining.length };
}

export async function clearOfflineData() {
  memoryCache.clear();
  mutationQueue = [];
  queueLoaded = true;
  await SecureStore.deleteItemAsync(QUEUE_STORAGE_KEY);
}
