import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Github, Linkedin, Instagram, Twitter, Globe, Info, User, Layout, Search, ExternalLink, Eye, Image, FileText as FileTextIcon, Zap as ZapIcon, AtSign, Briefcase, ChevronDown } from 'lucide-react';
import { MdVerified } from 'react-icons/md';

interface ProfileEntry {
    id: number;
    key: string;
    value_id: string | null;
    value_en: string | null;
    type: 'text' | 'html' | 'json';
}

interface Props {
    profiles: ProfileEntry[];
}

export default function ProfileIndex({ profiles }: Props) {
    const getVal = (key: string, field: 'value_id' | 'value_en') => {
        return profiles.find(p => p.key === key)?.[field] || '';
    };

    const form = useForm({
        settings: [
            // General
            { key: 'name', value_id: getVal('name', 'value_id'), value_en: getVal('name', 'value_en'), type: 'text' },
            { key: 'full_name', value_id: getVal('full_name', 'value_id'), value_en: getVal('full_name', 'value_en'), type: 'text' },
            { key: 'title', value_id: getVal('title', 'value_id'), value_en: getVal('title', 'value_en'), type: 'text' },
            { key: 'username', value_id: getVal('username', 'value_id'), value_en: getVal('username', 'value_en'), type: 'text' },
            // Media
            { key: 'profile_photo', value_id: getVal('profile_photo', 'value_id'), value_en: getVal('profile_photo', 'value_en'), type: 'text' },
            { key: 'cover_photo', value_id: getVal('cover_photo', 'value_id'), value_en: getVal('cover_photo', 'value_en'), type: 'text' },
            // Hero / Typewriter & Status
            { key: 'status_active', value_id: getVal('status_active', 'value_id') || '1', value_en: getVal('status_active', 'value_en') || '1', type: 'text' },
            { key: 'status_text', value_id: getVal('status_text', 'value_id') || 'Hire me.', value_en: getVal('status_text', 'value_en') || 'Hire me.', type: 'text' },
            { key: 'typewriter_texts', value_id: getVal('typewriter_texts', 'value_id'), value_en: getVal('typewriter_texts', 'value_en'), type: 'json' },
            { key: 'hero_bullets', value_id: getVal('hero_bullets', 'value_id'), value_en: getVal('hero_bullets', 'value_en'), type: 'json' },
            // Contact
            { key: 'email', value_id: getVal('email', 'value_id'), value_en: getVal('email', 'value_en'), type: 'text' },
            { key: 'phone', value_id: getVal('phone', 'value_id'), value_en: getVal('phone', 'value_en'), type: 'text' },
            { key: 'location', value_id: getVal('location', 'value_id'), value_en: getVal('location', 'value_en'), type: 'text' },
            // Bio
            { key: 'bio', value_id: getVal('bio', 'value_id'), value_en: getVal('bio', 'value_en'), type: 'text' },
            { key: 'about_short', value_id: getVal('about_short', 'value_id'), value_en: getVal('about_short', 'value_en'), type: 'text' },
            // About Page (Separate from Homepage for SEO)
            { key: 'about_page_title', value_id: getVal('about_page_title', 'value_id'), value_en: getVal('about_page_title', 'value_en'), type: 'text' },
            { key: 'about_page_subtitle', value_id: getVal('about_page_subtitle', 'value_id'), value_en: getVal('about_page_subtitle', 'value_en'), type: 'text' },
            { key: 'about_page_bio', value_id: getVal('about_page_bio', 'value_id'), value_en: getVal('about_page_bio', 'value_en'), type: 'text' },
            // Socials
            { key: 'github_url', value_id: getVal('github_url', 'value_id'), value_en: getVal('github_url', 'value_en'), type: 'text' },
            { key: 'linkedin_url', value_id: getVal('linkedin_url', 'value_id'), value_en: getVal('linkedin_url', 'value_en'), type: 'text' },
            { key: 'instagram_url', value_id: getVal('instagram_url', 'value_id'), value_en: getVal('instagram_url', 'value_en'), type: 'text' },
            { key: 'twitter_url', value_id: getVal('twitter_url', 'value_id'), value_en: getVal('twitter_url', 'value_en'), type: 'text' },
            // SEO
            { key: 'meta_site_title', value_id: getVal('meta_site_title', 'value_id'), value_en: getVal('meta_site_title', 'value_en'), type: 'text' },
            { key: 'meta_site_description', value_id: getVal('meta_site_description', 'value_id'), value_en: getVal('meta_site_description', 'value_en'), type: 'text' },
            { key: 'meta_keywords', value_id: getVal('meta_keywords', 'value_id'), value_en: getVal('meta_keywords', 'value_en'), type: 'text' },
        ]
    });

    const fv = (key: string) => {
        const s = form.data.settings.find(x => x.key === key);
        return s?.value_en || s?.value_id || '';
    };

    const updateSetting = (key: string, field: 'value_id' | 'value_en', value: string) => {
        const newSettings = [...form.data.settings];
        const index = newSettings.findIndex(s => s.key === key);
        if (index !== -1) {
            newSettings[index][field] = value;
            form.setData('settings', newSettings);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/profile', {
            onSuccess: () => toast.success('Profile settings updated successfully!'),
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('photo', e.target.files[0]);
            formData.append('key', key);
            const toastId = toast.loading(`Uploading ${key.replace('_', ' ')}...`);
            router.post('/admin/profile/photo', formData, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Photo updated successfully!', { id: toastId });
                },
                onError: (errors) => {
                    console.error(errors);
                    toast.error(errors.photo || 'Failed to upload photo.', { id: toastId });
                },
            });
        }
    };

    const profilePhoto = fv('profile_photo') || '/assets/img/profil.jpeg';
    const profileName = fv('name') || 'Your Name';
    const profileTitle = fv('title') || 'Your Title';
    const profileUsername = fv('username') || 'username';
    const profileBio = fv('bio') || 'Your bio will appear here...';
    const seoTitle = fv('meta_site_title') || profileName;
    const seoDesc = fv('meta_site_description') || profileBio;
    const seoUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com';

    const renderInputPair = (key: string, label: string, icon: any, isTextArea = false, placeholder?: string) => {
        const s = form.data.settings.find(x => x.key === key);
        if (!s) return null;

        return (
            <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                    {icon && <span className="text-indigo-500">{icon}</span>}
                    <Label className="text-sm font-semibold">{label}</Label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">Bahasa Indonesia</span>
                        </div>
                        {isTextArea ? (
                            <textarea
                                className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={s.value_id || ''}
                                onChange={(e) => updateSetting(key, 'value_id', e.target.value)}
                                placeholder={placeholder || `Input ${label}...`}
                            />
                        ) : (
                            <Input
                                value={s.value_id || ''}
                                onChange={(e) => updateSetting(key, 'value_id', e.target.value)}
                                placeholder={placeholder || `Input ${label}...`}
                                className="h-9"
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">English Version</span>
                            <div className="shrink-0">
                                <AutoTranslateButton sourceText={s.value_id || ''} onTranslate={(t) => updateSetting(key, 'value_en', t)} />
                            </div>
                        </div>
                        {isTextArea ? (
                            <textarea
                                className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={s.value_en || ''}
                                onChange={(e) => updateSetting(key, 'value_en', e.target.value)}
                                placeholder={`Auto-translate or type ${label}...`}
                            />
                        ) : (
                            <Input
                                value={s.value_en || ''}
                                onChange={(e) => updateSetting(key, 'value_en', e.target.value)}
                                placeholder={`Auto-translate or type ${label}...`}
                                className="h-9"
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    /* Simple single-value input (no bilingual pair) */
    const renderSingleInput = (key: string, label: string, icon: any, placeholder?: string) => {
        const s = form.data.settings.find(x => x.key === key);
        if (!s) return null;
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-indigo-500">{icon}</span>}
                    <Label className="text-xs font-semibold">{label}</Label>
                </div>
                <Input
                    value={s.value_en || s.value_id || ''}
                    onChange={(e) => {
                        updateSetting(key, 'value_en', e.target.value);
                        updateSetting(key, 'value_id', e.target.value);
                    }}
                    placeholder={placeholder || `Input ${label}...`}
                    className="h-9"
                />
            </div>
        );
    };

    return (
        <>
            <Head title="Profile Settings" />
            <div className="mx-auto max-w-5xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Configure your personal brand, social links, and global SEO meta.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a href="/" target="_blank" rel="noopener"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Preview Site</a>
                        </Button>
                        <Button onClick={handleSubmit} disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700">
                            {form.processing ? 'Saving...' : 'Save All Changes'}
                        </Button>
                    </div>
                </div>

                {/* ═══ LIVE PREVIEW CARD ═══ */}
                <Card className="overflow-hidden border-none shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 pb-3">
                        <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-indigo-500" />
                            <CardTitle className="text-lg">Live Preview</CardTitle>
                        </div>
                        <CardDescription>This is how your profile appears on the landing page. Changes update in real-time as you edit fields below.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid md:grid-cols-[280px_1fr]">
                            {/* Sidebar Preview */}
                            <div className="flex flex-col items-center border-r border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#121212] p-6 relative">
                                <div className="relative w-full flex flex-col items-center pb-2">
                                    {fv('status_active') === '1' && (
                                        <div className="absolute top-0 left-0 z-10 rounded-br-xl bg-white dark:bg-[#121212] pb-2 pr-2">
                                            <div className="relative flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-[#121212]">
                                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">{fv('status_text') || 'Hire me.'}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={`w-full overflow-hidden rounded-2xl ${fv('status_active') === '1' ? 'rounded-tl-none' : ''} bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 h-20 opacity-50`} />
                                    <div className="-mt-8 z-10 rounded-full border-[3px] border-white dark:border-[#121212] shadow-md">
                                        <img src={profilePhoto} alt="preview" className="h-16 w-16 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/profil.jpeg'; }} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <h3 className="font-sora text-sm font-bold text-neutral-900 dark:text-white">{profileName}</h3>
                                    <MdVerified className="text-blue-500 shrink-0" size={14} />
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-0.5">@{profileUsername}</p>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    {fv('github_url') && <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500"><Github size={14} /></div>}
                                    {fv('linkedin_url') && <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500"><Linkedin size={14} /></div>}
                                    {fv('instagram_url') && <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500"><Instagram size={14} /></div>}
                                    {fv('twitter_url') && <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500"><Twitter size={14} /></div>}
                                </div>
                            </div>

                            {/* Landing Page Preview */}
                            <div className="p-6 space-y-4 bg-white dark:bg-[#121212]">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                    <Layout size={12} /> Landing Page Hero
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {(fv('typewriter_texts') ? fv('typewriter_texts').split('\n')[0] : `Hi, I'm ${profileName}`)}<span className="animate-pulse text-indigo-500">|</span>
                                </h2>
                                <ul className="flex gap-6 text-sm text-neutral-500 list-disc ml-4">
                                    {fv('hero_bullets') ? (
                                        fv('hero_bullets').split('\n').filter(Boolean).map((bullet: string, i: number) => (
                                            <li key={i}>{bullet}</li>
                                        ))
                                    ) : (
                                        <>
                                            <li>Remote Worker</li>
                                            <li>Based in Indonesia 🇮🇩</li>
                                        </>
                                    )}
                                </ul>
                                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 line-clamp-3">{profileBio}</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-[11px] font-semibold text-white">
                                        Download CV <ChevronDown size={12} className="opacity-70" />
                                    </span>
                                </div>

                                {/* SEO Preview */}
                                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                                        <Search size={12} /> Google Search Preview
                                    </div>
                                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-1 bg-neutral-50 dark:bg-neutral-900">
                                        <p className="text-xs text-emerald-700 dark:text-emerald-400 truncate">{seoUrl}</p>
                                        <p className="text-base font-semibold text-blue-700 dark:text-blue-400 truncate">{seoTitle}</p>
                                        <p className="text-xs text-neutral-500 line-clamp-2">{seoDesc}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ═══ IDENTITY ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Identity & Personal Info</CardTitle>
                            </div>
                            <CardDescription>Your basic identification used across the site — sidebar, hero section, and SEO.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            {renderInputPair('name', 'Display Name', <User size={16} />, false, 'e.g. Reza Edi Saputra')}
                            {renderInputPair('full_name', 'Full Name', <Info size={16} />, false, 'e.g. Reza Edi Saputra, S.Kom.')}
                            {renderInputPair('title', 'Professional Title', <Briefcase size={16} />, false, 'e.g. Software Engineer')}
                            {renderSingleInput('username', 'Username / Handle (without @)', <AtSign size={16} />, 'e.g. rezaedisaputra')}
                        </CardContent>
                    </Card>

                    {/* ═══ PROFILE MEDIA ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <Image className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Profile Media</CardTitle>
                            </div>
                            <CardDescription>Profile photo and cover image used in the sidebar, topbar, and dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-indigo-500" />
                                        <Label className="text-xs font-semibold">Profile Photo Upload</Label>
                                    </div>
                                    <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile_photo')} className="h-9 cursor-pointer" />
                                    {fv('profile_photo') && (
                                        <div className="flex items-center gap-3 rounded-lg border border-neutral-100 dark:border-neutral-800 p-3">
                                            <img src={fv('profile_photo')} alt="preview" className="h-12 w-12 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <span className="text-xs text-neutral-500 line-clamp-1" title={fv('profile_photo')}>Current photo: {fv('profile_photo')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {renderSingleInput('cover_photo', 'Cover Photo Path', <Layout size={16} />, '/assets/img/cover.jpg')}
                                    <p className="text-[11px] text-neutral-400">Optional. If empty, a gradient will be used.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ═══ HERO / TYPEWRITER & STATUS ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <Layout className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Hero & Status Badge</CardTitle>
                            </div>
                            <CardDescription>Configure the typewriter text on the landing page and your availability status.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <ZapIcon size={16} className="text-indigo-500" />
                                        <Label className="text-xs font-semibold">Status Active</Label>
                                    </div>
                                    <select
                                        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={form.data.settings.find(s => s.key === 'status_active')?.value_en || '1'}
                                        onChange={(e) => {
                                            updateSetting('status_active', 'value_en', e.target.value);
                                            updateSetting('status_active', 'value_id', e.target.value);
                                        }}
                                    >
                                        <option value="1">Active (Show Badge)</option>
                                        <option value="0">Inactive (Hide Badge)</option>
                                    </select>
                                </div>
                                {renderInputPair('status_text', 'Status Text', <ZapIcon size={16} />, false, 'e.g. Hire me.')}
                            </div>
                            {renderInputPair('typewriter_texts', 'Typewriter Texts (One per line)', <FileTextIcon size={16} />, true, "Hi, I'm Reza\nI'm a Software Engineer")}
                            {renderInputPair('hero_bullets', 'Hero Bullets (One per line)', <FileTextIcon size={16} />, true, "Remote Worker\nBased in Indonesia 🇮🇩")}
                        </CardContent>
                    </Card>

                    {/* ═══ BIO & ABOUT ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <FileTextIcon className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Bio & About Me</CardTitle>
                            </div>
                            <CardDescription>Your introduction on the homepage hero and the about page.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            {renderInputPair('about_short', 'Short Headline', <ZapIcon size={16} />, true, 'A brief tagline shown in the dashboard...')}
                            {renderInputPair('bio', 'Full Bio / Description', <FileTextIcon size={16} />, true, 'Shown on the homepage hero and the about page...')}
                        </CardContent>
                    </Card>

                    {/* ═══ ABOUT PAGE (SEPARATE SEO) ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <Layout className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">About Page Content</CardTitle>
                            </div>
                            <CardDescription>Separate content for the /about page. If left empty, falls back to the homepage bio. Setting these separately improves SEO.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            {renderInputPair('about_page_title', 'About Page Heading', <ZapIcon size={16} />, false, 'e.g. Crafting Digital Experiences / Menciptakan Pengalaman Digital')}
                            {renderInputPair('about_page_subtitle', 'About Page Subtitle', <FileTextIcon size={16} />, false, 'e.g. Full-Stack Developer & Creative Technologist')}
                            {renderInputPair('about_page_bio', 'About Page Bio (separate from homepage)', <FileTextIcon size={16} />, true, 'A longer, more detailed bio specifically for the about page...')}
                            
                            <div className="pt-4 space-y-4 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <Image size={16} className="text-indigo-500" />
                                    <Label className="text-xs font-semibold">About Page Photo (Optional override)</Label>
                                </div>
                                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'about_page_photo')} className="h-9 cursor-pointer" />
                                {fv('about_page_photo') && (
                                    <div className="flex items-center gap-3 rounded-lg border border-neutral-100 dark:border-neutral-800 p-3">
                                        <img src={fv('about_page_photo')} alt="preview" className="h-12 w-12 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        <span className="text-xs text-neutral-500 line-clamp-1" title={fv('about_page_photo')}>Current photo: {fv('about_page_photo')}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ═══ CONTACT ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Contact & Location</CardTitle>
                            </div>
                            <CardDescription>Where and how people can reach you. Shown on the contact page and CV.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {renderInputPair('email', 'Email Address', <Mail size={16} />, false, 'you@example.com')}
                                {renderInputPair('phone', 'Phone Number', <Phone size={16} />, false, '+62 812 xxxx xxxx')}
                            </div>
                            {renderInputPair('location', 'Location', <MapPin size={16} />, false, 'Jakarta, Indonesia')}
                        </CardContent>
                    </Card>

                    {/* ═══ SOCIAL MEDIA ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Social Media Links</CardTitle>
                            </div>
                            <CardDescription>Shown in the sidebar, JSON-LD schema, and contact page.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {renderSingleInput('github_url', 'GitHub URL', <Github size={16} />, 'https://github.com/username')}
                                {renderSingleInput('linkedin_url', 'LinkedIn URL', <Linkedin size={16} />, 'https://linkedin.com/in/username')}
                                {renderSingleInput('instagram_url', 'Instagram URL', <Instagram size={16} />, 'https://instagram.com/username')}
                                {renderSingleInput('twitter_url', 'Twitter / X URL', <Twitter size={16} />, 'https://x.com/username')}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ═══ GLOBAL SEO ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg">Global SEO Meta</CardTitle>
                            </div>
                            <CardDescription>Controls how your portfolio appears on Google, Facebook, and Twitter when shared.</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 space-y-6">
                            {renderInputPair('meta_site_title', 'Site Title', <Search size={16} />, false, 'Reza Edi Saputra - Software Engineer')}
                            {renderInputPair('meta_site_description', 'Meta Description', <Search size={16} />, true, 'Passionate Software Engineer with...')}
                            {renderInputPair('meta_keywords', 'Keywords', <Search size={16} />, false, 'software engineer, full stack, portfolio')}
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Discard Changes</Button>
                        <Button type="submit" disabled={form.processing} className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700">
                            {form.processing ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
