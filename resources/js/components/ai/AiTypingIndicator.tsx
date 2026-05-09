import { motion } from 'framer-motion';

export default function AiTypingIndicator({ dk }: { dk: boolean }) {
    return (
        <div className={`flex items-center gap-1.5 w-16 px-4 py-3.5 rounded-2xl rounded-tl-md shadow-sm border ${dk ? 'bg-neutral-800/40 border-neutral-700/30' : 'bg-white border-neutral-200/80'}`}>
            <motion.div
                className={`w-1.5 h-1.5 rounded-full ${dk ? 'bg-teal-400' : 'bg-teal-500'}`}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
                className={`w-1.5 h-1.5 rounded-full ${dk ? 'bg-teal-400' : 'bg-teal-500'}`}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
                className={`w-1.5 h-1.5 rounded-full ${dk ? 'bg-teal-400' : 'bg-teal-500'}`}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
        </div>
    );
}
