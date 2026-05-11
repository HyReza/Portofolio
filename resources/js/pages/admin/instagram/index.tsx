import { Head, useForm, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Instagram, ExternalLink, ToggleLeft, ToggleRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';

interface Post {
    id: number; post_url: string; caption: string | null; media_type: string | null;
    thumbnail: string | null; likes_count: number; published_at: string | null; is_active: boolean;
}

export default function InstagramAdmin({ posts, ig_stats = {} }: { posts: Post[], ig_stats?: Record<string, string> }) {
    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [fetching, setFetching] = useState(false);

    const form = useForm({
        post_url: '', caption: '', media_type: 'IMAGE' as string,
        thumbnail: '', likes_count: 0,
        published_at: '', is_active: true,
    });

    const handleEdit = (p: Post) => {
        setEditingId(p.id);
        form.setData({
            post_url: p.post_url || '',
            caption: p.caption || '',
            media_type: p.media_type || 'IMAGE',
            thumbnail: p.thumbnail || '',
            likes_count: p.likes_count || 0,
            published_at: p.published_at ? p.published_at.split('T')[0] : '',
            is_active: p.is_active,
        });
        setDialogOpen(true);
    };

    // Auto-fetch metadata when URL is pasted
    const fetchMeta = useCallback(async (url: string) => {
        if (!url || !url.includes('instagram.com')) return;
        setFetching(true);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/admin/fetch-url-meta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                body: JSON.stringify({ url }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.description && !form.data.caption) form.setData('caption', data.description?.slice(0, 1000) || '');
                if (data.title && !form.data.caption) form.setData('caption', data.title?.slice(0, 1000) || '');
                if (data.image && !form.data.thumbnail) form.setData('thumbnail', data.image);
                // Auto-detect media type from URL
                if (url.includes('/reel/') || url.includes('/reels/')) {
                    form.setData('media_type', 'VIDEO');
                }
                toast.success('✨ Metadata fetched automatically!');
            }
        } catch {
            // Silent fail
        } finally {
            setFetching(false);
        }
    }, [form]);

    const handleUrlChange = (url: string) => {
        form.setData('post_url', url);
        if (url.includes('instagram.com/') && url.length > 25) {
            fetchMeta(url);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(`/admin/instagram/${editingId}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Post updated!'); },
            });
        } else {
            form.post('/admin/instagram', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Post added!'); },
            });
        }
    };

    const [syncingProfile, setSyncingProfile] = useState(false);
    const statsForm = useForm({
        ig_username: ig_stats.ig_username || '',
        ig_bio: ig_stats.ig_bio || '',
    });

    const handleSaveStats = (e: React.FormEvent) => {
        e.preventDefault();
        setSyncingProfile(true);
        
        const settingsPayload = Object.entries(statsForm.data).map(([key, value]) => ({
            key,
            value_id: value,
            value_en: value,
            type: 'text'
        }));

        router.post('/admin/profile', { settings: settingsPayload }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Instagram profile settings saved!');
                setSyncingProfile(false);
            },
            onError: () => {
                toast.error('Failed to save settings.');
                setSyncingProfile(false);
            }
        });
    };

    // Auto-sync logic removed as it's no longer needed for the new minimal public header
    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Instagram', href: '/admin/instagram' }]}>
            <Head title="Manage Instagram Posts" />
            <ConfirmDialog {...dialogProps} />
            <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Instagram Posts</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Just paste the URL — caption & type are auto-detected!</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                            <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add Post</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>{editingId ? 'Edit Post' : 'Add Instagram Post'}</DialogTitle></DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Instagram Post URL *</Label>
                                        <div className="relative">
                                            <Input
                                                value={form.data.post_url}
                                                onChange={(e) => handleUrlChange(e.target.value)}
                                                onPaste={(e) => {
                                                    setTimeout(() => {
                                                        const val = (e.target as HTMLInputElement).value;
                                                        if (val.includes('instagram.com/')) fetchMeta(val);
                                                    }, 100);
                                                }}
                                                placeholder="https://www.instagram.com/p/..."
                                                required
                                            />
                                            {fetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-pink-500" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                            Paste URL and metadata will be auto-filled!
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Caption {fetching && <span className="text-xs text-pink-500 ml-1">fetching...</span>}</Label>
                                        <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none" value={form.data.caption} onChange={(e) => form.setData('caption', e.target.value)} placeholder="Auto-filled from URL or type manually" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Thumbnail URL (Image)</Label>
                                        <Input value={form.data.thumbnail} onChange={(e) => form.setData('thumbnail', e.target.value)} placeholder="Auto-filled from URL" />
                                    </div>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="space-y-2"><Label>Media Type</Label>
                                            <Select value={form.data.media_type} onValueChange={(v) => form.setData('media_type', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="IMAGE">Image</SelectItem>
                                                    <SelectItem value="VIDEO">Video/Reel</SelectItem>
                                                    <SelectItem value="CAROUSEL_ALBUM">Carousel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Likes Count</Label><Input type="number" min="0" value={form.data.likes_count} onChange={(e) => form.setData('likes_count', parseInt(e.target.value) || 0)} /></div>
                                    </div>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="space-y-2"><Label>Published Date</Label><Input type="date" value={form.data.published_at} onChange={(e) => form.setData('published_at', e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Status</Label>
                                            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                                {form.data.is_active ? <><ToggleRight className="mr-2 h-4 w-4 text-emerald-500" />Active</> : <><ToggleLeft className="mr-2 h-4 w-4 text-neutral-400" />Inactive</>}
                                            </Button>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        {form.processing ? 'Saving...' : (editingId ? 'Update Post' : 'Save Post')}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Profile Header</h2>
                                    <p className="text-sm text-muted-foreground">Configure the text that appears at the top of your public Instagram page.</p>
                                </div>
                                <Button onClick={handleSaveStats} disabled={syncingProfile} className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900">
                                    {syncingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Settings'}
                                </Button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Instagram Username</Label>
                                    <Input value={statsForm.data.ig_username} onChange={e => statsForm.setData('ig_username', e.target.value)} placeholder="e.g. reza_edi_saputra" />
                                    <p className="text-xs text-muted-foreground">Used for the 'Open Instagram' button link.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Header Bio / Description</Label>
                                    <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none" value={statsForm.data.ig_bio} onChange={e => statsForm.setData('ig_bio', e.target.value)} placeholder="My latest Instagram posts and moments..." />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardContent className="p-0">
                        {posts.length === 0 ? (
                            <div className="py-16 text-center">
                                <Instagram className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
                                <p className="text-muted-foreground text-sm">No Instagram posts yet. Add your first one!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {posts.map((p) => (
                                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-2 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {p.thumbnail ? (
                                                <img src={p.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 text-white">
                                                    <Instagram className="h-5 w-5" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h3 className="font-semibold truncate text-sm">{p.caption?.slice(0, 60) || 'No caption'}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[10px]">{p.media_type || 'IMAGE'}</Badge>
                                                    {p.published_at && <span className="text-xs text-muted-foreground">{new Date(p.published_at).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge className={p.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-neutral-100 text-neutral-500'}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <div className="flex">
                                                <a href={p.post_url} target="_blank" rel="noopener"><Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button></a>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                                                    confirm({ title: 'Delete Post?', description: 'This Instagram post will be removed.', variant: 'danger', onConfirm: () => router.delete(`/admin/instagram/${p.id}`, { onSuccess: () => toast.success('Deleted') }) });
                                                }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
