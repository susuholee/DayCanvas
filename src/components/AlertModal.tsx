import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// removed lucide-react import

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function AlertModal({ isOpen, message, type = 'success', onClose }: AlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && (e.key === 'Enter' || e.key === 'Escape')) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xl p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-6">
              <div className={`text-[10px] font-black px-4 py-2 rounded-full border tracking-[0.2em] uppercase ${
                type === 'success' ? 'border-zinc-200 text-zinc-900 bg-zinc-50' : 'border-red-100 text-red-500 bg-red-50'
              }`}>
                {type === 'success' ? 'Success' : 'Notice'}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900">
                  {type === 'success' ? '성공!' : '알림'}
                </h3>
                <p className="text-zinc-500 font-medium">
                  {message}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all active:bg-black"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
