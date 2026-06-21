import { Head, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import {
    Plus, Trash2, Sparkles, FileText, Download, Copy, RefreshCw,
    Search, Calendar, Target, ChevronRight, ChevronDown, Loader2, Globe, X,
    Clock, CheckCircle2, Archive, BarChart3, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CvGeneration {
    id: number;
    job_title: string;
    company_name: string | null;
    job_description: string;
    job_url: string | null;
    language: 'en' | 'id';
    status: 'draft' | 'final' | 'archived';
    ats_score: number | null;
    ai_provider: string | null;
    ai_tokens_used: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedData {
    data: CvGeneration[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    generations: PaginatedData;
    filters: {
        search: string;
        status: string;
    };
}

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', icon: Clock },
    final: { label: 'Final', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', icon: CheckCircle2 },
    archived: { label: 'Archived', color: 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700', icon: Archive },
};

function getAtsScoreColor(score: number | null) {
    if (!score) return 'text-neutral-400';
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
}

export default function CvGeneratorIndex({ generations, filters }: Props) {
    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchValue, setSearchValue] = useState(filters.search);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleToggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const pageIds = generations.data.map(g => g.id);
        const allSelected = pageIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleBulkExport = (format: 'pdf' | 'all') => {
        if (selectedIds.length === 0) return;
        
        const formEl = document.createElement('form');
        formEl.method = 'POST';
        formEl.action = '/admin/cv-generator/bulk-export';
        
        const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrfToken;
        formEl.appendChild(csrfInput);

        selectedIds.forEach(id => {
            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'ids[]';
            idInput.value = String(id);
            formEl.appendChild(idInput);
        });

        const formatInput = document.createElement('input');
        formatInput.type = 'hidden';
        formatInput.name = 'format';
        formatInput.value = format;
        formEl.appendChild(formatInput);

        document.body.appendChild(formEl);
        formEl.submit();
        document.body.removeChild(formEl);
        
        setSelectedIds([]);
        toast.success('Pengeksporan massal dimulai...');
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        confirm({
            title: 'Hapus CV Terpilih?',
            description: `${selectedIds.length} CV yang terpilih akan dihapus secara permanen.`,
            variant: 'danger',
            onConfirm: () => {
                router.post('/admin/cv-generator/bulk-delete', { ids: selectedIds }, {
                    onSuccess: () => {
                        setSelectedIds([]);
                        toast.success('CV terpilih berhasil dihapus.');
                    },
                    onError: () => {
                        toast.error('Gagal menghapus CV terpilih.');
                    }
                });
            }
        });
    };

    const form = useForm({
        job_title: '',
        company_name: '',
        job_description: '',
        job_url: '',
        language: 'en' as 'en' | 'id',
    });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/cv-generator/generate', {
            onSuccess: () => {
                setDialogOpen(false);
                form.reset();
                toast.success('CV berhasil digenerate!');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(typeof firstError === 'string' ? firstError : 'Gagal generate CV. Silakan coba lagi.');
            },
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/cv-generator', { search: searchValue, status: filters.status }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get('/admin/cv-generator', { search: filters.search, status }, { preserveState: true, replace: true });
    };

    const handleDelete = (cv: CvGeneration) => {
        confirm({
            title: 'Hapus CV?',
            description: `CV untuk posisi "${cv.job_title}"${cv.company_name ? ` di ${cv.company_name}` : ''} akan dihapus permanen.`,
            variant: 'danger',
            onConfirm: () => router.delete(`/admin/cv-generator/${cv.id}`, {
                onSuccess: () => toast.success('CV berhasil dihapus'),
            }),
        });
    };

    const handleDuplicate = (cv: CvGeneration) => {
        router.post(`/admin/cv-generator/${cv.id}/duplicate`, {}, {
            onSuccess: () => toast.success('CV berhasil diduplikasi!'),
        });
    };

    const [loadingStep, setLoadingStep] = useState(0);

    useEffect(() => {
        if (!form.processing) {
            setLoadingStep(0);
            return;
        }
        const timers = [
            setTimeout(() => setLoadingStep(1), 2000),
            setTimeout(() => setLoadingStep(2), 5000),
            setTimeout(() => setLoadingStep(3), 10000),
            setTimeout(() => setLoadingStep(4), 16000),
            setTimeout(() => setLoadingStep(5), 22000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [form.processing]);

    const loadingMessages = [
        "Menganalisis Job Description & Kebutuhan Loker...",
        "Memindai seluruh database portofolio secara mendalam...",
        "Mengekstrak Keyword ATS & mencocokkan relevansi...",
        "Merangkum menggunakan Formula XYZ/STAR...",
        "Menyaring & memadatkan data untuk format 1 Lembar...",
        "Melakukan finalisasi & penyelarasan format akhir..."
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'CV Generator', href: '/admin/cv-generator' }]}>
            <Head title="ATS CV Generator" />
            <ConfirmDialog {...dialogProps} />

            <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-violet-500" />
                            ATS CV Generator
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                            Generate AI-optimized CVs tailored to specific job descriptions.
                        </p>
                    </div>
                    <Button
                        className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto shadow-sm"
                        onClick={() => setDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate New CV
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                className="pl-9 h-9"
                                placeholder="Search by job title or company..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchValue(''); router.get('/admin/cv-generator', { status: filters.status }, { preserveState: true, replace: true }); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="outline" size="sm" className="h-9">Search</Button>
                    </form>
                    <div className="flex gap-1.5">
                        {['all', 'draft', 'final', 'archived'].map((status) => (
                            <Button
                                key={status}
                                variant={filters.status === status ? 'default' : 'outline'}
                                size="sm"
                                className={`h-9 text-xs capitalize ${filters.status === status ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                                onClick={() => handleStatusFilter(status)}
                            >
                                {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Select All / Selection State */}
                <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="select-all" 
                            checked={generations.data.length > 0 && generations.data.every(g => selectedIds.includes(g.id))} 
                            onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className="text-xs font-semibold cursor-pointer text-neutral-600 dark:text-neutral-300">
                            Select All CVs on this page
                        </Label>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
                            {selectedIds.length} Selected
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total CVs', value: generations.total, icon: FileText, color: 'text-violet-500' },
                        { label: 'Drafts', value: generations.data.filter(g => g.status === 'draft').length, icon: Clock, color: 'text-amber-500' },
                        { label: 'Finalized', value: generations.data.filter(g => g.status === 'final').length, icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Avg ATS Score', value: (() => { const scored = generations.data.filter(g => g.ats_score); return scored.length ? Math.round(scored.reduce((a, g) => a + (g.ats_score || 0), 0) / scored.length) + '%' : '—'; })(), icon: BarChart3, color: 'text-blue-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-3 sm:p-4">
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                                <Icon className={`h-3.5 w-3.5 ${color}`} />
                                {label}
                            </div>
                            <div className="text-lg sm:text-xl font-bold tracking-tight">{value}</div>
                        </div>
                    ))}
                </div>

                {/* CV Cards Grid */}
                {generations.data.length === 0 ? (
                    <Card className="border-dashed border-2 border-neutral-200 dark:border-neutral-800">
                        <CardContent className="py-16 text-center">
                            <Sparkles className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-700 mb-4" />
                            <h3 className="font-semibold text-lg mb-1">No CVs Generated Yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Paste a job description and let AI create a perfectly optimized CV for you.
                            </p>
                            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />Generate Your First CV
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {generations.data.map((cv) => {
                            const status = statusConfig[cv.status];
                            const StatusIcon = status.icon;
                            return (
                                <Card key={cv.id} className="group relative overflow-hidden border-neutral-200 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-600/40 transition-all hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                <Checkbox 
                                                    checked={selectedIds.includes(cv.id)} 
                                                    onCheckedChange={() => handleToggleSelect(cv.id)}
                                                    className="mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-sm font-bold leading-tight truncate">
                                                        {cv.job_title}
                                                    </CardTitle>
                                                    {cv.company_name && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                                                            <Building2 className="h-3 w-3 shrink-0" />
                                                            <span className="truncate">{cv.company_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`shrink-0 text-[9px] uppercase tracking-widest ${status.color}`}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {status.label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-3">
                                        {/* ATS Score + Language */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target className={`h-4 w-4 ${getAtsScoreColor(cv.ats_score)}`} />
                                                <span className={`text-sm font-bold ${getAtsScoreColor(cv.ats_score)}`}>
                                                    {cv.ats_score ? `${cv.ats_score}%` : '—'}
                                                </span>
                                                <span className="text-[10px] text-neutral-400">ATS Score</span>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                                                <Globe className="h-3 w-3 mr-1" />
                                                {cv.language === 'en' ? 'English' : 'Bahasa'}
                                            </Badge>
                                        </div>

                                        {/* Date + Provider */}
                                        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(cv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            {cv.ai_provider && (
                                                <span className="flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" />
                                                    {cv.ai_provider}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                            <Link href={`/admin/cv-generator/${cv.id}`} className="flex-1">
                                                <Button size="sm" variant="outline" className="w-full h-8 text-xs hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 dark:hover:bg-violet-500/10 dark:hover:border-violet-500/30 dark:hover:text-violet-400">
                                                    <FileText className="mr-1 h-3 w-3" />Edit
                                                </Button>
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 shrink-0" title="Export Options">
                                                        <Download className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/admin/cv-generator/${cv.id}/download?format=pdf`} target="_blank" rel="noopener noreferrer">
                                                            Export PDF
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/admin/cv-generator/${cv.id}/download?format=word`}>
                                                            Export Word (.doc)
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/admin/cv-generator/${cv.id}/download?format=json`}>
                                                            Export JSON
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/admin/cv-generator/${cv.id}/download?format=markdown`}>
                                                            Export Markdown (.md)
                                                        </a>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button size="icon" variant="outline" className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:hover:bg-blue-500/10" title="Duplicate" onClick={() => handleDuplicate(cv)}>
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Delete" onClick={() => handleDelete(cv)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {generations.last_page > 1 && (
                    <div className="flex justify-center gap-1.5">
                        {generations.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                className={`h-8 min-w-8 text-xs ${link.active ? 'bg-violet-600' : ''}`}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Generate Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && !form.processing && setDialogOpen(false)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {form.processing ? (
                        <div className="py-8 px-4 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
                            <div className="relative h-16 w-16 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
                                <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                                    Membuat CV dengan AI
                                </h3>
                                <p className="text-xs text-neutral-500 animate-pulse font-medium">
                                    {loadingMessages[loadingStep]}
                                </p>
                            </div>

                            {/* Checklist of Steps */}
                            <div className="w-full max-w-md rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-3.5 text-left">
                                {loadingMessages.map((msg, idx) => {
                                    const isCompleted = loadingStep > idx;
                                    const isActive = loadingStep === idx;

                                    return (
                                        <div key={idx} className="flex items-center gap-3 transition-all">
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                                            ) : isActive ? (
                                                <Loader2 className="h-4.5 w-4.5 text-violet-600 animate-spin shrink-0" />
                                            ) : (
                                                <div className="h-4.5 w-4.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-center shrink-0">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                                </div>
                                            )}
                                            <span className={`text-xs ${
                                                isCompleted ? 'text-neutral-500 line-through decoration-neutral-300 dark:decoration-neutral-700' :
                                                isActive ? 'text-violet-600 dark:text-violet-400 font-bold' :
                                                'text-neutral-400'
                                            }`}>
                                                {msg}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-violet-500" />
                                    Generate ATS-Optimized CV
                                </DialogTitle>
                                <DialogDescription>
                                    Paste the job description and AI will create a CV tailored to pass ATS systems with maximum keyword match.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleGenerate} className="space-y-5 pt-2">
                                {/* Job Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="job_title" className="text-sm font-semibold">
                                        Position / Job Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="job_title"
                                        value={form.data.job_title}
                                        onChange={(e) => form.setData('job_title', e.target.value)}
                                        placeholder="e.g. Senior Full-Stack Developer"
                                        required
                                    />
                                    {form.errors.job_title && <p className="text-xs text-red-500">{form.errors.job_title}</p>}
                                </div>

                                {/* Company Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="company_name" className="text-sm font-semibold">
                                        Company Name <span className="text-neutral-400 text-xs font-normal">(Optional)</span>
                                    </Label>
                                    <Input
                                        id="company_name"
                                        value={form.data.company_name}
                                        onChange={(e) => form.setData('company_name', e.target.value)}
                                        placeholder="e.g. PT Tokopedia"
                                    />
                                </div>

                                {/* Job Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="job_description" className="text-sm font-semibold">
                                        Job Description <span className="text-red-500">*</span>
                                    </Label>
                                    <textarea
                                        id="job_description"
                                        className="border-input bg-background min-h-[200px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none resize-y"
                                        value={form.data.job_description}
                                        onChange={(e) => form.setData('job_description', e.target.value)}
                                        placeholder="Paste the full job description here. Include requirements, responsibilities, qualifications, and any specific keywords..."
                                        required
                                    />
                                    <p className="text-[11px] text-neutral-400">
                                        Tip: Semakin lengkap JD yang dimasukkan, semakin akurat keyword matching-nya.
                                        {form.data.job_description.length > 0 && (
                                            <span className="ml-2 font-mono">{form.data.job_description.length} chars</span>
                                        )}
                                    </p>
                                    {form.errors.job_description && <p className="text-xs text-red-500">{form.errors.job_description}</p>}
                                </div>

                                {/* Job URL + Language */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="job_url" className="text-sm font-semibold">
                                            Job URL <span className="text-neutral-400 text-xs font-normal">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="job_url"
                                            type="url"
                                            value={form.data.job_url}
                                            onChange={(e) => form.setData('job_url', e.target.value)}
                                            placeholder="https://careers.company.com/job/123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">CV Language</Label>
                                        <Select value={form.data.language} onValueChange={(v) => form.setData('language', v as 'en' | 'id')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">🇬🇧 English</SelectItem>
                                                <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="w-full bg-violet-600 hover:bg-violet-700 h-11 text-sm font-medium transition-all cursor-pointer shadow-sm"
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate ATS CV
                                </Button>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bulk Actions Panel */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-8 duration-200">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 border-r border-neutral-200 dark:border-neutral-800 pr-4">
                        {selectedIds.length} Selected
                    </span>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 rounded-full"
                        onClick={() => handleBulkExport('pdf')}
                    >
                        <Download className="mr-1 h-3.5 w-3.5" /> ZIP (PDF Only)
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs text-violet-600 hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-500/10 rounded-full"
                        onClick={() => handleBulkExport('all')}
                    >
                        <Download className="mr-1 h-3.5 w-3.5" /> ZIP (All Formats)
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={handleBulkDelete}
                    >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setSelectedIds([])}
                        title="Clear Selection"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </AppLayout>
    );
}
