import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface InquiryFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onAlert?: (message: string, type?: 'success' | 'error') => void;
}

export function InquiryFormModal({ onClose, onSuccess, onAlert }: InquiryFormModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onAlert?.('이미지 크기는 5MB 이하여야 합니다.', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('inquiry_images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('inquiry_images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) throw new Error('제목과 내용을 입력해주세요.');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error: insertError } = await supabase
        .from('inquiries')
        .insert({
          title: title.trim(),
          content: content.trim(),
          is_public: isPublic,
          image_url: imageUrl,
          user_id: userData.user.id,
          author_name: userData.user.user_metadata?.full_name || '알 수 없는 사용자',
          author_avatar: userData.user.user_metadata?.avatar_url || null,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      onAlert?.('문의가 성공적으로 등록되었습니다.');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error submitting inquiry:', error);
      onAlert?.(`문의 등록 중 오류가 발생했습니다: ${error.message || ''}`, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="w-full max-w-[500px] max-h-[90vh] bg-white border border-zinc-200 rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-1">INQUIRY</p>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">개발자에게 문의하기</h2>
        </div>
        <button onClick={onClose} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]">닫기</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-4">
        <div className="space-y-2">
          <label className="input-label">문의 제목</label>
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
          <label className="input-label">내용</label>
          <textarea
            required
            rows={5}
            placeholder="문의하실 내용을 자세히 적어주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="premium-input resize-none h-[150px] leading-relaxed"
          />
        </div>

        <div className="space-y-3">
          <label className="input-label">사진 첨부 (선택)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all overflow-hidden relative group"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-bold tracking-widest">사진 변경</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-zinc-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-[11px] font-black uppercase tracking-widest">클릭하여 업로드</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          {imagePreview && (
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest block text-right w-full"
            >
              사진 삭제
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mt-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-900">비공개로 문의하기</span>
            <span className="text-[10px] text-zinc-400">다른 사람들은 이 글을 볼 수 없습니다.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!isPublic ? 'bg-zinc-900' : 'bg-zinc-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${!isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4"
        >
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="btn-bouncy w-full py-4 text-sm"
          >
            {submitMutation.isPending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              '문의 등록하기'
            )}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
