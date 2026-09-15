import { readFile, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { TaskError, validateStoredTasks } from './domain.mjs';

export function createStore(dataFile) {
  let tail = Promise.resolve();
  const enqueue = (fn) => {
    const result = tail.then(fn);
    tail = result.catch(() => {});
    return result;
  };
  async function read() {
    let raw;
    try {
      raw = await readFile(dataFile, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
    return validateStoredTasks(JSON.parse(raw));
  }
  async function save(tasks) {
    await mkdir(dirname(dataFile), { recursive: true });
    const temporary = `${dataFile}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try {
        await handle.writeFile(`${JSON.stringify(tasks, null, 2)}\n`);
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(temporary, dataFile);
    } finally {
      await unlink(temporary).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
  return {
    list: () => enqueue(read),
    create: (input) =>
      enqueue(async () => {
        const tasks = await read();
        const task = { id: randomUUID(), title: input.title, done: false };
        tasks.push(task);
        await save(tasks);
        return task;
      }),
    update: (id, input) =>
      enqueue(async () => {
        const tasks = await read();
        const task = tasks.find((task) => task.id === id);
        if (!task) throw new TaskError('Task not found.', 404);
        Object.assign(task, input);
        await save(tasks);
        return task;
      }),
    remove: (id) =>
      enqueue(async () => {
        const tasks = await read();
        const index = tasks.findIndex((task) => task.id === id);
        if (index === -1) throw new TaskError('Task not found.', 404);
        tasks.splice(index, 1);
        await save(tasks);
      }),
  };
}
