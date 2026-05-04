import { Head, useForm, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Linkedin, ExternalLink, ToggleLeft, ToggleRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface Post {
    id: number; post_url: string; title: string | null; description: string | null;
    thumbnail: string | null; likes_count: number; comments_count: number;
    published_at: string | null; is_active: boolean;
}

export default function LinkedinAdmin({ posts, li_stats = {} }: { posts: Post[], li_stats?: Record<string, string> }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [fetching, setFetching] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const statsForm = useForm({
        li_username: li_stats.li_username || '',
        li_bio: li_stats.li_bio || '',
    });

    const form = useForm({
        post_url: '', title: '', description: '',
        thumbnail: '', likes_count: 0, comments_count: 0,
        published_at: '', is_active: true,
    });

    const handleSaveStats = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        
        const settingsPayload = Object.entries(statsForm.data).map(([key, value]) => ({
            key, value_id: value, value_en: value, type: 'text'
        }));

        router.post('/admin/profile', { settings: settingsPayload }, {
            preserveScroll: true,
            onSuccess: () => { toast.success('LinkedIn header settings saved!'); setSavingProfile(false); },
            onError: () => { toast.error('Failed to save settings.'); setSavingProfile(false); }
        });
    };

    const handleEdit = (p: Post) => {
        setEditingId(p.id);
        form.setData({
            post_url: p.post_url || '',
            title: p.title || '',
            description: p.description || '',
            thumbnail: p.thumbnail || '',
            likes_count: p.likes_count || 0,
            comments_count: p.comments_count || 0,
            published_at: p.published_at ? p.published_at.split('T')[0] : '',
            is_active: p.is_active,
        });
        setDialogOpen(true);
    };

    // Auto-fetch metadata when URL is pasted
    const fetchMeta = useCallback(async (url: string) => {
        if (!url || !url.includes('linkedin.com')) return;
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
                if (data.title && !form.data.title) form.setData('title', data.title);
                if (data.description && !form.data.description) form.setData('description', data.description?.slice(0, 1000) || '');
                if (data.image && !form.data.thumbnail) form.setData('thumbnail', data.image);
                toast.success('✨ Metadata fetched automatically!');
            }
        } catch {
            // Silent fail - user can fill manually
        } finally {
            setFetching(false);
        }
    }, [form]);

    const handleUrlChange = (url: string) => {
        form.setData('post_url', url);
        // Auto-fetch on paste (detect full URL)
        if (url.includes('linkedin.com/') && url.length > 30) {
            fetchMeta(url);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.put(`/admin/linkedin/${editingId}`, {
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Post updated!'); },
            });
        } else {
            form.post('/admin/linkedin', {
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Post added!'); },
            });
        }
    };

    return (
        <>
            <Head title="Manage LinkedIn Posts" />
            <div className="mx-auto max-w-5xl space-y-6 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">LinkedIn Posts</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage embedded LinkedIn content. Just paste the URL — metadata is fetched automatically!</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />Add Post</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>{editingId ? 'Edit Post' : 'Add LinkedIn Post'}</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>LinkedIn Post URL *</Label>
                                    <div className="relative">
                                        <Input
                                            value={form.data.post_url}
                                            onChange={(e) => handleUrlChange(e.target.value)}
                                            onPaste={(e) => {
                                                setTimeout(() => {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val.includes('linkedin.com/')) fetchMeta(val);
                                                }, 100);
                                            }}
                                            placeholder="https://www.linkedin.com/posts/..."
                                            required
                                        />
                                        {fetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        Just paste the URL and Save! The post will be embedded automatically.
                                    </p>
                                </div>
                                <div className="grid gap-4 grid-cols-2">
                                    <div className="space-y-2"><Label>Published Date</Label><Input type="date" value={form.data.published_at} onChange={(e) => form.setData('published_at', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Status</Label>
                                        <Button type="button" variant="outline" className="w-full justify-start" onClick={() => form.setData('is_active', !form.data.is_active)}>
                                            {form.data.is_active ? <><ToggleRight className="mr-2 h-4 w-4 text-emerald-500" />Active</> : <><ToggleLeft className="mr-2 h-4 w-4 text-neutral-400" />Inactive</>}
                                        </Button>
                                    </div>
                                </div>

                                <Collapsible>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" type="button" className="w-full text-xs text-muted-foreground flex justify-between">
                                            <span>Manual Fallback (Optional)</span>
                                            <span className="text-indigo-500">Show fields</span>
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-4 pt-4 border-t mt-2">
                                        <div className="space-y-2">
                                            <Label>Title {fetching && <span className="text-xs text-indigo-500 ml-1">fetching...</span>}</Label>
                                            <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} placeholder="Auto-filled from URL or type manually" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} placeholder="Auto-filled from URL or type manually" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Thumbnail URL (Image)</Label>
                                            <Input value={form.data.thumbnail} onChange={(e) => form.setData('thumbnail', e.target.value)} placeholder="Auto-filled from URL" />
                                        </div>
                                        <div className="grid gap-4 grid-cols-2">
                                            <div className="space-y-2"><Label>Likes Count</Label><Input type="number" min="0" value={form.data.likes_count} onChange={(e) => form.setData('likes_count', parseInt(e.target.value) || 0)} /></div>
                                            <div className="space-y-2"><Label>Comments Count</Label><Input type="number" min="0" value={form.data.comments_count} onChange={(e) => form.setData('comments_count', parseInt(e.target.value) || 0)} /></div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                                <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {form.processing ? 'Saving...' : (editingId ? 'Update Post' : 'Save Post')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Profile Header</h2>
                                    <p className="text-sm text-muted-foreground">Configure the text that appears at the top of your public LinkedIn page.</p>
                                </div>
                                <Button onClick={handleSaveStats} disabled={savingProfile} className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900">
                                    {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Settings'}
                                </Button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>LinkedIn Username / URL path</Label>
                                    <Input value={statsForm.data.li_username} onChange={e => statsForm.setData('li_username', e.target.value)} placeholder="e.g. reza-edi-saputra" />
                                    <p className="text-xs text-muted-foreground">Used for the 'Open LinkedIn' button link.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Header Bio / Description</Label>
                                    <textarea className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={statsForm.data.li_bio} onChange={e => statsForm.setData('li_bio', e.target.value)} placeholder="My professional updates and articles..." />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <CardContent className="p-0">
                        {posts.length === 0 ? (
                            <div className="py-16 text-center">
                                <Linkedin className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
                                <p className="text-muted-foreground text-sm">No LinkedIn posts yet. Add your first one!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {posts.map((p) => (
                                    <div key={p.id} className="group flex items-center justify-between p-4 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                <Linkedin className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold truncate text-sm">{p.title || 'Untitled Post'}</h3>
                                                {p.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description.slice(0, 80)}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge className={p.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-neutral-100 text-neutral-500'}>
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <a href={p.post_url} target="_blank" rel="noopener" className="hidden group-hover:inline-flex"><ExternalLink className="h-4 w-4 text-neutral-400 hover:text-blue-500 transition-colors" /></a>
                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm('Delete?')) router.delete(`/admin/linkedin/${p.id}`); }}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
