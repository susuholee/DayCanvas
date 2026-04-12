import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-6">
              {/* Icon / Label Area */}
              <div className={`text-[10px] font-black px-4 py-2 rounded-full border tracking-[0.2em] uppercase ${
                isDanger ? 'border-red-100 text-red-500 bg-red-50' : 'border-zinc-100 text-zinc-900 bg-zinc-50'
              }`}>
                {isDanger ? 'DANGER' : 'CONFIRM'}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter text-zinc-900">
                  {title}
                </h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="flex w-full gap-3 mt-4">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-2xl font-bold text-sm transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                    isDanger 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200' 
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
