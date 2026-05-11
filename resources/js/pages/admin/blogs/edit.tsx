import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TiptapEditor } from '@/components/TiptapEditor';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Tag { id: number; name_en: string; }
interface Blog {
    id: number; slug: string; title_id: string; title_en: string;
    content_id: string | null; content_en: string | null;
    excerpt_id: string | null; excerpt_en: string | null;
    thumbnail: string | null; status: string; published_at: string | null;
    tags: Tag[];
}

export default function EditBlog({ blog, tags }: { blog: Blog; tags: Tag[] }) {
    const [localTags, setLocalTags] = useState(tags);
    const [newTagEn, setNewTagEn] = useState('');
    const [newTagId, setNewTagId] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title_id: blog.title_id, title_en: blog.title_en, slug: blog.slug,
        content_id: blog.content_id ?? '', content_en: blog.content_en ?? '',
        excerpt_id: blog.excerpt_id ?? '', excerpt_en: blog.excerpt_en ?? '',
        thumbnail: null as File | null,
        status: blog.status, published_at: blog.published_at ?? '',
        tag_ids: blog.tags.map((t) => t.id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/blogs/${blog.slug}`, { forceFormData: true });
    };

    const toggleTag = (tagId: number) => {
        setData('tag_ids', data.tag_ids.includes(tagId) ? data.tag_ids.filter((id) => id !== tagId) : [...data.tag_ids, tagId]);
    };

    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(blog.thumbnail ? `/storage/${blog.thumbnail}` : null);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setData('thumbnail', file ?? null);
        if (file) {
            setThumbnailPreview(URL.createObjectURL(file));
        } else {
            setThumbnailPreview(blog.thumbnail ? `/storage/${blog.thumbnail}` : null);
        }
    };

    useEffect(() => {
        if (!isSlugManuallyEdited) {
            const baseTitle = data.title_en || data.title_id;
            const newSlug = baseTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            if (newSlug !== blog.slug) {
                setData('slug', newSlug);
            }
        }
    }, [data.title_en, data.title_id, isSlugManuallyEdited]);

    const handleAddTag = async () => {
        if (!newTagEn || !newTagId) return;
        setIsAddingTag(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/admin/blogs/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ name_en: newTagEn, name_id: newTagId })
            });
            const d = await res.json();
            if (res.ok && d.tag) {
                setLocalTags([...localTags, d.tag]);
                setData('tag_ids', [...data.tag_ids, d.tag.id]);
                setNewTagEn(''); setNewTagId('');
                toast.success('Tag created successfully');
            } else {
                toast.error(d.message || 'Failed to create tag');
            }
        } catch (e) {
            toast.error('An error occurred while creating tag');
        } finally {
            setIsAddingTag(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Blog', href: '/admin/blogs' }, { title: 'Edit', href: '#' }]}>
            <Head title={`Edit: ${blog.title_en}`} />
            <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 pb-6">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Edit Blog Post</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <div className="mb-2 h-6 flex items-end">
                                        <Label>Title (ID)</Label>
                                    </div>
                                    <Input value={data.title_id} onChange={(e) => setData('title_id', e.target.value)} required />
                                </div>
                                <div>
                                    <div className="mb-2 h-6 flex items-end justify-between">
                                        <Label>Title (EN)</Label>
                                        <AutoTranslateButton sourceText={data.title_id} onTranslate={(t) => setData('title_en', t)} />
                                    </div>
                                    <Input value={data.title_en} onChange={(e) => setData('title_en', e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (Auto-generated & Unique)</Label>
                                <Input 
                                    value={data.slug} 
                                    onChange={(e) => {
                                        setIsSlugManuallyEdited(true);
                                        setData('slug', e.target.value);
                                    }} 
                                />
                                {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Content (ID)</Label>
                                <TiptapEditor value={data.content_id} onChange={(html) => setData('content_id', html)} />
                            </div>
                            <div className="space-y-2">
                                <div className="mb-2 h-6 flex items-end justify-between">
                                    <Label>Content (EN)</Label>
                                    <AutoTranslateButton sourceText={data.content_id} onTranslate={(t) => setData('content_en', t)} />
                                </div>
                                <TiptapEditor value={data.content_en} onChange={(html) => setData('content_en', html)} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Tags & Publishing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Tags</Label>
                                {localTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {localTags.map((tag) => (
                                            <label key={tag.id} className="flex items-center gap-1.5 cursor-pointer">
                                                <Checkbox checked={data.tag_ids.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                                                <span className="text-sm">{tag.name_en}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-neutral-500 mb-4">No tags available.</p>
                                )}
                                
                                <div className="flex flex-col sm:flex-row gap-2 items-end pt-2 border-t">
                                    <div className="space-y-1 w-full sm:w-1/3">
                                        <Label className="text-xs">New Tag (ID)</Label>
                                        <Input size={1} placeholder="Cth: Teknologi" value={newTagId} onChange={e => setNewTagId(e.target.value)} />
                                    </div>
                                    <div className="space-y-1 w-full sm:w-1/3">
                                        <Label className="text-xs">New Tag (EN)</Label>
                                        <Input size={1} placeholder="Ex: Technology" value={newTagEn} onChange={e => setNewTagEn(e.target.value)} />
                                    </div>
                                    <Button type="button" variant="secondary" onClick={handleAddTag} disabled={isAddingTag || !newTagId || !newTagEn}>
                                        {isAddingTag ? 'Adding...' : 'Add Tag'}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2"><Label>Status</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Published At</Label><Input type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Thumbnail</Label>
                                {thumbnailPreview && (
                                    <div className="relative mb-4 max-w-sm rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
                                        <img src={thumbnailPreview} alt="Preview" className="w-full rounded-md object-cover h-48" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-lg"
                                            onClick={() => {
                                                setThumbnailPreview(null);
                                                setData('thumbnail', null);
                                            }}
                                        >
                                            <span className="sr-only">Remove</span>
                                            &times;
                                        </Button>
                                    </div>
                                )}
                                <Input type="file" accept="image/*" onChange={handleThumbnailChange} />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
