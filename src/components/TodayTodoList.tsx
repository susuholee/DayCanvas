import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase, type Todo } from '../lib/supabase';
import { getTodayTodos, getTodoPriority, TODO_PRIORITIES } from '../lib/todayTodos';
import type { CustomCategory } from './CategoryManagerModal';
import { ConfirmModal } from './ConfirmModal';

interface TodayTodoListProps {
  todos: Todo[];
  userId: string;
  categories: CustomCategory[];
  disabled: boolean;
  onAlert: (message: string, type: 'success' | 'error') => void;
}

function TodayTodoItem({ todo, userId, disabled, onAlert }: Pick<TodayTodoListProps, 'userId' | 'disabled' | 'onAlert'> & { todo: Todo }) {
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const queryKey = ['todos', userId];
  const mutationKey = ['today-todo-update', userId];
  const updateMutation = useMutation({
    mutationKey,
    mutationFn: async (updates: Partial<Pick<Todo, 'status' | 'priority'>>) => {
      const { error } = await supabase.from('todos').update(updates)
        .eq('id', todo.id).eq('user_id', userId).select('id').single();
      if (error) throw error;
    },
    onMutate: async updates => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Todo[]>(queryKey)?.find(item => item.id === todo.id);
      queryClient.setQueryData<Todo[]>(queryKey, current => current?.map(item => item.id === todo.id ? { ...item, ...updates } : item));
      return { previous };
    },
    onError: (_error, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Todo[]>(queryKey, current => current?.map(item => item.id === todo.id ? context.previous! : item));
      }
      onAlert('변경 내용을 저장하지 못해 이전 상태로 되돌렸습니다. 다시 시도해 주세요.', 'error');
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey });
      }
    },
  });
  const deleteMutation = useMutation({
    mutationKey,
    mutationFn: async () => {
      const { error } = await supabase.from('todos').delete()
        .eq('id', todo.id).eq('user_id', userId).select('id').single();
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<Todo[]>(queryKey, current => current?.filter(item => item.id !== todo.id));
    },
    onError: () => onAlert('할 일을 삭제하지 못했습니다. 다시 시도해 주세요.', 'error'),
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey });
      }
    },
  });
  const isBusy = disabled || updateMutation.isPending || deleteMutation.isPending;
  const done = todo.status === 'completed';
  const priority = getTodoPriority(todo.priority);

  return (
    <li className={`flex flex-wrap items-center gap-3 py-3 px-2 rounded-xl transition-colors ${done ? 'bg-emerald-50/50' : ''}`}>
      <label className="flex flex-1 min-w-0 items-center gap-3 py-2 cursor-pointer">
        <input type="checkbox" checked={done}
          aria-label={`${todo.title} 완료`}
          onChange={event => updateMutation.mutate({ status: event.target.checked ? 'completed' : 'pending' })}
          disabled={isBusy}
          className="w-6 h-6 shrink-0 cursor-pointer accent-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 disabled:cursor-wait"
        />
        <span className={`text-sm font-medium break-words min-w-0 ${done ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>{todo.title}</span>
      </label>
      <span role="status" className="text-xs text-zinc-400">{updateMutation.isPending ? '저장 중...' : done ? '완료' : ''}</span>
      <select aria-label={`${todo.title} 우선순위`} value={priority}
        onChange={event => updateMutation.mutate({ priority: Number(event.target.value) })}
        disabled={isBusy}
        className={`rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-50 ${priority === 3 ? 'bg-rose-50 text-rose-700 border-rose-200' : priority === 1 ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}
      >
        {TODO_PRIORITIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button type="button" aria-label={`${todo.title} 삭제`}
        onClick={() => setIsDeleteOpen(true)} disabled={isBusy}
        className="px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {deleteMutation.isPending ? '삭제 중...' : '삭제'}
      </button>
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="할 일 삭제"
        message={`“${todo.title}”을 삭제하시겠습니까? 일기장과 달력에서도 삭제되며 복구할 수 없습니다.${todo.google_event_id ? ' 구글 캘린더에 등록된 일정은 유지됩니다.' : ''}`}
        confirmLabel="삭제"
        isDanger
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          setIsDeleteOpen(false);
          if (!isBusy) deleteMutation.mutate();
        }}
      />
    </li>
  );
}

