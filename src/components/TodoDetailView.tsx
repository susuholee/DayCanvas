import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { Todo } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CustomCategory } from './CategoryManagerModal';
import { ConfirmModal } from './ConfirmModal';

interface TodoDetailViewProps {
  todo: Todo;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<boolean>;
  onDelete: (id: string) => void;
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

export function TodoDetailView({ todo, onClose, onUpdate, onDelete, onAlert, providerToken }: TodoDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const initialDate = todo.due_date || format(new Date(todo.created_at), 'yyyy-MM-dd');
  const [editDueDate, setEditDueDate] = useState(initialDate);
  const [editCategory, setEditCategory] = useState<string>(todo.category);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [modalSize, setModalSize] = useState({ w: 512, h: 0 });
  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const resizeRef = useRef({ isResizing: false, startX: 0, startY: 0, startW: 0, startH: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const currentH = modalRef.current?.offsetHeight ?? 600;
    resizeRef.current = { isResizing: true, startX: e.clientX, startY: e.clientY, startW: modalSize.w, startH: currentH };
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current.isResizing) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      setModalSize({
        w: Math.max(340, Math.min(window.innerWidth * 0.95, resizeRef.current.startW + dx)),
        h: Math.max(300, Math.min(window.innerHeight * 0.95, resizeRef.current.startH + dy)),
      });
    };
    const onMouseUp = () => {
      resizeRef.current.isResizing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (!isEditing && (e.key === 'Enter' || e.key === 'Escape')) onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onClose]);

  const updateGoogleCalendarEvent = async () => {
    if (!providerToken || !todo.google_event_id || editCategory !== 'note') return;
    try {
      const dateString = editDueDate || format(new Date(todo.created_at), 'yyyy-MM-dd');
      await axios.patch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${todo.google_event_id}`, {
        summary: `[일기] ${editTitle}`,
        description: editDescription,
        start: { date: dateString },
        end: { date: dateString },
      }, { headers: { 'Authorization': `Bearer ${providerToken}`, 'Content-Type': 'application/json' } });
    } catch (err: any) {
      onAlert?.('구글 일정 수정 실패', 'error');
    }
  };

  const deleteGoogleCalendarEvent = async () => {
    if (!providerToken || !todo.google_event_id) return;
    try {
      await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${todo.google_event_id}`, {
        headers: { 'Authorization': `Bearer ${providerToken}` }
      });
    } catch (error) {}
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdate(todo.id, {
      title: editTitle,
      description: editDescription || null,
      due_date: editCategory === 'note' ? (editDueDate || null) : null,
      category: editCategory,
    });
    if (success) {
      await updateGoogleCalendarEvent();
      onAlert?.('성공적으로 수정되었습니다!');
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await deleteGoogleCalendarEvent();
    onDelete(todo.id);
    onClose();
  };

  const currentCatInfo = getCategoryInfo(todo.category);
  const isMemo = currentCatInfo.type === 'memo';

  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    sky: 'text-sky-600 bg-sky-50 border-sky-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    zinc: 'text-zinc-600 bg-zinc-50 border-zinc-100',
  };

  return (
    <motion.div
      ref={modalRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{ width: modalSize.w, height: modalSize.h > 0 ? modalSize.h : undefined, maxHeight: '90vh' }}
      className="flex flex-col bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">카테고리</span>
            <span className={`text-[11px] font-bold ${colorClasses[currentCatInfo.color]?.split(' ')[0] || 'text-zinc-900'}`}>{currentCatInfo.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]">수정</button>}
          <button onClick={() => setIsDeleteConfirmOpen(true)} className="text-[10px] font-black text-zinc-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em]">삭제</button>
          <button onClick={onClose} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]">닫기</button>
        </div>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="input-label">기록 제목</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="premium-input font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="input-label">내용</label>
                  <textarea rows={8} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="premium-input resize-none h-[250px] leading-relaxed" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">카테고리 선택</label>
                <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100/50 border border-zinc-200/50 rounded-xl">
                  {categories.filter(c => c.type === (isMemo ? 'memo' : 'todo')).map(cat => (
                    <button key={cat.id} type="button" onClick={() => setEditCategory(cat.id)} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${editCategory === cat.id ? 'bg-white text-zinc-950 shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              {editCategory === 'note' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">날짜</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="premium-input text-sm font-bold" />
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsEditing(false)} className="btn-bouncy-outline flex-1 py-3 text-xs">취소</button>
                <button onClick={handleSave} disabled={isSaving} className="btn-bouncy flex-[2] py-3 text-xs">{isSaving ? '저장 중...' : '변경 사항 저장'}</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${colorClasses[currentCatInfo.color] || colorClasses.zinc}`}>
                      {currentCatInfo.label}
                    </span>
                    {todo.category === 'note' && (
                      <span className="text-xs font-bold text-zinc-400">{format(new Date(todo.due_date || todo.created_at), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}</span>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight">{todo.title}</h2>
                </div>
                <div className="relative pt-6 border-t border-zinc-50">
                  <p className={`${isMemo ? 'memo-text' : 'diary-content'} whitespace-pre-wrap break-words`}>{todo.description || '작성된 내용이 없습니다.'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div onMouseDown={handleResizeMouseDown} className="absolute bottom-3 right-3 w-5 h-5 cursor-se-resize z-10 flex items-end justify-end opacity-25 hover:opacity-60 transition-opacity">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M6 10L10 6M10 10V10" stroke="#71717a" strokeWidth="1.8" strokeLinecap="round"/></svg>
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          handleDelete();
        }}
        title="기록 삭제"
        message="정말로 이 기록을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        isDanger={true}
        confirmLabel="삭제"
      />
    </motion.div>
  );
}
