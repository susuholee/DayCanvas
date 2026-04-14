import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export interface CustomCategory {
  id: string;
  label: string;
  type: 'memo' | 'todo';
  color: string;
}

interface CategoryManagerModalProps {
  type: 'memo' | 'todo';
  onClose: () => void;
  onUpdate: () => void;
}

const PRESET_COLORS = [
  { name: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100', light: 'bg-emerald-50' },
  { name: 'amber', bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100', light: 'bg-amber-50' },
  { name: 'violet', bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-100', light: 'bg-violet-50' },
  { name: 'rose', bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-100', light: 'bg-rose-50' },
  { name: 'sky', bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-100', light: 'bg-sky-50' },
  { name: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-100', light: 'bg-indigo-50' },
  { name: 'zinc', bg: 'bg-zinc-500', text: 'text-zinc-600', border: 'border-zinc-100', light: 'bg-zinc-50' },
];

export function CategoryManagerModal({ type, onClose, onUpdate }: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState('zinc');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.categories) {
      setCategories(user.user_metadata.categories);
    } else {
      // Default categories if none exist
      const defaults: CustomCategory[] = [
        { id: 'learned', label: '새롭게 알게 된 점', type: 'memo', color: 'emerald' },
        { id: 'unknown', label: '궁금한 점', type: 'memo', color: 'amber' },
        { id: 'confused', label: '헷갈리는 점', type: 'memo', color: 'violet' },
        { id: 'note', label: '나의 일기', type: 'todo', color: 'zinc' },
        { id: 'improvement', label: '개선 내용', type: 'todo', color: 'indigo' },
      ];
      setCategories(defaults);
    }
  };

  const saveCategories = async (updatedList: CustomCategory[]) => {
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { categories: updatedList }
    });
    
    if (!error) {
      setCategories(updatedList);
      onUpdate();
    }
    setIsSaving(false);
  };

  const handleAddCategory = () => {
    if (!newLabel.trim()) return;
    const newCat: CustomCategory = {
      id: `cat-${Date.now()}`,
      label: newLabel.trim(),
      type: type,
      color: selectedColor
    };
    const updated = [...categories, newCat];
    saveCategories(updated);
    setNewLabel('');
  };

  const handleDeleteCategory = (id: string) => {
    // Prevent deleting core categories if needed, or just allow it
    const updated = categories.filter(c => c.id !== id);
    saveCategories(updated);
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-[440px] bg-white border border-zinc-200 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-1">SETTING</p>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">카테고리 관리</h2>
        </div>
        <button onClick={onClose} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]">닫기</button>
      </div>

      <div className="space-y-6">
        {/* 기존 카테고리 목록 */}
        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">현재 카테고리</p>
          {filteredCategories.length === 0 ? (
            <p className="text-zinc-400 text-xs py-4 text-center border border-dashed border-zinc-100 rounded-2xl">등록된 카테고리가 없습니다.</p>
          ) : (
            filteredCategories.map(cat => {
              const colorInfo = PRESET_COLORS.find(pc => pc.name === cat.color) || PRESET_COLORS[6];
              return (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-2xl group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colorInfo.bg}`} />
                    <span className="text-sm font-bold text-zinc-700">{cat.label}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-[10px] font-black text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest"
                  >
                    삭제
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="h-[1px] bg-zinc-100 w-full" />

        {/* 새 카테고리 추가 */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">새 카테고리 추가</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="카테고리 이름 (예: 복습하기)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="premium-input font-bold"
            />
            
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(pc => (
                <button
                  key={pc.name}
                  onClick={() => setSelectedColor(pc.name)}
                  className={`w-8 h-8 rounded-full ${pc.bg} transition-all ${selectedColor === pc.name ? 'ring-4 ring-zinc-200 ring-offset-2 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                />
              ))}
            </div>

            <button
              onClick={handleAddCategory}
              disabled={!newLabel.trim() || isSaving}
              className="btn-bouncy w-full py-3.5 text-sm"
            >
              {isSaving ? '저장 중...' : '새 카테고리 추가하기'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
