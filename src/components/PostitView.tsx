import { useState, useEffect, useMemo } from 'react';
import type { Todo } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TodoDetailView } from './TodoDetailView';
import type { CustomCategory } from './CategoryManagerModal';
import { ConfirmModal } from './ConfirmModal';

interface PostitViewProps {
  todos: Todo[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<boolean>;
  onAlert?: (message: string, type?: 'success' | 'error') => void;
  providerToken?: string;
}

const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'learned', label: '새롭게 알게 된 점', type: 'memo', color: 'emerald' },
  { id: 'unknown', label: '궁금한 점', type: 'memo', color: 'amber' },
  { id: 'confused', label: '헷갈리는 점', type: 'memo', color: 'violet' },
  { id: 'note', label: '나의 일기', type: 'todo', color: 'zinc' },
  { id: 'improvement', label: '개선 내용', type: 'todo', color: 'indigo' },
];

export function PostitView({ todos, onDelete, onUpdate, onAlert, providerToken }: PostitViewProps) {
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'note' | 'improvement' | 'learning'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCompact, setIsCompact] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.categories) {
      setCategories(user.user_metadata.categories);
    }
  };

  const getCategoryInfo = (catId: string) => {
    return categories.find(c => c.id === catId) || DEFAULT_CATEGORIES.find(c => c.id === catId) || { id: catId, label: '미분류', color: 'zinc', type: 'todo' };
  };

  const MEMO_PREVIEW_LENGTH = 120;

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  const selectedTodo = todos.find(t => t.id === selectedTodoId) || null;

  const baseItems = useMemo(() => {
    return todos.filter(todo => {
      const matchesSearch = searchTerm === '' ||
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDate = searchDate === '' ||
        isSameDay(new Date(todo.due_date || todo.created_at), new Date(searchDate));
      return matchesSearch && matchesDate;
    });
  }, [todos, searchTerm, searchDate]);

  const allCount = baseItems.length;
  const noteCount = baseItems.filter(t => getCategoryInfo(t.category).id === 'note').length;
  const improvementCount = baseItems.filter(t => getCategoryInfo(t.category).type === 'todo' && getCategoryInfo(t.category).id !== 'note').length;
  const learningCount = baseItems.filter(t => getCategoryInfo(t.category).type === 'memo').length;

  const filteredItems = useMemo(() => {
    return baseItems.filter(todo => {
      if (activeCategory === 'all') return true;
      const info = getCategoryInfo(todo.category);
      if (activeCategory === 'learning') return info.type === 'memo';
      if (activeCategory === 'improvement') return info.type === 'todo' && info.id !== 'note';
      return info.id === activeCategory;
    });
  }, [baseItems, activeCategory, categories]);

  // 그룹화 로직
  const groupedItems = useMemo(() => {
    const groups: Record<string, Todo[]> = {};
    filteredItems.forEach(item => {
      const monthKey = format(new Date(item.due_date || item.created_at), 'yyyy-MM');
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredItems]);

  const renderTodoItem = (todo: Todo) => {
    const catInfo = getCategoryInfo(todo.category);
    const isMemo = catInfo.type === 'memo';
    const isExpanded = expandedIds.has(todo.id);

    const colorClasses: Record<string, string> = {
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      amber: 'text-amber-600 bg-amber-50 border-amber-100',
      violet: 'text-violet-600 bg-violet-50 border-violet-100',
      rose: 'text-rose-600 bg-rose-50 border-rose-100',
      sky: 'text-sky-600 bg-sky-50 border-sky-100',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      zinc: 'text-zinc-600 bg-zinc-50 border-zinc-100',
    };

    if (isCompact) {
      return (
        <div
          onClick={() => setSelectedTodoId(todo.id)}
          className="group flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4 truncate">
            <span className="text-[10px] font-black text-zinc-400 w-8">{format(new Date(todo.due_date || todo.created_at), 'dd')}일</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border truncate ${colorClasses[catInfo.color] || colorClasses.zinc}`}>
              {catInfo.label}
            </span>
            <h4 className="text-sm font-bold truncate text-zinc-900">
              {todo.title}
            </h4>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <button onClick={(e) => { e.stopPropagation(); setDeletingId(todo.id); }} className="text-zinc-300 hover:text-red-500 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => { if (!isMemo) setSelectedTodoId(todo.id); }}
        className={`group flex flex-col md:flex-row gap-8 items-start w-full ${!isMemo ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {catInfo.id === 'note' && (
          <div className="flex flex-row md:flex-col items-baseline md:items-end gap-3 md:gap-0 min-w-[110px] pt-1">
            <span className="text-5xl font-black text-zinc-950 tracking-tighter leading-none">
              {format(new Date(todo.due_date || todo.created_at), 'dd')}
            </span>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{format(new Date(todo.due_date || todo.created_at), 'MMM yyyy', { locale: ko })}</span>
              <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest mt-1">{format(new Date(todo.due_date || todo.created_at), 'EEEE', { locale: ko })}</span>
            </div>
          </div>
        )}

        <div className="flex-1 w-full card-premium !p-12 border-zinc-100 hover:border-zinc-300 transition-all bg-white relative">
          <div className="flex items-start justify-between gap-8 mb-8">
            <h3 className="text-2xl font-bold tracking-tight transition-all leading-snug text-zinc-900">
              {todo.title}
            </h3>
          </div>

          {todo.description && (
            <div className="relative mb-10">
              <p className={`${isMemo ? 'memo-text' : 'diary-content'} whitespace-pre-wrap`}
                style={(!isMemo && todo.description.length > 300) ? { WebkitLineClamp: 10, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
              >
                {isMemo && todo.description.length > MEMO_PREVIEW_LENGTH && !isExpanded
                  ? todo.description.slice(0, MEMO_PREVIEW_LENGTH) + '...'
                  : todo.description}
              </p>
              {isMemo && todo.description.length > MEMO_PREVIEW_LENGTH && (
                <button onClick={(e) => toggleExpand(e, todo.id)} className="mt-2 text-zinc-400 hover:text-zinc-700 font-black text-[13px] transition-colors">
                  {isExpanded ? '접기' : '더보기'}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-8 border-t border-zinc-50">
            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${colorClasses[catInfo.color] || colorClasses.zinc}`}>
              {catInfo.label}
            </span>

            <div className="flex items-center gap-4">
              {isMemo && (
                <button onClick={(e) => { e.stopPropagation(); setSelectedTodoId(todo.id); }} className="text-[10px] font-black text-zinc-400 hover:text-zinc-700 transition-colors uppercase tracking-[0.2em]">수정</button>
              )}
              <button onClick={(e) => { e.stopPropagation(); setDeletingId(todo.id); }} className="text-[10px] font-black text-zinc-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em]">삭제</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'all', label: '전체', count: allCount },
    { id: 'note', label: '일기장', count: noteCount },
    { id: 'improvement', label: '계획 & 개선', count: improvementCount },
    { id: 'learning', label: '학습 노트', count: learningCount },
  ];

  if (todos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-32 text-zinc-400 border border-zinc-100 border-dashed rounded-3xl bg-white/50">
        <p className="text-xl font-bold text-zinc-900 mb-2">활동 내역이 비어 있습니다.</p>
        <p className="text-zinc-500 text-sm">기억하고 싶은 오늘을 추가해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 w-full group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-300 group-focus-within:text-zinc-900 transition-colors tracking-widest">SEARCH</span>
            <input type="text" placeholder="Enter keywords..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-zinc-100 rounded-2xl pl-20 pr-6 py-5 focus:outline-none focus:border-zinc-300 transition-shadow duration-300 text-lg font-medium text-zinc-900 placeholder:text-zinc-300 shadow-sm hover:shadow-md" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`px-4 py-5 rounded-2xl border transition-all flex items-center gap-3 ${isCompact ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300'}`}
            >
              <span className="text-[10px] font-black tracking-widest">{isCompact ? '자세히 보기' : '요약 보기'}</span>
            </button>
            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="flex-1 md:flex-none md:w-[200px] bg-white border border-zinc-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-zinc-300 transition-shadow duration-300 text-sm font-bold text-zinc-900 shadow-sm hover:shadow-md cursor-pointer" />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveCategory(tab.id as any)} className={`relative px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-4 whitespace-nowrap ${activeCategory === tab.id ? 'text-zinc-950 bg-white border border-zinc-200 shadow-sm' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/50'}`}>
              <span className="relative z-10">{tab.label}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${activeCategory === tab.id ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-transparent text-zinc-300 border-zinc-100'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {groupedItems.length > 0 ? (
            <motion.div 
              key={isCompact ? 'compact' : 'standard'}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)', y: 20 }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)', y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-16 relative"
            >
              {/* 전체 타임라인 수직선 */}
              <div className="absolute left-[39px] md:left-[54px] top-8 bottom-8 w-px bg-zinc-100 hidden md:block" />

              {groupedItems.map(([monthKey, items], groupIndex) => {
                const displayMonth = format(new Date(monthKey), 'yyyy년 MM월', { locale: ko });

                return (
                  <motion.div 
                    key={monthKey} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1, duration: 0.5 }}
                    className="relative"
                  >
                    {/* 스티키 월 헤더 */}
                    <div className="sticky top-0 z-20 py-6 mb-8 -mx-4 px-4 bg-[#fcfcf9]/80 backdrop-blur-md border-b border-zinc-100/50 shadow-[0_1px_0_rgba(255,255,255,1)]">
                      <div className="flex items-center gap-4 max-w-4xl mx-auto">
                        <span className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-zinc-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </span>
                        <div>
                          <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">
                            {displayMonth}
                          </h2>
                          <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{items.length}개의 기록</p>
                        </div>
                      </div>
                    </div>

                    <div className={`grid gap-12 ${isCompact ? 'grid-cols-1' : 'flex flex-col gap-24'}`}>
                      {items.map((todo, idx) => (
                        <motion.div 
                          key={todo.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + (idx * 0.05), duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                        >
                          {renderTodoItem(todo)}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-40 text-center text-zinc-400"
            >
              검색 결과가 없습니다.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTodo && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedTodoId(null)}>
            <TodoDetailView todo={selectedTodo} onClose={() => setSelectedTodoId(null)} onUpdate={onUpdate} onDelete={onDelete} onAlert={onAlert} providerToken={providerToken} />
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            onDelete(deletingId);
            setDeletingId(null);
          }
        }}
        title="기록 삭제"
        message="정말로 이 기록을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
      />
    </div>
  );
}
