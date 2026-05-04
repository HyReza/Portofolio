import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LINES = [
    { text: 'Hello.', delay: 0 },
    { text: "I'm Reza.", delay: 800 },
    { text: 'I build digital things.', delay: 1800 },
];

export function IntroScreen({ onComplete }: { onComplete: () => void }) {
    const [currentLine, setCurrentLine] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('intro_seen')) {
            onComplete();
            return;
        }

        // Show lines sequentially
        LINES.forEach((line, i) => {
            setTimeout(() => setCurrentLine(i + 1), line.delay);
        });

        // Fade out and complete
        setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem('intro_seen', '1');
            setTimeout(onComplete, 800);
        }, 3200);
    }, []);

    if (typeof window !== 'undefined' && sessionStorage.getItem('intro_seen')) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]"
                >
                    {/* Subtle gradient pulse */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="h-[300px] w-[300px] rounded-full blur-[120px]"
                            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)' }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>

                    <div className="relative px-8">
                        {LINES.map((line, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                                animate={currentLine > i ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                                transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                                className={`${i === 1 ? 'text-4xl sm:text-6xl md:text-7xl font-black' : 'text-xl sm:text-2xl md:text-3xl font-light'} ${i === 1 ? '' : 'text-white/40'}`}
                                style={i === 1 ? { backgroundImage: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}
                            >
                                {line.text}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
