import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram as InstagramIcon, Heart, Play, Image as ImageIcon, Maximize2, ExternalLink } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

declare global {
    interface Window {
        instgrm: any;
    }
}

interface InstagramPost {
    id: number;
    post_url: string;
    thumbnail: string | null;
    caption: string | null;
    likes_count: number;
    media_type: string;
    published_at: string | null;
}

interface Props {
    posts: InstagramPost[];
    ig_stats?: Record<string, string>;
}

export default function InstagramPage({ posts, ig_stats = {} }: Props) {
    const { theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';

    useEffect(() => {
        // Function to process embeds
        const processEmbeds = () => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        };

        // Load Instagram embed script if not already present
        if (!document.getElementById('instagram-embed-script')) {
            const script = document.createElement('script');
            script.id = 'instagram-embed-script';
            script.src = "//www.instagram.com/embed.js";
            script.async = true;
            script.onload = () => {
                setTimeout(processEmbeds, 100);
            };
            document.body.appendChild(script);
        } else {
            // Script already exists, just process
            setTimeout(processEmbeds, 500);
        }

        // Also process on every render change just in case
        processEmbeds();

        return () => {
            // We don't remove the script to keep it cached for other pages
        };
    }, [posts]);

    const truncate = (str: string | null, len: number) => {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    };

    return (
        <PublicLayout>
            <Head title="Instagram" />

            <section className="space-y-6 pb-12">
                {/* Standard Portfolio Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center py-4">
                    <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
                            <InstagramIcon className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex flex-col items-center md:items-start">
                            <h1 className="text-2xl font-bold">Instagram</h1>
                            <p className={`text-sm text-center md:text-left ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {ig_stats.ig_bio || t('My latest Instagram posts and moments', 'Postingan dan momen Instagram terbaru saya')}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 md:justify-start">
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-lg font-bold ${dk ? 'text-white' : 'text-neutral-900'}`}>{posts.length}</span>
                                    <span className={`text-sm ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{t('Posts', 'Postingan')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-2 md:ml-auto md:mt-0 md:items-end">
                        <a href={`https://instagram.com/${ig_stats.ig_username || ''}`} target="_blank" rel="noopener noreferrer"
                            className="rounded-xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/40">
                            {t('Open Instagram', 'Buka Instagram')}
                        </a>
                    </div>
                </div>

                <hr className={`${dk ? 'border-neutral-800' : 'border-neutral-200'}`} />

                {/* Post Grid View — Rock-Solid Flexbox Layout, No Overlapping */}
                {posts.length === 0 ? (
                    <div className={`flex min-h-[200px] items-center justify-center rounded-xl border text-sm ${dk ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'}`}>
                        {t('No Instagram posts yet.', 'Belum ada postingan Instagram.')}
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto px-4 py-12">
                        <div className="flex flex-wrap justify-center gap-16">
                            {posts.map((post, i) => {
                                const cleanUrl = post.post_url.split('?')[0].replace(/\/?$/, '/');
                                return (
                                    <motion.div key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="relative flex flex-col group w-[350px]"
                                    >
                                        <div className={`relative w-full h-[600px] overflow-y-auto overflow-x-hidden rounded-3xl border transition-all duration-700 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_20px_50px_rgba(236,72,153,0.05)] hide-scrollbar ${dk ? 'border-neutral-800 bg-neutral-900/40 hover:border-pink-500/30' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}>
                                            <style dangerouslySetInnerHTML={{ __html: `
                                                .hide-scrollbar::-webkit-scrollbar {
                                                    display: none;
                                                }
                                                .hide-scrollbar {
                                                    -ms-overflow-style: none;
                                                    scrollbar-width: none;
                                                }
                                            `}} />
                                            
                                            {/* Header Cropping Container */}
                                            <div className="relative -mt-[54px] px-0 flex justify-center"> 
                                                <blockquote 
                                                    className="instagram-media !m-0 !w-full" 
                                                    data-instgrm-captioned
                                                    data-instgrm-permalink={`${cleanUrl}?utm_source=ig_embed&utm_campaign=loading`}
                                                    data-instgrm-version="14" 
                                                    style={{ background: 'transparent', border: '0', margin: '0', padding: '0', width: '100%', minWidth: '100%' }}
                                                >
                                                    <div className="p-24 text-center animate-pulse">
                                                        <div className={`mx-auto mb-4 h-12 w-12 rounded-full ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Syncing Post...</p>
                                                    </div>
                                                </blockquote>
                                            </div>

                                            {/* Sticky Action Button Overlay */}
                                            <div className="sticky bottom-0 inset-x-0 pb-8 pt-16 flex justify-center bg-gradient-to-t from-inherit via-inherit/90 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                                                <a 
                                                    href={post.post_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`pointer-events-auto flex items-center gap-3 rounded-full px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95 ${dk ? 'bg-white text-black hover:bg-neutral-100' : 'bg-neutral-900 text-white hover:border-neutral-800'}`}
                                                >
                                                    {t('View Live', 'Lihat Live')} <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>
        </PublicLayout>
    );
}
