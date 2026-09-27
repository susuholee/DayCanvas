import { format, parseISO } from 'date-fns';
import type { Todo } from './supabase';

interface CategoryType {
  id: string;
  type: 'memo' | 'todo';
}

export const TODO_PRIORITIES = [
  { value: 3, label: '높음' },
  { value: 2, label: '보통' },
  { value: 1, label: '낮음' },
];

export function getTodoPriority(priority: number | null | undefined) {
  return TODO_PRIORITIES.some(option => option.value === priority) ? priority! : 2;
}

export function getTodayTodos(todos: Todo[], today: string, categories: CategoryType[] = []) {
  return todos.filter(todo => {
    if (todo.category === 'note') return false;
    const categoryType = categories.find(category => category.id === todo.category)?.type;
    if (categoryType === 'memo' || (!categoryType && ['learned', 'unknown', 'confused'].includes(todo.category))) return false;
    const date = parseISO(todo.due_date || todo.created_at);
    return !Number.isNaN(date.getTime()) && format(date, 'yyyy-MM-dd') === today;
  }).sort((a, b) =>
    Number(a.status === 'completed') - Number(b.status === 'completed') ||
    getTodoPriority(b.priority) - getTodoPriority(a.priority)
  );
}
