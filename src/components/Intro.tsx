import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface IntroProps {
  onComplete: () => void;
}

export function Intro({ onComplete }: IntroProps) {
  const [text, setText] = useState('');
  const fullText = '언제나 기록하기~';

  useEffect(() => {
    let timeout: any;
    
    if (text.length < fullText.length) {
      timeout = setTimeout(() => {
        setText(fullText.slice(0, text.length + 1));
      }, 120);
    } else if (text.length === fullText.length) {
      timeout = setTimeout(() => {
        onComplete();
      }, 1200);
    }

    return () => clearTimeout(timeout);
  }, [text, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 1, ease: [0.43, 0.13, 0.23, 0.96] } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#f8f6f2]"
    >
      {/* Texture & Watercolor Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-[#3d5a80]/[0.03] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-[#ee6c4d]/[0.02] rounded-full blur-[100px]"
        />
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="w-1 h-8 bg-[#ee6c4d]/20 rounded-full mx-auto" />
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-black text-[#1a2b3c] tracking-tighter flex items-center italic"
        >
          {text}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block w-[4px] h-[0.9em] bg-[#3d5a80] ml-2 rounded-full"
          />
        </motion.h1>
        
        <div className="mt-12 overflow-hidden w-24 h-px bg-[#1a2b3c]/5">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full bg-gradient-to-r from-transparent via-[#ee6c4d]/30 to-transparent"
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-[#8a96a3] font-black text-[10px] tracking-[0.4em] uppercase"
        >
          Memory Archive Platform
        </motion.p>
      </div>

      {/* Decorative Corner Element */}
      <div className="absolute bottom-12 right-12 opacity-20 hidden md:block">
        <p className="text-[#1a2b3c] font-black text-sm tracking-tighter italic uppercase">
          DayCanvas Edition
        </p>
      </div>
    </motion.div>
  );
}
