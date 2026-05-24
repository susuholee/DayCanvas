import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import profileImg from '../assets/profile.jpg';
import { AlertModal } from './AlertModal';

export function Auth() {
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      setAlertConfig({ isOpen: true, message: '로그인 중 오류가 발생했습니다.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#f8f6f2] text-zinc-900 font-sans overflow-hidden">
      {/* Soft Artistic Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center space-y-12 relative z-10"
      >
        {/* Branding Area */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1a2b3c] leading-[1.1]">
              하루를 그리는<br />
              <span className="text-[#3d5a80]">DayCanvas</span>
            </h1>
            <p className="text-[#6b7b8c] font-medium text-lg md:text-xl max-w-md mx-auto leading-relaxed">
              복잡한 머릿속을 정리하고, 어제보다 더 성장하는 내일을 위한<br />
              당신만의 프라이빗한 기록 공간입니다.
            </p>
          </div>
        </div>

        {/* Interaction Card */}
        <div className="bg-white border border-[#e5e1d8] p-10 rounded-[3rem] shadow-2xl shadow-zinc-200/50 space-y-10 relative overflow-hidden">
          <div className="text-left space-y-2">
            <h3 className="text-xl font-black tracking-tight text-[#1a2b3c]">환영합니다.</h3>
            <p className="text-sm text-[#8a96a3] font-medium">준비된 캔버스에 오늘의 이야기를 시작해보세요.</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="group w-full flex items-center justify-center gap-4 px-8 py-6 bg-[#1a2b3c] text-white font-black rounded-3xl hover:bg-[#2c3e50] transition-all duration-300 shadow-xl active:scale-[0.98] text-xl"
          >
            Google 계정으로 로그인
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 pt-10 border-t border-[#f0eee6]">
            <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-xl font-black text-[#1a2b3c] uppercase tracking-tighter">다이어리</p>
              <p className="text-sm md:text-base text-[#8a96a3] font-medium leading-relaxed">오늘의 감정을<br /> 정교하게</p>
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-xl font-black text-[#1a2b3c] uppercase tracking-tighter">포스트잇</p>
              <p className="text-sm md:text-base text-[#8a96a3] font-medium leading-relaxed">아이디어를<br /> 자유롭게</p>
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-xl font-black text-[#1a2b3c] uppercase tracking-tighter">캘린더</p>
              <p className="text-sm md:text-base text-[#8a96a3] font-medium leading-relaxed">완벽한 계획을<br /> 설계하세요</p>
            </div>
          </div>
        </div>

        {/* Creator Section */}
        <div className="pt-10 border-t border-[#e5e1d8]/50 flex flex-col md:flex-row items-center justify-between gap-8 px-6">
          <div className="flex items-center gap-5">
            <img src={profileImg} alt="Developer" className="w-20 h-20 rounded-full border-4 border-white shadow-xl grayscale" />
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-[#8a96a3] uppercase tracking-[0.3em]">Developer</p>
              <p className="text-xl font-black text-[#1a2b3c]">이수호 (Lee Su-ho)</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <a href="https://simplecoding77.tistory.com/" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-[#8a96a3] hover:text-[#1a2b3c] transition-colors uppercase tracking-widest">Blog</a>
            <a href="https://susuholee.github.io/" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-[#8a96a3] hover:text-[#1a2b3c] transition-colors uppercase tracking-widest">Portfolio</a>
          </div>
        </div>
      </motion.div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3d5a80]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ee6c4d]/[0.02] rounded-full blur-[100px]" />
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
