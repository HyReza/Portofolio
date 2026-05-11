import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, ShieldX, SearchX, ServerCrash, WifiOff } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';

interface Props {
    status: number;
    message?: string;
}

/* Floating particle */
function Particle({ dk, delay, x, y, size }: { dk: boolean; delay: number; x: string; y: string; size: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5], y: [0, -30, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
            className="absolute rounded-full"
            style={{ left: x, top: y, width: size, height: size, background: dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }}
        />
    );
}

export default function ErrorPage({ status, message }: Props) {
    const { theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    const config: Record<number, { icon: typeof SearchX; title: string; desc: string; accent: string; border: string }> = {
        404: {
            icon: SearchX,
            title: '404',
            desc: t(
                "The page you're looking for seems to have wandered off into the void.",
                'Halaman yang Anda cari sepertinya sudah menghilang ke kehampaan.'
            ),
            accent: 'text-violet-500',
            border: 'border-violet-500',
        },
        403: {
            icon: ShieldX,
            title: '403',
            desc: t(
                "You don't have permission to access this area. This zone is restricted.",
                'Anda tidak memiliki izin untuk mengakses area ini. Zona ini dibatasi.'
            ),
            accent: 'text-amber-500',
            border: 'border-amber-500',
        },
        500: {
            icon: ServerCrash,
            title: '500',
            desc: t(
                'Our servers hit a snag. We\'re working on fixing it.',
                'Server kami mengalami masalah. Kami sedang memperbaikinya.'
            ),
            accent: 'text-red-500',
            border: 'border-red-500',
        },
        503: {
            icon: WifiOff,
            title: '503',
            desc: t(
                'We\'re currently undergoing maintenance. Please check back soon.',
                'Kami sedang melakukan pemeliharaan. Silakan cek kembali nanti.'
            ),
            accent: 'text-sky-500',
            border: 'border-sky-500',
        },
    };

    const c = config[status] || config[500];
    const Icon = c.icon;

    const subtitle: Record<number, string> = {
        404: t('Page Not Found', 'Halaman Tidak Ditemukan'),
        403: t('Access Denied', 'Akses Ditolak'),
        500: t('Server Error', 'Kesalahan Server'),
        503: t('Under Maintenance', 'Dalam Pemeliharaan'),
    };

    return (
        <PublicLayout>
            <Head title={`${c.title} — ${subtitle[status] || 'Error'}`} />

            <div className="relative flex min-h-[70vh] sm:min-h-[65vh] flex-col items-center justify-center text-center overflow-hidden px-4">
                {/* Background glow */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{ background: `radial-gradient(circle at 50% 40%, ${status === 404 ? (dk ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)') : status === 403 ? (dk ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)') : status === 503 ? (dk ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.1)') : (dk ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)')}, transparent 70%)` }}
                />

                {/* Floating particles */}
                <div className="pointer-events-none absolute inset-0">
                    <Particle dk={dk} delay={0} x="15%" y="20%" size={8} />
                    <Particle dk={dk} delay={0.8} x="80%" y="15%" size={6} />
                    <Particle dk={dk} delay={1.5} x="25%" y="70%" size={10} />
                    <Particle dk={dk} delay={2.2} x="70%" y="65%" size={7} />
                    <Particle dk={dk} delay={0.4} x="50%" y="85%" size={5} />
                    <Particle dk={dk} delay={3} x="90%" y="40%" size={9} />
                </div>

                {/* Big status code — background watermark */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
                    className="absolute select-none pointer-events-none"
                >
                    <span className={`text-[120px] sm:text-[180px] lg:text-[240px] font-black tracking-tighter leading-none ${dk ? 'text-white/[0.03]' : 'text-black/[0.03]'}`}>
                        {c.title}
                    </span>
                </motion.div>

                {/* Icon with animated ring */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="relative z-10 mb-6 sm:mb-8"
                >
                    <div className="relative flex items-center justify-center">
                        {/* Pulsing ring */}
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className={`absolute h-20 w-20 sm:h-28 sm:w-28 rounded-full border-2 ${c.border}`}
                        />
                        {/* Second ring */}
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            className={`absolute h-20 w-20 sm:h-28 sm:w-28 rounded-full border ${c.border}`}
                        />
                        {/* Icon container */}
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border shadow-lg ${dk ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}
                        >
                            <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${c.accent}`} strokeWidth={1.5} />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Status code + subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="relative z-10 mb-3"
                >
                    <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${c.accent}`}>
                        {c.title}
                    </h1>
                    <p className={`mt-1 text-sm sm:text-base font-semibold uppercase tracking-widest ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {subtitle[status] || 'Error'}
                    </p>
                </motion.div>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className={`relative z-10 mb-8 sm:mb-10 max-w-sm sm:max-w-md text-sm sm:text-base leading-relaxed ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}
                >
                    {message || c.desc}
                </motion.p>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="relative z-10 flex flex-col sm:flex-row items-center gap-3"
                >
                    <Link
                        href="/"
                        className={`group inline-flex items-center gap-2.5 rounded-xl px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${dk
                            ? 'bg-white text-neutral-900 hover:bg-neutral-100 shadow-white/5'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-neutral-900/10'
                        }`}
                    >
                        <Home className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                        {t('Return Home', 'Kembali ke Beranda')}
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] border ${dk
                            ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800/50'
                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('Go Back', 'Kembali')}
                    </button>
                </motion.div>
            </div>
        </PublicLayout>
    );
}
