import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, type Inquiry } from '../lib/supabase';
import { AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { InquiryFormModal } from './InquiryFormModal';
import { InquiryDetailModal } from './InquiryDetailModal';
import { LoadingSpinner } from './LoadingSpinner';
import { ConfirmModal } from './ConfirmModal';
import type { Session } from '@supabase/supabase-js';

interface InquiryBoardProps {
  session: Session;
  onAlert: (message: string, type?: 'success' | 'error') => void;
}

const DEVELOPER_EMAIL = 'akakak1359@gmail.com';

export function InquiryBoard({ session, onAlert }: InquiryBoardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDevMode = session.user.email === DEVELOPER_EMAIL;

  const handleConfirmDelete = async () => {
    if (!inquiryToDelete) return;
    setIsDeleting(true);
    try {
      if (inquiryToDelete.image_url) {
        const parts = inquiryToDelete.image_url.split('/inquiry_images/');
        if (parts.length > 1) {
          const filePath = parts[1];
          const { error: storageError } = await supabase.storage
            .from('inquiry_images')
            .remove([filePath]);
          if (storageError) {
            console.error('Storage delete error:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', inquiryToDelete.id);

      if (error) throw error;

      onAlert('문의 게시글이 완전히 삭제되었습니다.', 'success');
      await refetch();
    } catch (err) {
      console.error(err);
      onAlert('문의글 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDeleting(false);
      setInquiryToDelete(null);
    }
  };

  const { data: inquiries = [], isLoading, refetch } = useQuery<Inquiry[]>({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">개발자 문의하기</h2>
          <p className="text-zinc-500 font-medium mt-1">버그 제보나 새로운 기능 제안을 환영합니다!</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
        >
          새 문의하기
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <LoadingSpinner />
        ) : inquiries.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 font-medium">
            등록된 문의가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                onClick={() => setSelectedInquiry(inquiry)}
                className="p-6 hover:bg-zinc-50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                      inquiry.status === 'answered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
                    </span>
                    {!inquiry.is_public && (
                      <span className="text-zinc-400" title="비공개">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                    )}
                    {inquiry.image_url && (
                      <span className="text-zinc-400" title="사진 첨부됨">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 truncate mb-1 group-hover:text-zinc-600 transition-colors">
                    {inquiry.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                    <span className="text-zinc-600 font-bold">{inquiry.author_name}</span>
                    <span>•</span>
                    <span>{format(new Date(inquiry.created_at), 'yyyy.MM.dd', { locale: ko })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {isDevMode && inquiry.status === 'answered' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInquiryToDelete(inquiry);
                      }}
                      className="px-3 py-1.5 text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all rounded-lg uppercase tracking-widest"
                    >
                      삭제
                    </button>
                  )}
                  <div className="text-zinc-300 group-hover:text-zinc-500 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <InquiryFormModal
              onClose={() => setIsFormOpen(false)}
              onSuccess={() => setIsFormOpen(false)}
              onAlert={onAlert}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInquiry && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]" onClick={() => setSelectedInquiry(null)}>
            <InquiryDetailModal
              inquiry={selectedInquiry}
              onClose={() => setSelectedInquiry(null)}
              isDevMode={isDevMode}
              onAnswerSubmit={async () => {
                await refetch();
                setSelectedInquiry(null);
              }}
              onAlert={onAlert}
            />
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={!!inquiryToDelete}
        title="문의 게시글 삭제"
        message="정말 이 문의 게시글을 완전히 삭제하시겠습니까? 첨부된 이미지 파일도 함께 영구 삭제됩니다."
        confirmLabel={isDeleting ? '삭제 중...' : '삭제'}
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        onCancel={() => setInquiryToDelete(null)}
        isDanger={true}
      />
    </div>
  );
}
