import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { SeoHead } from '@/components/SeoHead';
import { motion } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp, ImageReveal } from '@/components/animations';
import { SearchableFilter } from '@/components/ui/searchable-filter';

interface BlogPost { id: number; title_id: string; title_en: string; slug: string; excerpt_en: string | null; excerpt_id: string | null; thumbnail: string | null; published_at: string | null; tags: { id: number; name_en: string; name_id: string; }[]; }

export default function Blog({ blogs }: { blogs: { data: BlogPost[] } }) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const posts = blogs.data || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('All');

    // Extract unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        posts.forEach(post => {
            post.tags.forEach(tag => {
                tagSet.add(lang === 'id' ? (tag.name_id || tag.name_en) : (tag.name_en || tag.name_id));
            });
        });
        return ['All', ...Array.from(tagSet)];
    }, [posts, lang]);

    // Filter posts
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const title = (lang === 'id' ? (post.title_id || post.title_en) : (post.title_en || post.title_id)).toLowerCase();
            const excerpt = ((lang === 'id' ? post.excerpt_id : post.excerpt_en) || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            const matchesSearch = title.includes(query) || excerpt.includes(query);
            
            const postTags = post.tags.map(t => lang === 'id' ? (t.name_id || t.name_en) : (t.name_en || t.name_id));
            const matchesTag = selectedTag === 'All' || postTags.includes(selectedTag);

            return matchesSearch && matchesTag;
        });
    }, [posts, searchQuery, selectedTag, lang]);

    return (
        <PublicLayout>
            <SeoHead 
                title={t('Blog', 'Blog')} 
                description={t('Thoughts, tutorials & insights about software development.', 'Pemikiran, tutorial & wawasan tentang pengembangan perangkat lunak.')}
            />
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <FadeUp><p className={`text-xs font-bold uppercase tracking-[0.25em] ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>{t('Articles', 'Artikel')}</p></FadeUp>
                    <TextReveal className="mt-3 text-4xl font-black sm:text-5xl">{t('Blog', 'Blog')}</TextReveal>
                    <FadeUp delay={0.4}><p className={`mt-4 max-w-md text-lg ${dk ? 'text-white/40' : 'text-gray-500'}`}>{t('Thoughts, tutorials & insights.', 'Pemikiran, tutorial & wawasan.')}</p></FadeUp>

                    {/* Search & Filter Section */}
                    {posts.length > 0 && (
                        <FadeUp delay={0.5} className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
                            <div className="relative w-full max-w-md">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${dk ? 'text-white/30' : 'text-gray-400'}`} />
                                <input 
                                    type="text" 
                                    placeholder={t('Search articles...', 'Cari artikel...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full rounded-2xl pl-12 pr-4 py-3 outline-none transition-all ${dk ? 'bg-white/5 focus:bg-white/10 text-white placeholder:text-white/30 border border-white/5 focus:border-indigo-500/30' : 'bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm'}`}
                                />
                            </div>
                            
                            {/* Tags Dropdown Filter */}
                            <SearchableFilter
                                value={selectedTag}
                                onValueChange={setSelectedTag}
                                items={allTags}
                                allLabel={t('All Tags', 'Semua Tag')}
                                searchPlaceholder={t('Search tag...', 'Cari tag...')}
                                dark={dk}
                            />
                        </FadeUp>
                    )}

                    {filteredPosts.length === 0 ? (
                        <FadeUp delay={0.6}>
                            <div className={`mt-20 flex flex-col items-center justify-center rounded-3xl p-12 text-center ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                                    className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600 shadow-inner'}`}
                                >
                                    <motion.div
                                        animate={{ 
                                            y: [0, -10, 0],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Search className="h-14 w-14 opacity-40" />
                                    </motion.div>
                                </motion.div>
                                <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{t('No articles found', 'Tidak ada artikel yang ditemukan')}</h3>
                                <p className={`mt-2 max-w-sm text-sm ${dk ? 'text-white/40' : 'text-gray-500'}`}>
                                    {t("We couldn't find any articles matching your search criteria. Try adjusting your filters.", "Kami tidak dapat menemukan artikel yang cocok dengan pencarian Anda. Coba sesuaikan filter Anda.")}
                                </p>
                                {(searchQuery || selectedTag !== 'All') && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
                                        className={`mt-6 rounded-full px-6 py-2.5 text-sm font-medium transition-all ${dk ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                                    >
                                        {t('Clear Filters', 'Hapus Filter')}
                                    </button>
                                )}
                            </div>
                        </FadeUp>
                    ) : (
                        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredPosts.map((b, i) => (
                                <motion.article key={b.id} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
                                    transition={{ delay: (i % 6) * 0.1, duration: 0.7, ease: [0.25,0.4,0.25,1] }}
                                    whileHover={{ y: -8 }}
                                    className={`group flex flex-col h-full overflow-hidden rounded-3xl ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/15 hover:bg-white/[0.04]' : 'bg-white border border-gray-100 hover:shadow-2xl'}`}>
                                    <Link href={`/blog/${b.slug}`} className="flex flex-col h-full w-full">
                                        <div className="overflow-hidden aspect-[16/10] shrink-0 relative">
                                            {b.thumbnail ? <ImageReveal src={`/storage/${b.thumbnail}`} alt={b.title_en || ''} className="absolute inset-0 h-full w-full" /> :
                                            <div className={`flex absolute inset-0 h-full w-full items-center justify-center ${dk ? 'bg-indigo-500/[0.03]' : 'bg-indigo-50/50'}`}><Sparkles className="h-12 w-12 text-indigo-500/10" /></div>}
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <h2 className={`font-bold group-hover:text-indigo-400 transition-colors line-clamp-2 text-lg`}>{lang === 'id' ? (b.title_id || b.title_en) : (b.title_en || b.title_id)}</h2>
                                            {(b.excerpt_en || b.excerpt_id) && <p className={`mt-3 line-clamp-2 text-sm ${dk ? 'text-white/40' : 'text-gray-500'}`}>{lang === 'id' ? (b.excerpt_id || b.excerpt_en) : (b.excerpt_en || b.excerpt_id)}</p>}
                                            {b.published_at && <p className={`mt-auto pt-5 text-xs font-semibold uppercase tracking-wider ${dk ? 'text-white/20' : 'text-gray-400'}`}>{new Date(b.published_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
