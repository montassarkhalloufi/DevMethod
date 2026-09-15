import { decodeTasks, encodeTasks } from './domain.mjs';
export const STORAGE_KEY = 'clair.tasks.v1';
export function readTasks(storage) {
  return decodeTasks(storage.getItem(STORAGE_KEY));
}
export function writeTasks(storage, tasks) {
  storage.setItem(STORAGE_KEY, encodeTasks(tasks));
}
