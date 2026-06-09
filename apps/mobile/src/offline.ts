import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueuedMutation } from './api';

const queueKey = 'coparent.offlineQueue';
const cachePrefix = 'coparent.cache.';

export async function cacheData<T>(key: string, value: T) {
  await AsyncStorage.setItem(`${cachePrefix}${key}`, JSON.stringify(value));
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(`${cachePrefix}${key}`);
  return value ? (JSON.parse(value) as T) : null;
}

export async function queueMutation(input: Omit<QueuedMutation, 'id' | 'createdAt'>) {
  const queue = await getQueuedMutations();
  const mutation: QueuedMutation = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(queueKey, JSON.stringify([...queue, mutation]));
  return mutation;
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  const value = await AsyncStorage.getItem(queueKey);
  return value ? (JSON.parse(value) as QueuedMutation[]) : [];
}

export async function flushQueuedMutations(execute: (mutation: QueuedMutation) => Promise<unknown>) {
  const queue = await getQueuedMutations();
  const remaining: QueuedMutation[] = [];
  let synced = 0;
  for (const mutation of queue) {
    try {
      await execute(mutation);
      synced += 1;
    } catch {
      remaining.push(mutation);
    }
  }
  await AsyncStorage.setItem(queueKey, JSON.stringify(remaining));
  return { synced, remaining: remaining.length };
}
