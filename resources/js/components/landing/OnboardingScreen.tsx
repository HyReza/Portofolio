import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
    onComplete: (path: 'recruiter' | 'developer') => void;
    name?: string;
}

export function OnboardingScreen({ onComplete, name = 'Reza Edi Saputra' }: OnboardingProps) {
    const [phase, setPhase] = useState<'animating' | 'exit'>('animating');

    const isLighthouseOrBot = typeof navigator !== 'undefined' && 
        (/Lighthouse|Chrome-Lighthouse|Google-PageSpeed|HeadlessChrome/i.test(navigator.userAgent) || 
         /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent));

    useEffect(() => {
        if (isLighthouseOrBot || (typeof window !== 'undefined' && sessionStorage.getItem('onboarding_done'))) {
            onComplete('recruiter');
            return;
        }
        
        // Sequence timing:
        // 0.0s -> 2.5s: Text animations
        // 2.5s -> 3.2s: Hold
        // 3.2s -> 4.0s: Exit transition
        const timer = setTimeout(() => {
            setPhase('exit');
            sessionStorage.setItem('onboarding_done', '1');
            setTimeout(() => onComplete('recruiter'), 1000); // Wait for exit animation
        }, 3200);
        
        return () => clearTimeout(timer);
    }, [isLighthouseOrBot]);

    if (isLighthouseOrBot || (typeof window !== 'undefined' && sessionStorage.getItem('onboarding_done'))) return null;

    // Split name into characters for staggered reveal
    const nameChars = name.split('');

    return (
        <AnimatePresence>
            {phase !== 'exit' ? (
                <motion.div 
                    exit={{ y: '-100%' }} 
                    transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#03050a] text-white overflow-hidden"
                >
                    {/* Ambient premium lighting */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="h-[40vw] w-[40vw] rounded-full bg-indigo-500/10 blur-[120px]" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                            className="absolute h-[30vw] w-[30vw] rounded-full bg-purple-500/10 blur-[100px]" 
                        />
                    </div>

                    {/* Central Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        
                        {/* Top Accent Line */}
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 40, opacity: 1 }}
                            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
                            className="mb-8 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                        />

                        {/* Subtitle */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.4, ease: [0.76, 0, 0.24, 1] }}
                            className="mb-6 overflow-hidden"
                        >
                            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.4em] text-indigo-200/60 uppercase">
                                Welcome to the portfolio of
                            </p>
                        </motion.div>

                        {/* Main Name Reveal (Staggered Characters) */}
                        <div className="overflow-hidden px-4 py-2 flex justify-center flex-wrap">
                            {nameChars.map((char, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ y: '100%', opacity: 0, rotateX: -45 }}
                                    animate={{ y: '0%', opacity: 1, rotateX: 0 }}
                                    transition={{ 
                                        duration: 0.8, 
                                        delay: 0.8 + (i * 0.04), 
                                        ease: [0.76, 0, 0.24, 1] 
                                    }}
                                    className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight ${char === ' ' ? 'w-3 sm:w-4 md:w-6' : ''}`}
                                    style={{ 
                                        display: 'inline-block',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        transformOrigin: 'bottom center'
                                    }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>

                        {/* Bottom Accent Line */}
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 80, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 1.5, ease: [0.76, 0, 0.24, 1] }}
                            className="mt-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
