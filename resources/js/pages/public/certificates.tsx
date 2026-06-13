import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Award, Search, Calendar, Filter, ExternalLink, X, ZoomIn } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { PublicLayout } from '@/layouts/PublicLayout';
import { TextReveal, FadeUp } from '@/components/animations';
import { SearchableFilter } from '@/components/ui/searchable-filter';

interface CertCategory {
    id: number;
    name_id: string;
    name_en: string | null;
}

interface CredentialType {
    id: number;
    name_id: string;
    name_en: string | null;
}

interface Certificate {
    id: number;
    title: string;
    title_en: string | null;
    issuer: string;
    credential_id: string | null;
    credential_url: string | null;
    image: string | null;
    credential_type: string | null;
    credential_type_en: string | null;
    issued_date: string | null;
    expiry_date: string | null;
    description_id: string | null;
    description_en: string | null;
    skills: string[] | null;
    category: string | null;
    category_en: string | null;
    categories?: CertCategory[];
    credential_types?: CredentialType[];
}

export default function Certificates({ certificates, allCategories, allCredentialTypes }: { certificates: Certificate[], allCategories?: CertCategory[], allCredentialTypes?: CredentialType[] }) {
    const { lang, theme: appTheme, t } = useApp();
    const dk = appTheme === 'dark';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedCredentialType, setSelectedCredentialType] = useState<string>('All');
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const pv = (idStr: string | null | undefined, enStr: string | null | undefined) =>
        lang === 'id' ? (idStr || enStr || '') : (enStr || idStr || '');

    const getSkills = (cert: Certificate | null): string[] => {
        if (!cert) return [];
        return Array.isArray(cert.skills) ? cert.skills : (typeof cert.skills === 'string' ? [cert.skills] : []);
    };

    // Extract unique categories from both legacy and new many-to-many
    const categories = useMemo(() => {
        const cats = new Set<string>();
        if (Array.isArray(certificates)) {
            certificates.forEach(c => {
                // From many-to-many relationship
                if (c.categories && c.categories.length > 0) {
                    c.categories.forEach(cat => {
                        const catName = pv(cat.name_id, cat.name_en);
                        if (catName) cats.add(catName);
                    });
                } else {
                    // Legacy fallback
                    const cat = pv(c?.category, c?.category_en);
                    if (cat) cats.add(cat);
                }
            });
        }
        return ['All', ...Array.from(cats).sort()];
    }, [certificates, allCategories, lang]);

    const credentialTypes = useMemo(() => {
        const types = new Set<string>();
        if (allCredentialTypes && allCredentialTypes.length > 0) {
            allCredentialTypes.forEach(t => {
                const tName = pv(t.name_id, t.name_en);
                if (tName) types.add(tName);
            });
        } else if (Array.isArray(certificates)) {
            certificates.forEach(c => {
                if (c.credential_types && c.credential_types.length > 0) {
                    c.credential_types.forEach(t => {
                        const tName = pv(t.name_id, t.name_en);
                        if (tName) types.add(tName);
                    });
                } else {
                    const tName = pv(c?.credential_type, c?.credential_type_en);
                    if (tName) types.add(tName);
                }
            });
        }
        return ['All', ...Array.from(types).sort()];
    }, [certificates, allCredentialTypes, lang]);

    // Filter
    const filteredCertificates = useMemo(() => {
        if (!Array.isArray(certificates)) return [];
        return certificates.filter(cert => {
            const title = pv(cert?.title, cert?.title_en).toLowerCase();
            const issuer = (cert?.issuer || '').toLowerCase();
            const query = (searchQuery || '').toLowerCase();
            const skills = getSkills(cert);

            // Get category names from many-to-many or legacy
            const certCats: string[] = [];
            if (cert.categories && cert.categories.length > 0) {
                cert.categories.forEach(cat => {
                    const catName = pv(cat.name_id, cat.name_en);
                    if (catName) certCats.push(catName);
                });
            } else {
                const cat = pv(cert?.category, cert?.category_en);
                if (cat) certCats.push(cat);
            }

            const certTypes: string[] = [];
            if (cert.credential_types && cert.credential_types.length > 0) {
                cert.credential_types.forEach(t => {
                    const tName = pv(t.name_id, t.name_en);
                    if (tName) certTypes.push(tName);
                });
            } else {
                const tName = pv(cert?.credential_type, cert?.credential_type_en);
                if (tName) certTypes.push(tName);
            }

            const matchesSearch = title.includes(query) || issuer.includes(query) ||
                skills.join(' ').toLowerCase().includes(query);
            const matchesCategory = selectedCategory === 'All' || certCats.includes(selectedCategory);
            const matchesType = selectedCredentialType === 'All' || certTypes.includes(selectedCredentialType);

            return matchesSearch && matchesCategory && matchesType;
        });
    }, [certificates, searchQuery, selectedCategory, selectedCredentialType, lang]);

    return (
        <PublicLayout>
            <Head title={`${t('Certificates & Credentials', 'Sertifikat & Kredensial')} | Portfolio`}>
                <meta name="description" content={t('Explore my professional certifications, credentials, and achievements.', 'Jelajahi sertifikasi profesional, kredensial, dan pencapaian saya.')} />
                <meta name="keywords" content="certificates, credentials, portfolio, certifications, achievements, skills" />
            </Head>

            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    {/* Header — matches projects.tsx & blog.tsx pattern */}
                    <FadeUp>
                        <p className={`text-xs font-bold uppercase tracking-[0.25em] ${dk ? 'text-indigo-400/50' : 'text-indigo-500'}`}>
                            {t('Credentials', 'Kredensial')}
                        </p>
                    </FadeUp>
                    <TextReveal className="mt-3 text-4xl font-black sm:text-5xl">
                        {t('Certificates', 'Sertifikat')}
                    </TextReveal>
                    <FadeUp delay={0.4}>
                        <p className={`mt-4 max-w-md text-lg ${dk ? 'text-white/40' : 'text-gray-500'}`}>
                            {t('Professional certifications & verified skills.', 'Sertifikasi profesional & keahlian terverifikasi.')}
                        </p>
                    </FadeUp>

                    {/* Search & Filter — matching projects.tsx pattern exactly */}
                    <FadeUp delay={0.5} className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
                        <div className="relative w-full max-w-md">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${dk ? 'text-white/30' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder={t('Search certificates...', 'Cari sertifikat...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full rounded-2xl pl-12 pr-4 py-3 outline-none transition-all ${dk ? 'bg-white/5 focus:bg-white/10 text-white placeholder:text-white/30 border border-white/5 focus:border-indigo-500/30' : 'bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm'}`}
                            />
                        </div>

                        <SearchableFilter
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                            items={categories}
                            allLabel={t('All Categories', 'Semua Kategori')}
                            searchPlaceholder={t('Search category...', 'Cari kategori...')}
                            dark={dk}
                        />

                        <SearchableFilter
                            value={selectedCredentialType}
                            onValueChange={setSelectedCredentialType}
                            items={credentialTypes}
                            allLabel={t('All Types', 'Semua Tipe')}
                            searchPlaceholder={t('Search type...', 'Cari tipe...')}
                            dark={dk}
                        />
                    </FadeUp>

                    {/* Empty State */}
                    {filteredCertificates.length === 0 ? (
                        <FadeUp delay={0.6}>
                            <div className={`mt-20 flex flex-col items-center justify-center rounded-3xl p-12 text-center ${dk ? 'bg-white/[0.02] border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                                    className={`mb-6 flex h-32 w-32 items-center justify-center rounded-full ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600 shadow-inner'}`}
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Award className="h-14 w-14 opacity-40" />
                                    </motion.div>
                                </motion.div>
                                <h3 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>
                                    {t('No certificates found', 'Tidak ada sertifikat yang ditemukan')}
                                </h3>
                                <p className={`mt-2 max-w-sm text-sm ${dk ? 'text-white/40' : 'text-gray-500'}`}>
                                    {t("We couldn't find any certificates matching your criteria. Try adjusting your filters.", "Kami tidak dapat menemukan sertifikat yang cocok dengan pencarian Anda.")}
                                </p>
                                {(searchQuery || selectedCategory !== 'All' || selectedCredentialType !== 'All') && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedCredentialType('All'); }}
                                        className={`mt-6 rounded-full px-6 py-2.5 text-sm font-medium transition-all ${dk ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                                    >
                                        {t('Clear Filters', 'Hapus Filter')}
                                    </button>
                                )}
                            </div>
                        </FadeUp>
                    ) : (
                        /* Certificate Grid — matching blog.tsx card pattern */
                        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCertificates.map((c, i) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-30px' }}
                                    transition={{ delay: (i % 6) * 0.1, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                                    whileHover={{ y: -8 }}
                                    onClick={() => setSelectedCert(c)}
                                    className={`group cursor-pointer overflow-hidden rounded-3xl ${dk ? 'bg-white/[0.02] border border-white/5 hover:border-indigo-500/15 hover:bg-white/[0.04]' : 'bg-white border border-gray-100 hover:shadow-2xl'}`}
                                >
                                    {/* Image */}
                                    <div className="overflow-hidden aspect-[16/10]">
                                        {c.image ? (
                                            <img
                                                src={`/storage/${c.image}`}
                                                alt={pv(c.title, c.title_en)}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className={`flex h-full items-center justify-center ${dk ? 'bg-indigo-500/[0.03]' : 'bg-indigo-50/50'}`}>
                                                <Award className="h-12 w-12 text-indigo-500/10" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {/* Type badges */}
                                        {c.credential_types && c.credential_types.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {c.credential_types.map(t => (
                                                    <span key={t.id} className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {pv(t.name_id, t.name_en)}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : pv(c.credential_type, c.credential_type_en) ? (
                                            <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-3 ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {pv(c.credential_type, c.credential_type_en)}
                                            </span>
                                        ) : null}

                                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-indigo-400 transition-colors">
                                            {pv(c.title, c.title_en)}
                                        </h3>

                                        <p className={`mt-2 text-sm font-medium ${dk ? 'text-white/40' : 'text-gray-500'}`}>
                                            {c.issuer}
                                        </p>

                                        {/* Skills */}
                                        {getSkills(c).length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {getSkills(c).slice(0, 3).map((skill, j) => (
                                                    <span key={j} className={`rounded-xl border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${dk ? 'border-white/5 bg-white/5 text-neutral-500' : 'border-neutral-100 bg-neutral-50 text-neutral-400'}`}>
                                                        {skill}
                                                    </span>
                                                ))}
                                                {getSkills(c).length > 3 && (
                                                    <span className={`rounded-xl border px-3 py-1 text-[10px] font-bold ${dk ? 'border-white/5 bg-white/5 text-neutral-500' : 'border-neutral-100 bg-neutral-50 text-neutral-400'}`}>
                                                        +{getSkills(c).length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className={`mt-5 pt-4 flex items-center justify-between border-t ${dk ? 'border-white/5' : 'border-gray-100'}`}>
                                            {c.issued_date ? (
                                                <span className={`text-xs font-semibold uppercase tracking-wider ${dk ? 'text-white/20' : 'text-gray-400'}`}>
                                                    {new Date(c.issued_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : <span />}
                                            {c.credential_url && (
                                                <span className={`text-xs font-bold transition-colors ${dk ? 'text-indigo-400/50 group-hover:text-indigo-400' : 'text-indigo-500/50 group-hover:text-indigo-500'}`}>
                                                    {t('Verify', 'Verifikasi')} →
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Detail Modal ─── */}
            {selectedCert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedCert(null)}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col md:flex-row ${dk ? 'bg-neutral-900' : 'bg-white'}`}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setSelectedCert(null)}
                            className={`absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full transition-all ${dk ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-gray-600'}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Image Panel */}
                        <div className={`w-full md:w-3/5 shrink-0 flex items-center justify-center p-6 sm:p-10 ${dk ? 'bg-black/30' : 'bg-gray-50'}`}>
                            {selectedCert.image ? (
                                <div className="relative group/img cursor-pointer" onClick={() => setFullscreenImage(`/storage/${selectedCert.image}`)}>
                                    <img
                                        src={`/storage/${selectedCert.image}`}
                                        alt={pv(selectedCert.title, selectedCert.title_en)}
                                        className="max-h-[35vh] sm:max-h-[60vh] w-auto max-w-full object-contain rounded-lg"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg bg-black/30">
                                        <span className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                                            <ZoomIn className="h-4 w-4" /> {t('View Full Image', 'Lihat Gambar Penuh')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex h-48 w-full items-center justify-center rounded-xl ${dk ? 'bg-white/[0.02]' : 'bg-gray-100'}`}>
                                    <Award className={`h-20 w-20 ${dk ? 'text-white/5' : 'text-gray-200'}`} />
                                </div>
                            )}
                        </div>

                        {/* Info Panel */}
                        <div className={`w-full md:w-2/5 overflow-y-auto p-6 sm:p-8 flex flex-col ${dk ? 'border-l border-white/5' : 'border-l border-gray-100'}`}>
                            {/* Type */}
                            {selectedCert.credential_types && selectedCert.credential_types.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {selectedCert.credential_types.map(t => (
                                        <span key={t.id} className={`inline-block w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {pv(t.name_id, t.name_en)}
                                        </span>
                                    ))}
                                </div>
                            ) : pv(selectedCert.credential_type, selectedCert.credential_type_en) ? (
                                <span className={`inline-block w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-4 ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {pv(selectedCert.credential_type, selectedCert.credential_type_en)}
                                </span>
                            ) : null}

                            <h2 className={`text-xl sm:text-2xl font-black leading-tight break-words ${dk ? 'text-white' : 'text-gray-900'}`}>
                                {pv(selectedCert.title, selectedCert.title_en)}
                            </h2>
                            <p className={`mt-2 text-sm font-semibold ${dk ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                {selectedCert.issuer}
                            </p>

                            {/* Meta grid */}
                            <div className={`mt-6 space-y-4 text-sm ${dk ? 'text-white/60' : 'text-gray-600'}`}>
                                {selectedCert.credential_id && (
                                    <div>
                                        <span className={`block text-[10px] font-bold uppercase tracking-widest mb-0.5 ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                                            {t('Credential ID', 'ID Kredensial')}
                                        </span>
                                        <span className="font-mono font-semibold break-all">{selectedCert.credential_id}</span>
                                    </div>
                                )}

                                {(selectedCert.categories && selectedCert.categories.length > 0) ? (
                                    <div>
                                        <span className={`block text-[10px] font-bold uppercase tracking-widest mb-0.5 ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                                            {t('Categories', 'Kategori')}
                                        </span>
                                        <span className="font-semibold break-words">
                                            {selectedCert.categories.map(c => pv(c.name_id, c.name_en)).join(', ')}
                                        </span>
                                    </div>
                                ) : pv(selectedCert.category, selectedCert.category_en) && (
                                    <div>
                                        <span className={`block text-[10px] font-bold uppercase tracking-widest mb-0.5 ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                                            {t('Category', 'Kategori')}
                                        </span>
                                        <span className="font-semibold break-words">{pv(selectedCert.category, selectedCert.category_en)}</span>
                                    </div>
                                )}

                                {selectedCert.issued_date && (
                                    <div>
                                        <span className={`block text-[10px] font-bold uppercase tracking-widest mb-0.5 ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                                            {t('Issue Date', 'Tanggal Terbit')}
                                        </span>
                                        <span className="font-semibold">
                                            {new Date(selectedCert.issued_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}

                                {selectedCert.expiry_date && (
                                    <div>
                                        <span className={`block text-[10px] font-bold uppercase tracking-widest mb-0.5 ${dk ? 'text-white/30' : 'text-gray-400'}`}>
                                            {t('Expires', 'Kedaluwarsa')}
                                        </span>
                                        <span className="font-semibold">
                                            {new Date(selectedCert.expiry_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {pv(selectedCert.description_id, selectedCert.description_en) && (
                                <p className={`mt-6 text-sm leading-relaxed break-words ${dk ? 'text-white/50' : 'text-gray-600'}`}>
                                    {pv(selectedCert.description_id, selectedCert.description_en)}
                                </p>
                            )}

                            {/* Skills */}
                            {getSkills(selectedCert).length > 0 && (
                                <div className="mt-6 flex flex-wrap gap-1.5">
                                    {getSkills(selectedCert).map((skill, i) => (
                                        <span key={i} className={`rounded-xl border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${dk ? 'border-white/5 bg-white/5 text-neutral-500' : 'border-neutral-100 bg-neutral-50 text-neutral-400'}`}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Action */}
                            {selectedCert.credential_url && (
                                <a
                                    href={selectedCert.credential_url}
                                    target="_blank"
                                    rel="noopener"
                                    className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-all hover:scale-105 active:scale-95 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500"
                                >
                                    {t('Verify Credential', 'Verifikasi Kredensial')} <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ─── Fullscreen Image Viewer ─── */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        onClick={() => setFullscreenImage(null)}
                        className="absolute top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Certificate fullscreen"
                        className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </PublicLayout>
    );
}
