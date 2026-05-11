import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import { AutoTranslateButton } from '@/components/AutoTranslateButton';
import { TiptapEditor } from '@/components/TiptapEditor';
import { TagInput } from '@/components/ui/tag-input';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CreateProject() {
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        title_id: '',
        title_en: '',
        slug: '',
        excerpt_id: '',
        excerpt_en: '',
        problem_id: '',
        problem_en: '',
        solution_id: '',
        solution_en: '',
        content_id: '',
        content_en: '',
        thumbnail: null as File | null,
        tech_stack: [] as string[],
        demo_url: '',
        repo_url: '',
        is_featured: false,
        status: 'draft' as 'draft' | 'published',
        published_at: '',
        show_in_cv: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/projects', {
            forceFormData: true,
        });
    };

    useEffect(() => {
        if (!isSlugManuallyEdited) {
            const baseTitle = data.title_en || data.title_id;
            const newSlug = baseTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setData('slug', newSlug);
        }
    }, [data.title_en, data.title_id, isSlugManuallyEdited]);

    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setData('thumbnail', file ?? null);
        if (file) {
            setThumbnailPreview(URL.createObjectURL(file));
        } else {
            setThumbnailPreview(null);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Projects', href: '/admin/projects' }, { title: 'Create', href: '/admin/projects/create' }]}>
            <Head title="Create Project" />
            <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Create Project</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Add a new project to your portfolio.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.history.back()} className="w-fit">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Titles */}
                    <Card>
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Basic Information</CardTitle></CardHeader>
                        <CardContent className="px-4 sm:px-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="mb-2 h-6 flex items-end">
                                        <Label htmlFor="title_id">Title (ID)</Label>
                                    </div>
                                    <Input id="title_id" value={data.title_id} onChange={(e) => setData('title_id', e.target.value)} placeholder="Judul dalam Bahasa Indonesia" />
                                    <InputError message={errors.title_id} />
                                </div>
                                <div>
                                    <div className="mb-2 h-6 flex items-end justify-between">
                                        <Label htmlFor="title_en">Title (EN)</Label>
                                        <AutoTranslateButton sourceText={data.title_id} onTranslate={(t) => setData('title_en', t)} />
                                    </div>
                                    <Input id="title_en" value={data.title_en} onChange={(e) => setData('title_en', e.target.value)} placeholder="Title in English" />
                                    <InputError message={errors.title_en} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (Auto-generated & Unique)</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) => {
                                        setIsSlugManuallyEdited(true);
                                        setData('slug', e.target.value);
                                    }}
                                    placeholder="project-url-slug"
                                />
                                <InputError message={errors.slug} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Excerpts */}
                    <Card>
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Excerpts</CardTitle></CardHeader>
                        <CardContent className="px-4 sm:px-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="mb-2 h-6 flex items-end">
                                        <Label htmlFor="excerpt_id">Excerpt (ID)</Label>
                                    </div>
                                    <textarea id="excerpt_id" className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" value={data.excerpt_id} onChange={(e) => setData('excerpt_id', e.target.value)} />
                                </div>
                                <div>
                                    <div className="mb-2 h-6 flex items-end justify-between">
                                        <Label htmlFor="excerpt_en">Excerpt (EN)</Label>
                                        <AutoTranslateButton sourceText={data.excerpt_id} onTranslate={(t) => setData('excerpt_en', t)} />
                                    </div>
                                    <textarea id="excerpt_en" className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" value={data.excerpt_en} onChange={(e) => setData('excerpt_en', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Problem vs Solution */}
                    <Card>
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">The Problem vs The Solution</CardTitle></CardHeader>
                        <CardContent className="px-4 sm:px-6 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="mb-2 h-6 flex items-end">
                                        <Label>Problem (ID)</Label>
                                    </div>
                                    <TiptapEditor value={data.problem_id} onChange={(html) => setData('problem_id', html)} />
                                </div>
                                <div>
                                    <div className="mb-2 h-6 flex items-end justify-between">
                                        <Label>Problem (EN)</Label>
                                        <AutoTranslateButton sourceText={data.problem_id} onTranslate={(t) => setData('problem_en', t)} />
                                    </div>
                                    <TiptapEditor value={data.problem_en} onChange={(html) => setData('problem_en', html)} />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="mb-2 h-6 flex items-end">
                                        <Label>Solution (ID)</Label>
                                    </div>
                                    <TiptapEditor value={data.solution_id} onChange={(html) => setData('solution_id', html)} />
                                </div>
                                <div>
                                    <div className="mb-2 h-6 flex items-end justify-between">
                                        <Label>Solution (EN)</Label>
                                        <AutoTranslateButton sourceText={data.solution_id} onTranslate={(t) => setData('solution_en', t)} />
                                    </div>
                                    <TiptapEditor value={data.solution_en} onChange={(html) => setData('solution_en', html)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Content */}
                    <Card>
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                            <CardTitle className="text-sm sm:text-base">Detailed Content / Tutorial</CardTitle>
                            <p className="text-xs text-neutral-500">Provide in-depth documentation, readme, or tutorial content for this project.</p>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="mb-2 h-6 flex items-end">
                                        <Label>Content (ID)</Label>
                                    </div>
                                    <TiptapEditor value={data.content_id} onChange={(html) => setData('content_id', html)} />
                                </div>
                                <div>
                                    <div className="mb-2 h-6 flex items-end justify-between">
                                        <Label>Content (EN)</Label>
                                        <AutoTranslateButton sourceText={data.content_id} onTranslate={(t) => setData('content_en', t)} />
                                    </div>
                                    <TiptapEditor value={data.content_en} onChange={(html) => setData('content_en', html)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Media & Links */}
                    <Card>
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Media & Links</CardTitle></CardHeader>
                        <CardContent className="px-4 sm:px-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="thumbnail">Thumbnail</Label>
                                {thumbnailPreview && (
                                    <div className="relative mb-4 max-w-xs sm:max-w-sm rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
                                        <img src={thumbnailPreview} alt="Preview" className="w-full rounded-md object-cover h-36 sm:h-48" />
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
                                <Input id="thumbnail" type="file" accept="image/*" onChange={handleThumbnailChange} />
                                <InputError message={errors.thumbnail} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tech Stack</Label>
                                <TagInput
                                    value={data.tech_stack}
                                    onChange={(tags) => setData('tech_stack', tags)}
                                    placeholder="Type tech name, press Enter or comma to add..."
                                />
                                <p className="text-[11px] text-neutral-400">Press Enter or comma to add. Click × to remove.</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="demo_url">Demo URL</Label>
                                    <Input id="demo_url" type="url" value={data.demo_url} onChange={(e) => setData('demo_url', e.target.value)} placeholder="https://demo.example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="repo_url">Repository URL</Label>
                                    <Input id="repo_url" type="url" value={data.repo_url} onChange={(e) => setData('repo_url', e.target.value)} placeholder="https://github.com/..." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Publishing */}
                    <Card>
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4"><CardTitle className="text-sm sm:text-base">Publishing</CardTitle></CardHeader>
                        <CardContent className="px-4 sm:px-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v as 'draft' | 'published')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="published_at">Published Date</Label>
                                    <Input id="published_at" type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-4">
                                <Checkbox id="is_featured" checked={data.is_featured} onCheckedChange={(c) => setData('is_featured', !!c)} />
                                <Label htmlFor="is_featured">Featured Project</Label>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <Checkbox id="show_in_cv" checked={data.show_in_cv} onCheckedChange={(c) => setData('show_in_cv', !!c)} />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="show_in_cv">Tampilkan di CV (Show in CV)</Label>
                                    <p className="text-[11px] text-neutral-500">Jika dicentang, proyek ini akan disertakan di PDF CV.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                            {processing ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
