import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { Intro } from './components/Intro';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.intro_seen) {
        setShowIntro(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.intro_seen) {
        setShowIntro(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleIntroComplete = async () => {
    setShowIntro(false);
    if (session?.user && !session.user.user_metadata?.intro_seen) {
      await supabase.auth.updateUser({
        data: { intro_seen: true }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcf9] flex items-center justify-center relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-zinc-900/10 border-t-zinc-950 rounded-full z-10"
        />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#fcfcf9] text-zinc-900 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <Intro key="intro" onComplete={handleIntroComplete} />
          ) : (
            <div key="content" className="min-h-screen">
              {session ? (
                <Dashboard session={session} />
              ) : (
                <Auth />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </QueryClientProvider>
  );
}

export default App;
