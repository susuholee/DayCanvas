import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Todo } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { PostitView } from './PostitView';
import { CalendarView } from './CalendarView';
import { SalaryView } from './SalaryView';
import { TodoForm } from './TodoForm';
import { MemoForm } from './MemoForm';
import { InquiryBoard } from './InquiryBoard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertModal } from './AlertModal';

interface DashboardProps {
  session: Session;
}

export function Dashboard({ session }: DashboardProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'postit' | 'calendar' | 'salary' | 'inquiry'>('postit');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMemoFormOpen, setIsMemoFormOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  // Fetch Todos with useQuery
  const { data: todos = [], isLoading: loading } = useQuery<Todo[]>({
    queryKey: ['todos', session.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Mutation for deleting todo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  // Mutation for updating todo
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Todo> }) => {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleLogout = () => supabase.auth.signOut();

  const onAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlertConfig({ isOpen: true, message, type });
  };

  return (
    <div className="flex h-screen bg-[#fcfcf9] overflow-hidden font-sans text-zinc-900 relative">

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-40 px-4 py-2 bg-white rounded-lg border border-zinc-200 shadow-sm text-[10px] font-black text-zinc-900 tracking-widest uppercase"
      >
        메뉴
      </button>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-zinc-200 p-8 transform transition-transform duration-500 lg:translate-x-0 lg:static flex flex-col
        ${isSidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-zinc-950">DayCanvas</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-[0.2em]"
          >
            닫기
          </button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-3 mb-4">보기 모드</p>
          <button
            onClick={() => { setViewMode('postit'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${viewMode === 'postit' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'}`}
          >
            <span className={`font-bold text-sm ${viewMode === 'postit' ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>일기장 모드</span>
          </button>
          <button
            onClick={() => { setViewMode('calendar'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${viewMode === 'calendar' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'}`}
          >
            <span className={`font-bold text-sm ${viewMode === 'calendar' ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>달력 모드</span>
          </button>
          
          <button
            onClick={() => { setViewMode('salary'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${viewMode === 'salary' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'}`}
          >
            <span className={`font-bold text-sm ${viewMode === 'salary' ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>월급 관리</span>
          </button>
          
          <div className="h-[1px] bg-zinc-100 my-4 mx-2" />
          
          <button
            onClick={() => { setViewMode('inquiry'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${viewMode === 'inquiry' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'}`}
          >
            <span className={`font-bold text-sm ${viewMode === 'inquiry' ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>문의 게시판</span>
          </button>

        </nav>

        <div className="mt-auto pt-8 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-2 mb-8">
            <img src={session.user.user_metadata.avatar_url} className="w-10 h-10 rounded-full border border-zinc-200" alt="Avatar" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate tracking-tight text-zinc-900">{session.user.user_metadata.full_name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-4 text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 rounded-2xl transition-all text-xs font-black uppercase tracking-widest bg-zinc-50/50 hover:bg-white hover:shadow-sm"
          >
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-12 pt-24 lg:pt-12 bg-[#fcfcf9]">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 max-w-6xl mx-auto px-4 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-zinc-900 tracking-tighter mb-4"
            >
              {viewMode === 'postit' ? '나의 일기장' : viewMode === 'calendar' ? '달력 보기' : viewMode === 'salary' ? '급여 관리' : ''}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500 font-medium text-lg"
            >
              {viewMode === 'postit'
                ? '나의 일상이 쌓이는 소중한 공간'
                : viewMode === 'calendar'
                ? '미래를 계획하는 나의 시간'
                : viewMode === 'salary'
                ? '나의 소중한 급여 정보'
                : ''}

            </motion.p>
          </div>
          {viewMode !== 'salary' && viewMode !== 'inquiry' && (
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMemoFormOpen(true)}
                className="px-5 py-3 bg-violet-50 border border-violet-200 text-violet-700 rounded-2xl text-sm font-black hover:bg-violet-100 transition-all"
              >
                메모 추가
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFormOpen(true)}
                className="btn-bouncy"
              >
                <span className="text-sm tracking-tight text-white font-black">계획 추가</span>
              </motion.button>
            </div>
          )}

        </header>

        <div className="max-w-6xl mx-auto">
          {loading && todos.length === 0 ? (
            <LoadingSpinner />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                {viewMode === 'postit' ? (
                  <PostitView
                    todos={todos}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onUpdate={async (id, updates) => {
                      try {
                        await updateMutation.mutateAsync({ id, updates });
                        return true;
                      } catch (error) {
                        onAlert('수정 중 오류가 발생했습니다.', 'error');
                        return false;
                      }
                    }}
                    onAlert={onAlert}
                    providerToken={session.provider_token || undefined}
                  />
                ) : viewMode === 'calendar' ? (
                  <CalendarView todos={todos} session={session} />
                ) : viewMode === 'salary' ? (
                  <SalaryView />
                ) : (
                  <InquiryBoard session={session} onAlert={onAlert} />
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Memo Form Modal */}
      <AnimatePresence>
        {isMemoFormOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsMemoFormOpen(false)}
          >
            <MemoForm
              onClose={() => setIsMemoFormOpen(false)}
              onSuccess={() => setIsMemoFormOpen(false)}
              onAlert={onAlert}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Todo Form Modal (Flex Centered) */}
      <AnimatePresence>
        {isFormOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsFormOpen(false)}
          >
            <TodoForm
              onClose={() => setIsFormOpen(false)}
              onSuccess={() => setIsFormOpen(false)}
              onAlert={onAlert}
              providerToken={session.provider_token || undefined}
            />
          </div>
        )}
      </AnimatePresence>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