export function TodayTodoList({ todos, userId, categories, disabled, onAlert }: TodayTodoListProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(2);
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  const selectedDate = chosenDate || today;
  const dateLabel = selectedDate === today ? '오늘' : format(parseISO(selectedDate), 'M월 d일');

  useEffect(() => {
    const refreshDate = () => setToday(format(new Date(), 'yyyy-MM-dd'));
    const timer = window.setInterval(refreshDate, 1000);
    window.addEventListener('focus', refreshDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshDate);
    };
  }, []);

  const refreshTodos = () => queryClient.invalidateQueries({ queryKey: ['todos', userId] });
  const addMutation = useMutation({
    mutationFn: async ({ newTitle, newPriority, dueDate }: { newTitle: string; newPriority: number; dueDate: string }) => {
      const { error } = await supabase.from('todos').insert({
        user_id: userId,
        title: newTitle,
        priority: newPriority,
        category: categories.find(category => category.type === 'todo' && category.id !== 'note')?.id || 'improvement',
        due_date: dueDate,
        status: 'pending',
        description: null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle('');
      setPriority(2);
      await refreshTodos();
    },
    onError: () => onAlert('할 일을 추가하지 못했습니다. 다시 시도해 주세요.', 'error'),
  });

  const items = getTodayTodos(todos, selectedDate, categories);
  const completed = items.filter(todo => todo.status === 'completed').length;
  const progress = items.length ? Math.round(completed / items.length * 100) : 0;

  return (
    <section aria-labelledby="today-todos-heading" className="mb-12 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold text-zinc-400 mb-2">{format(parseISO(selectedDate), 'yyyy년 M월 d일 EEEE', { locale: ko })}</p>
          <h2 id="today-todos-heading" className="text-2xl font-black tracking-tight">{dateLabel}의 할 일</h2>
          <p className="mt-2 text-sm text-zinc-500">우선순위가 높은 일부터 표시됩니다. 체크박스를 눌러 완료하세요.</p>
        </div>
        <span aria-live="polite" className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
          {completed} / {items.length} 완료
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label htmlFor="todo-list-date" className="text-sm font-bold text-zinc-600">날짜 선택</label>
        <input id="todo-list-date" type="date" value={selectedDate}
          min="0001-01-01" max="9999-12-31"
          disabled={addMutation.isPending}
          onChange={event => {
            const value = event.target.value;
            if (value && event.target.validity.valid && !Number.isNaN(parseISO(value).getTime())) {
              setChosenDate(value);
            }
          }}
          className="min-w-0 border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold bg-white disabled:opacity-50"
        />
        <button type="button" onClick={() => {
          setToday(format(new Date(), 'yyyy-MM-dd'));
          setChosenDate(null);
        }} disabled={addMutation.isPending}
          className="px-4 py-2 rounded-xl bg-zinc-100 text-sm font-bold text-zinc-600 hover:bg-zinc-200 disabled:opacity-50">
          오늘
        </button>
        <button type="button" onClick={() => {
          const now = new Date();
          setToday(format(now, 'yyyy-MM-dd'));
          setChosenDate(format(addDays(now, 1), 'yyyy-MM-dd'));
        }} disabled={addMutation.isPending}
          className="px-4 py-2 rounded-xl bg-zinc-100 text-sm font-bold text-zinc-600 hover:bg-zinc-200 disabled:opacity-50">
          내일
        </button>
        <p className="w-full text-xs text-zinc-400">선택한 날짜로 할 일이 저장됩니다.</p>
      </div>

      <div role="progressbar" aria-label={`${dateLabel}의 할 일 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-6">
        <div style={{ width: `${progress}%` }} className="h-full bg-emerald-500 rounded-full transition-all" />
      </div>

      <form onSubmit={event => {
        event.preventDefault();
        if (!title.trim() || disabled || addMutation.isPending) return;
        addMutation.mutate({ newTitle: title.trim(), newPriority: priority, dueDate: selectedDate });
      }} className="flex flex-col sm:flex-row gap-3">
        <input
          aria-label={`${dateLabel} 할 일 제목`}
          placeholder={`${dateLabel} 할 일을 입력하세요`}
          value={title}
          onChange={event => setTitle(event.target.value)}
          disabled={disabled || addMutation.isPending}
          maxLength={200}
          className="premium-input flex-1 min-w-0"
        />
        <select aria-label="새 할 일 우선순위" value={priority} onChange={event => setPriority(Number(event.target.value))}
          disabled={disabled || addMutation.isPending} className="border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold bg-zinc-50">
          {TODO_PRIORITIES.map(option => <option key={option.value} value={option.value}>우선순위: {option.label}</option>)}
        </select>
        <button type="submit" disabled={disabled || !title.trim() || addMutation.isPending} className="px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed">
          {addMutation.isPending ? '추가 중...' : '할 일 추가'}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">{dateLabel}의 할 일이 없습니다. 첫 번째 할 일을 추가해 보세요.</p>
      ) : (
        <ul className="mt-5 divide-y divide-zinc-100">
          {items.map(todo => (
            <TodayTodoItem key={todo.id} todo={todo} userId={userId} disabled={disabled} onAlert={onAlert} />
          ))}
        </ul>
      )}
      {items.length > 0 && completed === items.length && <p className="text-sm font-bold text-emerald-600 mt-3">{dateLabel}의 할 일을 모두 완료했어요!</p>}
    </section>
  );
}
