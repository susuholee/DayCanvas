import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryManagerModal, type CustomCategory } from './CategoryManagerModal';

interface MemoFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onAlert?: (message: string, type?: 'success' | 'error') => void;
}

const DEFAULT_MEMO_CATEGORIES: CustomCategory[] = [
  { id: 'learned', label: '새롭게 알게 된 점', type: 'memo', color: 'emerald' },
  { id: 'unknown', label: '궁금한 점', type: 'memo', color: 'amber' },
  { id: 'confused', label: '헷갈리는 점', type: 'memo', color: 'violet' },
];

export function MemoForm({ onClose, onSuccess, onAlert }: MemoFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [category, setCategory] = useState<string>('learned');
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const customCats = user?.user_metadata?.categories?.filter((c: any) => c.type === 'memo') || [];
    if (customCats.length > 0) {
      setCategories(customCats);
      if (!customCats.find((c: any) => c.id === category)) {
        setCategory(customCats[0].id);
      }
    } else {
      setCategories(DEFAULT_MEMO_CATEGORIES);
    }
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) return;

      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('todos')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          due_date: null,
          category: category,
          user_id: userData.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      onAlert?.('메모가 저장되었습니다!');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error adding memo:', error);
      onAlert?.('저장 중 오류가 발생했습니다.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || addMutation.isPending) return;
    addMutation.mutate();
  };

  const selectedCategory = categories.find((c) => c.id === category) || categories[0] || DEFAULT_MEMO_CATEGORIES[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="w-full max-w-[440px] bg-white border border-zinc-200 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-1">MEMO</p>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">새로운 메모</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]"
          >
            닫기
          </button>
        </div>

        {/* Category Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between ml-1 mb-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">카테고리</p>
            <button 
              onClick={() => setIsManagerOpen(true)}
              className="text-[10px] font-black text-zinc-300 hover:text-zinc-900 transition-colors uppercase tracking-widest"
            >
              설정
            </button>
          </div>
          <div className="flex flex-col gap-2 p-1.5 bg-zinc-50 border border-zinc-100 rounded-2xl max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((cat) => {
              const bgClass = cat.color === 'emerald' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' :
                             cat.color === 'amber' ? 'bg-white text-amber-600 shadow-sm border border-amber-100' :
                             cat.color === 'violet' ? 'bg-white text-violet-600 shadow-sm border border-violet-100' :
                             cat.color === 'rose' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' :
                             cat.color === 'sky' ? 'bg-white text-sky-600 shadow-sm border border-sky-100' :
                             cat.color === 'indigo' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' :
                             'bg-white text-zinc-600 shadow-sm border border-zinc-100';
                             
              const hoverClass = cat.color === 'emerald' ? 'hover:text-emerald-500' :
                                cat.color === 'amber' ? 'hover:text-amber-500' :
                                cat.color === 'violet' ? 'hover:text-violet-500' :
                                cat.color === 'rose' ? 'hover:text-rose-500' :
                                cat.color === 'sky' ? 'hover:text-sky-500' :
                                cat.color === 'indigo' ? 'hover:text-indigo-500' :
                                'hover:text-zinc-500';

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left ${
                    category === cat.id ? bgClass : `text-zinc-400 ${hoverClass}`
                  }`}
                >
                  <span className="text-[11px] font-black">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="input-label">{selectedCategory.label}</label>
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

          {/* Description */}
          <div className="space-y-2">
            <label className="input-label">상세 내용</label>
            <textarea
              rows={4}
              placeholder="자세한 내용을 적어보세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              className="premium-input resize-none h-[110px] leading-relaxed"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <button
              type="submit"
              disabled={addMutation.isPending}
              className={`w-full py-3.5 text-sm font-black rounded-2xl transition-all text-white ${
                selectedCategory.color === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600' :
                selectedCategory.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' :
                selectedCategory.color === 'violet' ? 'bg-violet-500 hover:bg-violet-600' :
                selectedCategory.color === 'rose' ? 'bg-rose-500 hover:bg-rose-600' :
                selectedCategory.color === 'sky' ? 'bg-sky-500 hover:bg-sky-600' :
                selectedCategory.color === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600' :
                'bg-zinc-900 hover:bg-zinc-800'
              } active:scale-95`}
            >
              {addMutation.isPending ? (
                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                '메모 저장하기'
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>

      <AnimatePresence>
        {isManagerOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsManagerOpen(false)}>
            <CategoryManagerModal 
              type="memo" 
              onClose={() => setIsManagerOpen(false)} 
              onUpdate={loadCategories}
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
