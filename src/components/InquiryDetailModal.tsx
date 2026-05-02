import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Inquiry } from '../lib/supabase';

interface InquiryDetailModalProps {
  inquiry: Inquiry;
  onClose: () => void;
}

export function InquiryDetailModal({ inquiry, onClose }: InquiryDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="w-full max-w-[600px] max-h-[90vh] bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative"
      onClick={(e) => e.stopPropagation()}
    >
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

      <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
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

        {inquiry.status === 'answered' && inquiry.answer && (
          <div className="mt-8 pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                  <path d="M8 7h6"/>
                  <path d="M8 11h8"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900">개발자 답변</span>
              </div>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
              <p className="text-emerald-900 whitespace-pre-wrap leading-relaxed text-[15px]">
                {inquiry.answer}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
