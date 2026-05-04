import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, SearchX } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';

interface Props {
    status: number;
}

export default function ErrorPage({ status }: Props) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Logic Not Found',
        403: '403: Forbidden',
    }[status] || 'Error';

    const description = {
        503: t('Sorry, we are doing some maintenance. Please check back soon.', 'Maaf, sistem sedang dalam pemeliharaan.'),
        500: t('Whoops, something went wrong on our servers.', 'Ups, ada yang salah di server kami.'),
        404: t("The page or logic you are looking for doesn't exist.", 'Halaman atau logika yang Anda cari tidak ditemukan.'),
        403: t('Sorry, you are forbidden from accessing this page.', 'Maaf, Anda tidak memiliki akses ke halaman ini.'),
    }[status] || t('Something went wrong.', 'Ada yang salah.');

    return (
        <PublicLayout>
            <Head title={title} />
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="mb-8"
                >
                    <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                        <div className={`absolute inset-0 animate-pulse rounded-full opacity-20 ${dk ? 'bg-red-500' : 'bg-red-400'}`} />
                        {status === 404 ? (
                            <SearchX className={`h-16 w-16 ${dk ? 'text-red-400' : 'text-red-500'}`} />
                        ) : (
                            <AlertTriangle className={`h-16 w-16 ${dk ? 'text-red-400' : 'text-red-500'}`} />
                        )}
                    </div>
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }}
                    className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl"
                >
                    {title}
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.3 }}
                    className={`mb-8 max-w-md text-lg ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}
                >
                    {description}
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/" className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors ${dk ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
                        <Home className="h-5 w-5" /> {t('Return Home', 'Kembali ke Beranda')}
                    </Link>
                </motion.div>
            </div>
        </PublicLayout>
    );
}
