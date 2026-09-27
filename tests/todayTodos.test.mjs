import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTodayTodos, getTodoPriority } from '../src/lib/todayTodos.ts';

const makeTodo = (id, overrides = {}) => ({
  id, category: 'improvement', status: 'pending',
  due_date: '2026-09-27', created_at: '2026-09-26T12:00:00Z', ...overrides,
});

test('sorts by priority while keeping completed tasks below pending tasks', () => {
  const todos = [makeTodo('low', { priority: 1 }), makeTodo('done-high', { priority: 3, status: 'completed' }),
    makeTodo('normal'), makeTodo('high', { priority: 3 }), makeTodo('normal-2', { priority: 2 })];
  assert.deepEqual(getTodayTodos(todos, '2026-09-27').map(todo => todo.id), ['high', 'normal', 'normal-2', 'low', 'done-high']);
  assert.equal(todos[0].id, 'low');
});

test('legacy and unset priorities default to normal', () => {
  for (const priority of [undefined, null, 0, 99]) assert.equal(getTodoPriority(priority), 2);
  for (const priority of [1, 2, 3]) assert.equal(getTodoPriority(priority), priority);
});

test('includes today plans, excludes diaries, memos and other dates', () => {
  const todos = [
    makeTodo('today'), makeTodo('diary', { category: 'note' }),
    makeTodo('memo', { category: 'learned' }),
    makeTodo('custom-memo', { category: 'study' }),
    makeTodo('custom-plan', { category: 'work' }),
    makeTodo('tomorrow', { due_date: '2026-09-28' }),
    makeTodo('invalid', { due_date: 'invalid' }),
  ];
  assert.deepEqual(getTodayTodos(todos, '2026-09-27', [
    { id: 'study', type: 'memo' }, { id: 'work', type: 'todo' },
  ]).map(todo => todo.id), ['today', 'custom-plan']);
});

test('uses local dates for timestamps and falls back to creation date', () => {
  const localMidnight = new Date(2026, 8, 27, 0, 5).toISOString();
  const todos = [
    makeTodo('created-today', { due_date: null, created_at: localMidnight }),
    makeTodo('due-today', { due_date: localMidnight }),
    makeTodo('explicit-date', { due_date: '2026-09-28', created_at: localMidnight }),
  ];
  assert.deepEqual(getTodayTodos(todos, '2026-09-27').map(todo => todo.id), ['created-today', 'due-today']);
});

test('keeps completed tasks last without mutating the original list', () => {
  const todos = [makeTodo('done', { status: 'completed' }), makeTodo('pending')];
  assert.deepEqual(getTodayTodos(todos, '2026-09-27').map(todo => todo.id), ['pending', 'done']);
  assert.equal(todos[0].id, 'done');
  assert.deepEqual(getTodayTodos(todos, '2026-09-28'), []);
});
