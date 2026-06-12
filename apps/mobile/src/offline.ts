import { QueuedMutation } from './api';

// Sensitive family data remains only in memory until encrypted offline storage is introduced.
const memoryCache = new Map<string, unknown>();
let mutationQueue: QueuedMutation[] = [];

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
  const mutation: QueuedMutation = {
    ...input,
    id: createMutationId(),
    createdAt: new Date().toISOString(),
  };
  mutationQueue = [...mutationQueue, mutation];
  return mutation;
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  return [...mutationQueue];
}

export async function flushQueuedMutations(execute: (mutation: QueuedMutation) => Promise<unknown>) {
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
  return { synced, remaining: remaining.length };
}

export async function clearOfflineData() {
  memoryCache.clear();
  mutationQueue = [];
}
