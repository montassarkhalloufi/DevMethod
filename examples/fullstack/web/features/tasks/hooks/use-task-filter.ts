"use client";
import { useState } from 'react';
import { filterTasks, Task } from '../model/tasks';
export function useTaskFilter(tasks: readonly Task[]) {
  const [query, setQuery] = useState('');
  return { query, setQuery, visibleTasks: filterTasks(tasks, query) };
}
