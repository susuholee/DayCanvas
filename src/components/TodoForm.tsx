import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryManagerModal, type CustomCategory } from './CategoryManagerModal';

interface TodoFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onAlert?: (message: string, type?: 'success' | 'error') => void;
  providerToken?: string;
}

const DEFAULT_TODO_CATEGORIES: CustomCategory[] = [
  { id: 'note', label: '나의 일기', type: 'todo', color: 'zinc' },
  { id: 'improvement', label: '개선 내용', type: 'todo', color: 'indigo' },
];

export function TodoForm({ onClose, onSuccess, onAlert, providerToken }: TodoFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [category, setCategory] = useState<string>('note');
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const customCats = user?.user_metadata?.categories?.filter((c: any) => c.type === 'todo') || [];
    if (customCats.length > 0) {
      setCategories(customCats);
      if (!customCats.find((c: any) => c.id === category)) {
        setCategory(customCats[0].id);
      }
    } else {
      setCategories(DEFAULT_TODO_CATEGORIES);
    }
  };

  const createGoogleCalendarEvent = async (todoTitle: string, todoDescription: string, todoDate: string, todoCategory: string) => {
    if (!providerToken) {
      console.error('Google Calendar Sync Failed: No provider token found.');
      return null;
    }

    try {
      const categoryLabel = categories.find(c => c.id === todoCategory)?.label || '기록';
      const eventTitle = `[${categoryLabel}] ${todoTitle}`;
      const date = todoDate || new Date().toISOString().split('T')[0];

      // 구글 캘린더 API의 All-day 이벤트는 end date가 exclusive이므로 '시작일 + 1일'로 설정해야 정상 표시됩니다.
      const parts = date.split('-');
      const endDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      endDateObj.setDate(endDateObj.getDate() + 1);
      const nextDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          summary: eventTitle,
          description: todoDescription,
          start: { date: date },
          end: { date: nextDate },
        },
        {
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.id;
    } catch (error: any) {
      console.error('Google Calendar API Error:', error.response?.data || error.message);
      onAlert?.(`구글 연동 실패: ${error.response?.data?.error?.message || '알 수 없는 오류'}`, 'error');
    }
    return null;
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) return;

      const { data: userData } = await supabase.auth.getUser();
      const { data: insertedTodo, error: supabaseError } = await supabase
        .from('todos')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          category: category,
          user_id: userData.user?.id
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      const googleEventId = await createGoogleCalendarEvent(
        title.trim(),
        description.trim(),
        dueDate,
        category
      );

      if (googleEventId) {
        await supabase
          .from('todos')
          .update({ google_event_id: googleEventId })
          .eq('id', insertedTodo.id);
      }
      
      return insertedTodo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      onAlert?.('성공적으로 추가되었습니다!');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error adding todo:', error);
      onAlert?.('저장 중 오류가 발생했습니다.', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || addMutation.isPending) return;
    addMutation.mutate();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="w-full max-w-[440px] bg-white border border-zinc-200 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">새로운 기록</h2>
          <button 
            onClick={onClose} 
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]"
          >
            닫기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="input-label">기록 제목</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="premium-input font-bold"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1 mb-2">
              <label className="input-label !m-0">카테고리 선택</label>
              <button 
                type="button"
                onClick={() => setIsManagerOpen(true)}
                className="text-[10px] font-black text-zinc-300 hover:text-zinc-900 transition-colors uppercase tracking-widest"
              >
                설정
              </button>
            </div>
            <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-50 border border-zinc-100 rounded-2xl">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all ${
                    category === cat.id 
                    ? 'bg-white text-zinc-950 shadow-sm border border-zinc-100' 
                    : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="input-label">내용</label>
            <textarea
              rows={4}
              placeholder="기록하고 싶은 내용을 자유롭게 적어보세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              className="premium-input resize-none h-[120px] leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="input-label">날짜 선택</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="premium-input font-medium"
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4"
          >
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-bouncy w-full py-3.5 text-base"
            >
              {addMutation.isPending ? (
                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '기록 저장하기'
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>

      <AnimatePresence>
        {isManagerOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsManagerOpen(false)}>
            <CategoryManagerModal 
              type="todo" 
              onClose={() => setIsManagerOpen(false)} 
              onUpdate={loadCategories}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
