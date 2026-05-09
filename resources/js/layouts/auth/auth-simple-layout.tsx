import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Lock, ShieldCheck } from 'lucide-react';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="dark relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#030014] text-foreground font-sans">
            
            {/* --- Deep Space Background --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />
                <div className="absolute top-[20%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/assets/img/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* --- Particles/Grid --- */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[420px] px-6 py-12"
            >
                {/* Logo & Branding */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link href={home()} className="group relative inline-flex items-center justify-center mb-6">
                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl transition-all duration-500 group-hover:bg-indigo-500/40 group-hover:blur-2xl" />
                        <img 
                            src="/assets/img/logo.png" 
                            alt="Logo" 
                            className="relative h-12 w-auto object-contain brightness-200 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-transform duration-500 group-hover:scale-110" 
                        />
                    </Link>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="inline-flex items-center justify-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 mb-4">
                            <ShieldCheck size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Portofolio Reza Edi Saputra</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Portal</span>
                        </h1>
                        <p className="mt-2 text-sm text-neutral-400">
                            Otorisasi diperlukan untuk mengelola konten.
                        </p>
                    </motion.div>
                </div>

                {/* Glass Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
                >
                    {/* Top glass reflection */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                    
                    {children}
                </motion.div>

                {/* Footer */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center"
                >
                    <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 font-medium">
                        <Lock size={12} /> Restricted Access • Private Network
                    </p>
                </motion.div>

            </motion.div>
        </div>
    );
}
