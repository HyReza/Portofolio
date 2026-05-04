import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, GraduationCap, Code2, GitBranch, ArrowRight } from 'lucide-react';

interface OnboardingProps {
    onComplete: (path: 'recruiter' | 'developer') => void;
    name?: string;
}

export function OnboardingScreen({ onComplete, name = 'Reza Edi Saputra' }: OnboardingProps) {
    const [phase, setPhase] = useState<'typing' | 'cards' | 'exit'>('typing');
    const [typedText, setTypedText] = useState('');
    const fullText = `Hello! I'm ${name}-Sync. Your digital guide. What perspective are you exploring today?`;

    useEffect(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('onboarding_done')) {
            onComplete('recruiter');
            return;
        }
        let i = 0;
        const timer = setInterval(() => {
            if (i < fullText.length) { setTypedText(fullText.slice(0, i + 1)); i++; }
            else { clearInterval(timer); setTimeout(() => setPhase('cards'), 400); }
        }, 25);
        return () => clearInterval(timer);
    }, []);

    const handleSelect = (path: 'recruiter' | 'developer') => {
        setPhase('exit');
        sessionStorage.setItem('onboarding_done', '1');
        sessionStorage.setItem('visitor_path', path);
        setTimeout(() => onComplete(path), 700);
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem('onboarding_done')) return null;

    return (
        <AnimatePresence>
            {phase !== 'exit' ? (
                <motion.div exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[9999] flex flex-col bg-[#0a0a0a] text-white">

                    {/* Grid background */}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(99,102,241,0.06),transparent)]" />

                    {/* Header */}
                    <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
                        <span className="text-lg font-bold tracking-tight">{name.toUpperCase()}</span>
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5">
                            <motion.div className="h-2 w-2 rounded-full bg-green-400" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                            <span className="font-mono text-[10px] text-neutral-400">ACTIVE CODING</span>
                        </motion.div>
                    </motion.header>

                    {/* Center content */}
                    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
                        {/* Crystal sphere */}
                        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative mb-8">
                            <div className="relative flex h-20 w-20 items-center justify-center">
                                <motion.div className="absolute inset-0 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10"
                                    animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
                                <motion.div className="absolute inset-2 rounded-xl border border-purple-500/20 bg-gradient-to-tr from-purple-500/5 to-cyan-500/5"
                                    animate={{ rotate: [0, -360] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} />
                                <span className="relative text-3xl">🔮</span>
                            </div>
                            <motion.div className="absolute -inset-4 rounded-3xl blur-xl opacity-30"
                                style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.2), rgba(168,85,247,0.2), transparent)' }}
                                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} />
                        </motion.div>

                        {/* Speech bubble */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="relative mb-12 max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 text-center backdrop-blur-sm">
                            <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-neutral-800 bg-neutral-900" />
                            <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">
                                {typedText}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="ml-0.5 text-cyan-400">|</motion.span>
                            </p>
                        </motion.div>

                        {/* CTA Cards */}
                        <AnimatePresence>
                            {phase === 'cards' && (
                                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                                    className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
                                    {/* Card 1: Recruiter */}
                                    <motion.button whileHover={{ y: -4, borderColor: 'rgba(0,212,255,0.4)' }} whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect('recruiter')}
                                        className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-left backdrop-blur-sm transition-all">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:18px_18px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_20%,#000_70%,transparent_100%)]" />
                                        <div className="relative">
                                            <span className="mb-3 inline-block rounded-md border border-cyan-800 bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300">RECRUITER PATH</span>
                                            <h3 className="text-lg font-bold text-white">HRD / RECRUITER</h3>
                                            <p className="mt-2 text-sm text-neutral-400">View the Proof — Resume, GPA 3.95, Key Projects</p>
                                            <div className="mt-4 flex items-center gap-3 text-neutral-500">
                                                <FileText className="h-4 w-4" /><GraduationCap className="h-4 w-4" />
                                                <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Card 2: Developer */}
                                    <motion.button whileHover={{ y: -4, borderColor: 'rgba(168,85,247,0.4)' }} whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelect('developer')}
                                        className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-left backdrop-blur-sm transition-all">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:18px_18px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_20%,#000_70%,transparent_100%)]" />
                                        <div className="relative">
                                            <span className="mb-3 inline-block rounded-md border border-purple-800 bg-purple-950 px-2 py-0.5 font-mono text-[10px] text-purple-300">DEVELOPER PATH</span>
                                            <h3 className="text-lg font-bold text-white">DEVELOPER / TECH LEAD</h3>
                                            <p className="mt-2 text-sm text-neutral-400">Deep Dive into the Code — Stack, Architecture, Logic</p>
                                            <div className="mt-4 flex items-center gap-3 text-neutral-500">
                                                <Code2 className="h-4 w-4" /><GitBranch className="h-4 w-4" />
                                                <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
