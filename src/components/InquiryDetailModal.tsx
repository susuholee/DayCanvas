import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase, type Inquiry } from '../lib/supabase';

interface InquiryDetailModalProps {
  inquiry: Inquiry;
  onClose: () => void;
  isDevMode?: boolean;
  onAnswerSubmit?: () => Promise<void>;
  onAlert?: (message: string, type?: 'success' | 'error') => void;
}

export function InquiryDetailModal({
  inquiry,
  onClose,
  isDevMode = false,
  onAnswerSubmit,
  onAlert,
}: InquiryDetailModalProps) {
  const [answerText, setAnswerText] = useState(inquiry.answer ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      onAlert?.('답변 내용을 입력해주세요.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ answer: answerText.trim(), status: 'answered' })
        .eq('id', inquiry.id);

      if (error) throw error;

      onAlert?.('답변이 등록되었습니다!', 'success');
      await onAnswerSubmit?.();
    } catch (err) {
      console.error(err);
      onAlert?.('답변 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnswer = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ answer: null, status: 'pending' })
        .eq('id', inquiry.id);

      if (error) throw error;

      onAlert?.('답변이 삭제되었습니다.', 'success');
      await onAnswerSubmit?.();
    } catch (err) {
      console.error(err);
      onAlert?.('답변 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="w-full max-w-[600px] max-h-[90vh] bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">게시판 문의</span>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${inquiry.status === 'answered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {inquiry.status === 'answered' ? '답변완료' : '답변대기'}
              </span>
              {!inquiry.is_public && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]">닫기</button>
      </div>

      {/* Body */}
      <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">

        {/* 질문 영역 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {inquiry.author_avatar ? (
              <img src={inquiry.author_avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-zinc-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                <span className="text-xs font-bold text-zinc-500">{inquiry.author_name[0]}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900">{inquiry.author_name}</span>
              <span className="text-[10px] font-medium text-zinc-400">
                {format(new Date(inquiry.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight leading-snug">
            {inquiry.title}
          </h2>
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6">
            <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed text-[15px]">
              {inquiry.content}
            </p>
          </div>
          {inquiry.image_url && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-200">
              <img src={inquiry.image_url} alt="첨부 이미지" className="w-full h-auto object-cover max-h-[400px]" />
            </div>
          )}
        </div>

        {/* 답변 영역 */}
        <div className="pt-8 border-t border-zinc-100">

          {/* 기존 답변 표시 */}
          {inquiry.status === 'answered' && inquiry.answer && !isEditing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                      <path d="M8 7h6"/>
                      <path d="M8 11h8"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-zinc-900">개발자 답변</span>
                </div>
                {isDevMode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAnswerText(inquiry.answer ?? ''); setIsEditing(true); }}
                      className="text-[10px] font-black text-zinc-400 hover:text-zinc-700 transition-colors uppercase tracking-widest"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDeleteAnswer}
                      disabled={isSubmitting}
                      className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest disabled:opacity-40"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                <p className="text-emerald-900 whitespace-pre-wrap leading-relaxed text-[15px]">
                  {inquiry.answer}
                </p>
              </div>
            </div>
          )}

          {/* 개발자 전용: 답변 입력 폼 */}
          {isDevMode && (inquiry.status === 'pending' || isEditing) && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                    <path d="M8 7h6"/>
                    <path d="M8 11h8"/>
                  </svg>
                </div>
                <span className="text-sm font-bold text-zinc-900">
                  {isEditing ? '답변 수정하기' : '개발자 답변 달기'}
                </span>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="ml-auto text-[10px] font-black text-zinc-400 hover:text-zinc-700 transition-colors uppercase tracking-widest"
                  >
                    취소
                  </button>
                )}
              </div>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변 내용을 입력하세요..."
                rows={5}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-800 placeholder-zinc-400 resize-none focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !answerText.trim()}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors shadow-lg shadow-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '등록 중...' : isEditing ? '수정 완료' : '답변 등록'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
