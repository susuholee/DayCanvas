import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 w-full">
      <motion.div
        className="w-10 h-10 border-[3px] border-zinc-200 border-t-zinc-900 shadow-sm"
        animate={{ 
          rotate: 360, 
          borderRadius: ["25%", "50%", "25%"],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.div 
        className="flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">
          Loading
        </span>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 bg-zinc-400 rounded-full"
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
