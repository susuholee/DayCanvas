import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface IntroProps {
  onComplete: () => void;
}

export function Intro({ onComplete }: IntroProps) {
  useEffect(() => {
    // 2.8초 후 자동으로 메인 화면으로 전환
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const text = "언제나 기록하기";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.05, 
        filter: "blur(10px)", 
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#fcfcf9]"
    >
      {/* Background glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] bg-violet-200/60 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-emerald-200/50 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Brand Icon/Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-900/20 mb-10"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M8 7h6"/>
            <path d="M8 11h8"/>
          </svg>
        </motion.div>

        {/* Text Reveal */}
        <div className="flex space-x-[2px] overflow-hidden px-4">
          {text.split('').map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.3 + index * 0.08
              }}
              className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
          className="mt-10 flex items-center gap-4"
        >
          <div className="w-12 h-[2px] bg-zinc-200" />
          <p className="text-zinc-400 font-black text-[11px] tracking-[0.4em] uppercase">
            DayCanvas
          </p>
          <div className="w-12 h-[2px] bg-zinc-200" />
        </motion.div>
      </div>
    </motion.div>
  );
}
