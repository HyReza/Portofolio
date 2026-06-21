import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState, useReducer, useCallback, useRef, useEffect } from 'react';
import {
    ArrowLeft, Save, Download, RefreshCw, Sparkles, Eye, EyeOff,
    Plus, Trash2, ChevronDown, ChevronUp, ChevronRight, Target, FileText, Loader2,
    Clock, CheckCircle2, Archive, Pencil, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ── Types ──

interface CvSectionItem {
    source_type: string | null;
    source_id: number | null;
    title: string | null;
    subtitle: string | null;
    location: string | null;
    bullets: string[];
    metadata: Record<string, unknown>;
    is_visible: boolean;
}

interface CvSectionData {
    type: string;
    title: string;
    items: CvSectionItem[];
    is_visible: boolean;
}

interface CvData {
    professional_summary: string;
    ats_keywords: string[];
    ats_match_score: number;
    improvement_suggestions?: string[];
    sections: CvSectionData[];
    matched_keywords?: string[];
}

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
    cv_data: CvData;
    notes: string | null;
    created_at: string;
}

interface ProfileData {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    github: string;
    linkedin: string;
    website: string;
}

interface ReferenceItem {
    id: number;
    title: string;
    subtitle?: string;
    date?: string;
}

interface Props {
    cvGeneration: CvGeneration;
    profileData: ProfileData;
    references: Record<string, ReferenceItem[]>;
}

// ── Reducer for State Management ──

type Action =
    | { type: 'SET_CV_DATA'; payload: CvData }
    | { type: 'UPDATE_SUMMARY'; payload: string }
    | { type: 'TOGGLE_SECTION'; sectionIndex: number }
    | { type: 'RENAME_SECTION'; sectionIndex: number; title: string }
    | { type: 'DELETE_SECTION'; sectionIndex: number }
    | { type: 'MOVE_SECTION'; from: number; to: number }
    | { type: 'TOGGLE_ITEM'; sectionIndex: number; itemIndex: number }
    | { type: 'UPDATE_ITEM_FIELD'; sectionIndex: number; itemIndex: number; field: keyof CvSectionItem; value: unknown }
    | { type: 'REPLACE_ITEM'; sectionIndex: number; itemIndex: number; payload: Partial<CvSectionItem> }
    | { type: 'ADD_ITEM'; sectionIndex: number; payload?: Partial<CvSectionItem> }
    | { type: 'DELETE_ITEM'; sectionIndex: number; itemIndex: number }
    | { type: 'MOVE_ITEM'; sectionIndex: number; from: number; to: number }
    | { type: 'ADD_BULLET'; sectionIndex: number; itemIndex: number }
    | { type: 'UPDATE_BULLET'; sectionIndex: number; itemIndex: number; bulletIndex: number; value: string }
    | { type: 'DELETE_BULLET'; sectionIndex: number; itemIndex: number; bulletIndex: number }
    | { type: 'MOVE_BULLET'; sectionIndex: number; itemIndex: number; from: number; to: number }
    | { type: 'UPDATE_NOTES'; payload: string }
    | { type: 'UPDATE_ATS_METRICS'; score: number; suggestions: string[]; matchedKeywords: string[] };

interface EditorState {
    cvData: CvData;
    notes: string;
    isDirty: boolean;
}

function editorReducer(state: EditorState, action: Action): EditorState {
    const markDirty = (newState: Partial<EditorState>) => ({ ...state, ...newState, isDirty: true });

    switch (action.type) {
        case 'SET_CV_DATA':
            return { ...state, cvData: action.payload, isDirty: false };

        case 'UPDATE_SUMMARY':
            return markDirty({ cvData: { ...state.cvData, professional_summary: action.payload } });

        case 'TOGGLE_SECTION': {
            const sections = [...state.cvData.sections];
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], is_visible: !sections[action.sectionIndex].is_visible };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'RENAME_SECTION': {
            const sections = [...state.cvData.sections];
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], title: action.title };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'DELETE_SECTION': {
            const sections = state.cvData.sections.filter((_, i) => i !== action.sectionIndex);
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'MOVE_SECTION': {
            const sections = [...state.cvData.sections];
            const [moved] = sections.splice(action.from, 1);
            sections.splice(action.to, 0, moved);
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'TOGGLE_ITEM': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            items[action.itemIndex] = { ...items[action.itemIndex], is_visible: !items[action.itemIndex].is_visible };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'UPDATE_ITEM_FIELD': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            items[action.itemIndex] = { ...items[action.itemIndex], [action.field]: action.value };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'DELETE_ITEM': {
            const sections = [...state.cvData.sections];
            const items = sections[action.sectionIndex].items.filter((_, i) => i !== action.itemIndex);
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'MOVE_ITEM': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            const [moved] = items.splice(action.from, 1);
            items.splice(action.to, 0, moved);
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'REPLACE_ITEM': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            items[action.itemIndex] = { ...items[action.itemIndex], ...action.payload };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'ADD_ITEM': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items, {
                source_type: action.payload?.source_type || null,
                source_id: action.payload?.source_id || null,
                title: action.payload?.title || '',
                subtitle: action.payload?.subtitle || '',
                location: action.payload?.location || '',
                bullets: action.payload?.bullets || [],
                metadata: action.payload?.metadata || {},
                is_visible: true,
            }];
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'ADD_BULLET': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            const bullets = [...(items[action.itemIndex].bullets || []), ''];
            items[action.itemIndex] = { ...items[action.itemIndex], bullets };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'UPDATE_BULLET': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            const bullets = [...(items[action.itemIndex].bullets || [])];
            bullets[action.bulletIndex] = action.value;
            items[action.itemIndex] = { ...items[action.itemIndex], bullets };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'DELETE_BULLET': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            const bullets = items[action.itemIndex].bullets.filter((_, i) => i !== action.bulletIndex);
            items[action.itemIndex] = { ...items[action.itemIndex], bullets };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'MOVE_BULLET': {
            const sections = [...state.cvData.sections];
            const items = [...sections[action.sectionIndex].items];
            const bullets = [...(items[action.itemIndex].bullets || [])];
            const [moved] = bullets.splice(action.from, 1);
            bullets.splice(action.to, 0, moved);
            items[action.itemIndex] = { ...items[action.itemIndex], bullets };
            sections[action.sectionIndex] = { ...sections[action.sectionIndex], items };
            return markDirty({ cvData: { ...state.cvData, sections } });
        }

        case 'UPDATE_NOTES':
            return markDirty({ notes: action.payload });

        case 'UPDATE_ATS_METRICS':
            return {
                ...state,
                cvData: {
                    ...state.cvData,
                    ats_match_score: action.score,
                    improvement_suggestions: action.suggestions,
                    matched_keywords: action.matchedKeywords
                },
                isDirty: true
            };

        default:
            return state;
    }
}

// ── Helper: ATS Score Color ──

function getAtsColor(score: number | null) {
    if (!score) return { text: 'text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800', ring: 'ring-neutral-200' };
    if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-200 dark:ring-emerald-500/20' };
    if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-200 dark:ring-amber-500/20' };
    return { text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', ring: 'ring-red-200 dark:ring-red-500/20' };
}

// ── Helper: Real-time ATS Calculation ──

function calculateAtsScoreAndSuggestions(cvData: CvData, profileData: ProfileData, language: 'en' | 'id') {
    const suggestions: string[] = [];
    let score = 0;
    const isId = language === 'id';

    // 1. Contact line check (Weight: 10)
    let contactScore = 0;
    if (profileData.email) contactScore += 2;
    else suggestions.push(isId ? "Tambahkan alamat email profesional di bagian kontak." : "Add a professional email address in the contact section.");
    
    if (profileData.phone) contactScore += 2;
    else suggestions.push(isId ? "Tambahkan nomor telepon aktif di bagian kontak." : "Add an active phone number in the contact section.");
    
    if (profileData.linkedin) contactScore += 2;
    else suggestions.push(isId ? "Tambahkan tautan profil LinkedIn." : "Add a LinkedIn profile link.");
    
    if (profileData.github) contactScore += 2;
    else suggestions.push(isId ? "Tambahkan tautan repositori GitHub." : "Add a GitHub repository link.");
    
    const hasPortfolio = profileData.website && profileData.website.includes('rezaedisaputra.com');
    if (hasPortfolio) {
        contactScore += 2;
    } else {
        suggestions.push(isId ? "Pastikan website portofolio resmi https://www.rezaedisaputra.com/ tercantum di bagian kontak." : "Ensure your official portfolio website https://www.rezaedisaputra.com/ is listed in the contact section.");
    }
    score += contactScore;

    // Gather all text from CV to check keywords
    let allText = (cvData.professional_summary || '').toLowerCase();
    
    let totalBullets = 0;
    let quantifiedBullets = 0;
    let actionVerbBullets = 0;
    let bulletLengthViolations = 0;
    let experienceBulletViolations = 0;
    let projectBulletViolations = 0;

    // Strong action verbs list
    const actionVerbs = new Set([
        // Indonesian
        'memimpin', 'mengembangkan', 'mengoptimalkan', 'merancang', 'mengintegrasikan', 
        'mengelola', 'meningkatkan', 'membangun', 'membuat', 'mengimplementasikan', 
        'mempercepat', 'menghemat', 'meminimalkan', 'menyelesaikan', 'mempelopori', 
        'merekayasa', 'menyederhanakan', 'mengotomatiskan', 'mengarahkan',
        // English
        'spearheaded', 'engineered', 'architected', 'optimized', 'overhauled', 
        'accelerated', 'streamlined', 'decentralized', 'pioneered', 'led', 
        'developed', 'managed', 'created', 'implemented', 'designed', 'resolved', 
        'boosted', 'reduced', 'saved', 'automated', 'delivered', 'integrated'
    ]);

    cvData.sections.forEach(section => {
        if (!section.is_visible) return;
        
        allText += ' ' + section.title.toLowerCase();
        
        section.items.forEach(item => {
            if (!item.is_visible) return;
            
            allText += ' ' + (item.title || '').toLowerCase();
            allText += ' ' + (item.subtitle || '').toLowerCase();
            allText += ' ' + (item.location || '').toLowerCase();
            
            const bullets = item.bullets || [];
            
            const isExperience = section.type === 'experience' || section.title.toLowerCase().includes('experience') || section.title.toLowerCase().includes('pengalaman');
            const isProject = section.type === 'projects' || section.title.toLowerCase().includes('project') || section.title.toLowerCase().includes('proyek');
            
            if (isExperience && bullets.length > 3) {
                experienceBulletViolations++;
            }
            if (isProject && bullets.length > 2) {
                projectBulletViolations++;
            }
            
            bullets.forEach(bullet => {
                if (!bullet.trim()) return;
                totalBullets++;
                allText += ' ' + bullet.toLowerCase();
                
                // Quantification check (look for numbers, percentages, currency, etc.)
                const hasMetric = /\b\d+(?:%|\s*percent|\s*juta|\s*miliar|\s*ribu|\s*jt|\s*rb|\s*k|\b)/i.test(bullet) || 
                                  /\b(?:Rp|USD|\$)\s*\d+/i.test(bullet) ||
                                  /\b(?:~)?\d+\b/.test(bullet);
                if (hasMetric) {
                    quantifiedBullets++;
                }
                
                // Action verb check
                const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[.,;:()]/g, '');
                if (firstWord && actionVerbs.has(firstWord)) {
                    actionVerbBullets++;
                }

                // Bullet length check
                const wordCount = bullet.trim().split(/\s+/).length;
                if (wordCount > 25) {
                    bulletLengthViolations++;
                }
            });
        });
    });

    // 2. Keyword Match (Weight: 40)
    const keywords = cvData.ats_keywords || [];
    let matchedKeywords: string[] = [];
    let missingKeywords: string[] = [];
    
    if (keywords.length > 0) {
        keywords.forEach(kw => {
            const kwClean = kw.toLowerCase().trim();
            if (allText.includes(kwClean)) {
                matchedKeywords.push(kw);
            } else {
                missingKeywords.push(kw);
            }
        });
        
        const matchRatio = matchedKeywords.length / keywords.length;
        score += Math.round(matchRatio * 40);
        
        if (matchRatio < 0.8 && missingKeywords.length > 0) {
            const displayKws = missingKeywords.slice(0, 5).join(', ');
            suggestions.push(isId 
                ? `Integrasikan keyword penting berikut ke dalam deskripsi Anda: [${displayKws}].`
                : `Integrate the following key keywords into your descriptions: [${displayKws}].`
            );
        }
    } else {
        score += 40;
    }

    // 3. Metrics (Weight: 20)
    if (totalBullets > 0) {
        const metricRatio = quantifiedBullets / totalBullets;
        score += Math.round(metricRatio * 20);
        if (metricRatio < 0.6) {
            suggestions.push(isId
                ? "Tambahkan metrik kuantitatif (seperti % kenaikan, jumlah user, atau waktu yang dihemat) pada bullet points Anda."
                : "Add quantitative metrics (such as % increase, number of users, or time saved) to your bullet points."
            );
        }
    } else {
        score += 20;
    }

    // 4. Action Verbs (Weight: 15)
    if (totalBullets > 0) {
        const verbRatio = actionVerbBullets / totalBullets;
        score += Math.round(verbRatio * 15);
        if (verbRatio < 0.7) {
            suggestions.push(isId
                ? "Gunakan kata kerja aksi yang kuat (e.g. Spearheaded, Mengoptimalkan, Merancang) di awal setiap baris."
                : "Use strong action verbs (e.g., Spearheaded, Optimize, Design) at the start of each line."
            );
        }
    } else {
        score += 15;
    }

    // 5. Length & Constraints violations (Weight: 15)
    let layoutPoints = 15;
    if (experienceBulletViolations > 0) {
        layoutPoints -= 5;
        suggestions.push(isId
            ? "Batasi setiap pekerjaan maksimal 3 bullet point penting agar CV padat dan muat 1 halaman."
            : "Limit each job experience to a maximum of 3 key bullet points to keep the CV concise and on 1 page."
        );
    }
    if (projectBulletViolations > 0) {
        layoutPoints -= 5;
        suggestions.push(isId
            ? "Batasi setiap proyek maksimal 2 bullet point penting."
            : "Limit each project to a maximum of 2 key bullet points."
        );
    }
    if (bulletLengthViolations > 0) {
        layoutPoints -= 5;
        suggestions.push(isId
            ? "Persingkat bullet point yang terlalu panjang (> 25 kata) agar mudah dibaca oleh HRD."
            : "Shorten bullet points that are too long (> 25 words) for better readability."
        );
    }
    score += Math.max(0, layoutPoints);

    score = Math.max(0, Math.min(100, score));

    return { score, suggestions, matchedKeywords };
}

const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Clock },
    { value: 'final', label: 'Final', icon: CheckCircle2 },
    { value: 'archived', label: 'Archived', icon: Archive },
];

// ── Main Component ──

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// ... (other code is skipped because I'm just replacing the component definition top part)
// Wait, I need to do a precise replacement, let me replace starting from export default function.

export default function CvEditor({ cvGeneration, profileData, references = {} }: Props) {
    const { confirm, dialogProps, ConfirmDialog } = useConfirmDialog();
    const [isSaving, setIsSaving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [activeViewTab, setActiveViewTab] = useState<'editor' | 'preview'>('editor');
    const [expandedSections, setExpandedSections] = useState<Set<number>>(() => new Set(cvGeneration.cv_data.sections.map((_, i) => i)));
    const [editingSectionTitle, setEditingSectionTitle] = useState<number | null>(null);
    const sectionTitleRef = useRef<HTMLInputElement>(null);
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [addDialog, setAddDialog] = useState<{ isOpen: boolean; sectionIndex: number; sectionType: string } | null>(null);
    const [activeTab, setActiveTab] = useState<string>('career');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isGeneratingItem, setIsGeneratingItem] = useState<{ sIdx: number, iIdx?: number } | null>(null);

    useEffect(() => {
        if (addDialog?.isOpen) {
            const type = addDialog.sectionType.toLowerCase();
            if (type.includes('experience') || type.includes('career') || type.includes('work')) {
                setActiveTab('career');
            } else if (type.includes('project')) {
                setActiveTab('project');
            } else if (type.includes('education')) {
                setActiveTab('education');
            } else if (type.includes('cert')) {
                setActiveTab('certificate');
            } else if (type.includes('org')) {
                setActiveTab('organization');
            } else if (type.includes('achieve')) {
                setActiveTab('achievement');
            } else {
                setActiveTab('career');
            }
            setSearchQuery('');
        }
    }, [addDialog]);

    const handleGenerateItem = async (sectionIndex: number, sourceType: string, sourceId: number, replaceItemIndex?: number) => {
        setIsGeneratingItem({ sIdx: sectionIndex, iIdx: replaceItemIndex });
        try {
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await window.fetch(`/admin/cv-generator/${cvGeneration.id}/generate-item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ source_type: sourceType, source_id: sourceId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate item');

            if (replaceItemIndex !== undefined) {
                dispatch({ type: 'REPLACE_ITEM', sectionIndex, itemIndex: replaceItemIndex, payload: data.item });
            } else {
                dispatch({ type: 'ADD_ITEM', sectionIndex, payload: data.item });
                setExpandedSections(prev => new Set(prev).add(sectionIndex));
            }
            toast.success('Item generated successfully!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGeneratingItem(null);
            setAddDialog(null);
        }
    };

    const initialCvData: CvData = {
        professional_summary: cvGeneration.cv_data.professional_summary || '',
        ats_keywords: cvGeneration.cv_data.ats_keywords || [],
        ats_match_score: cvGeneration.cv_data.ats_match_score || 0,
        sections: (cvGeneration.cv_data.sections || []).map(s => ({
            ...s,
            is_visible: s.is_visible ?? true,
            items: (s.items || []).map(item => ({
                ...item,
                is_visible: item.is_visible ?? true,
                bullets: item.bullets || [],
                metadata: item.metadata || {},
            })),
        })),
    };

    const [state, dispatch] = useReducer(editorReducer, {
        cvData: initialCvData,
        notes: cvGeneration.notes || '',
        isDirty: false,
    });

    // Real-time ATS match scoring and suggestions recalculation
    useEffect(() => {
        const metrics = calculateAtsScoreAndSuggestions(state.cvData, profileData, cvGeneration.language);
        if (metrics.score !== state.cvData.ats_match_score || 
            JSON.stringify(metrics.suggestions) !== JSON.stringify(state.cvData.improvement_suggestions || []) ||
            JSON.stringify(metrics.matchedKeywords) !== JSON.stringify(state.cvData.matched_keywords || [])) {
            dispatch({
                type: 'UPDATE_ATS_METRICS',
                score: metrics.score,
                suggestions: metrics.suggestions,
                matchedKeywords: metrics.matchedKeywords
            });
        }
    }, [state.cvData, profileData, cvGeneration.language]);


    const handleSave = useCallback((isAutoSave = false) => {
        if (isSaving) return;
        setIsSaving(true);

        router.put(`/admin/cv-generator/${cvGeneration.id}`, {
            cv_data: state.cvData as any,
            notes: state.notes,
        } as any, {
            preserveScroll: true,
            onSuccess: () => {
                if (!isAutoSave) toast.success('CV berhasil disimpan!');
                dispatch({ type: 'SET_CV_DATA', payload: state.cvData });
                setPreviewKey(prev => prev + 1);
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string || 'Gagal menyimpan CV.');
            },
            onFinish: () => setIsSaving(false),
        });
    }, [cvGeneration.id, state.cvData, state.notes, isSaving]);

    const handleStatusChange = (status: string) => {
        confirm({
            title: 'Ubah Status?',
            description: `Status CV akan diubah ke "${status}".`,
            onConfirm: () => {
                router.put(`/admin/cv-generator/${cvGeneration.id}/status`, { status }, {
                    preserveScroll: true,
                    onSuccess: () => toast.success(`Status diubah ke ${status}.`),
                });
            },
        });
    };

    const handleRegenerate = () => {
        confirm({
            title: 'Regenerate CV?',
            description: 'AI akan membuat CV baru dari job description yang sama. CV ini akan tetap tersimpan.',
            variant: 'danger',
            onConfirm: () => {
                setIsRegenerating(true);
                router.post(`/admin/cv-generator/${cvGeneration.id}/regenerate`, {}, {
                    onError: () => { toast.error('Gagal regenerate CV.'); setIsRegenerating(false); },
                });
            },
        });
    };

    const handleDeleteSection = (sectionIndex: number) => {
        confirm({
            title: 'Hapus Section?',
            description: `Section "${state.cvData.sections[sectionIndex]?.title}" akan dihapus dari CV.`,
            variant: 'danger',
            onConfirm: () => dispatch({ type: 'DELETE_SECTION', sectionIndex }),
        });
    };

    const handleDeleteItem = (sectionIndex: number, itemIndex: number) => {
        const item = state.cvData.sections[sectionIndex]?.items[itemIndex];
        confirm({
            title: 'Hapus Item?',
            description: `"${item?.title || 'Item'}" akan dihapus dari section ini.`,
            variant: 'danger',
            onConfirm: () => dispatch({ type: 'DELETE_ITEM', sectionIndex, itemIndex }),
        });
    };

    const toggleSection = (index: number) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    };

    const atsColor = getAtsColor(state.cvData.ats_match_score || cvGeneration.ats_score);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Admin', href: '/admin' },
            { title: 'CV Generator', href: '/admin/cv-generator' },
            { title: cvGeneration.job_title, href: `/admin/cv-generator/${cvGeneration.id}` },
        ]}>
            <Head title={`Edit CV — ${cvGeneration.job_title}`} />
            <ConfirmDialog {...dialogProps} />

            {isRegenerating && (
                <Dialog open={true} onOpenChange={() => {}}>
                    <DialogContent className="sm:max-w-[420px] flex flex-col items-center justify-center p-8 text-center" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                        <div className="relative h-16 w-16 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
                            <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                        </div>
                        <h3 className="font-bold text-base mt-4 text-neutral-900 dark:text-neutral-100">
                            Membangun Ulang CV...
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 animate-pulse">
                            AI sedang menyelaraskan seluruh portofolio Anda dengan Job Description baru. Silakan tunggu...
                        </p>
                    </DialogContent>
                </Dialog>
            )}

            <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-4 pb-8">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.get('/admin/cv-generator')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-bold tracking-tight line-clamp-1">{cvGeneration.job_title}</h1>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                {cvGeneration.company_name && <span className="truncate max-w-[120px] sm:max-w-[200px]">{cvGeneration.company_name} •</span>}
                                <span>{new Date(cvGeneration.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {state.isDirty && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-500/10">Unsaved</Badge>}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Select value={cvGeneration.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="h-8 w-28 text-xs flex-1 sm:flex-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex-1 sm:flex-none justify-center"
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !state.isDirty}
                        >
                            {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                            Save
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 w-full sm:w-auto justify-center">
                                    <Download className="mr-1 h-3 w-3" />Export <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=pdf`} target="_blank" rel="noopener noreferrer">
                                        Export as PDF
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=word`}>
                                        Export as Word (.doc)
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=json`}>
                                        Export as JSON
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=markdown`}>
                                        Export as Markdown (.md)
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex-1 sm:flex-none justify-center"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                            Regen
                        </Button>
                    </div>
                </div>

                {/* Mobile View Toggle Tabs (only visible on mobile/tablet) */}
                <div className="flex lg:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-10 -mx-4 px-4 py-2 gap-2">
                    <Button
                        variant={activeViewTab === 'editor' ? 'default' : 'ghost'}
                        className={`flex-1 text-xs h-9 font-semibold ${activeViewTab === 'editor' ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'text-neutral-500'}`}
                        onClick={() => setActiveViewTab('editor')}
                    >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit CV Fields
                    </Button>
                    <Button
                        variant={activeViewTab === 'preview' ? 'default' : 'ghost'}
                        className={`flex-1 text-xs h-9 font-semibold ${activeViewTab === 'preview' ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'text-neutral-500'}`}
                        onClick={() => setActiveViewTab('preview')}
                    >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Live PDF Preview
                    </Button>
                </div>

                {/* 2-Column Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Editor Fields */}
                    <div className={`lg:col-span-7 space-y-4 ${activeViewTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
                        {/* 1-Page Optimization Tip Alert */}
                        <div className="rounded-xl border border-violet-100 bg-violet-50/35 dark:border-violet-950 dark:bg-violet-950/20 p-3 flex items-start gap-2.5 shadow-sm">
                            <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-violet-800 dark:text-violet-400">💡 Tips Optimasi 1 Halaman (Standar HRD)</h4>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-normal">
                                    Gunakan ikon mata (<Eye className="inline h-3.5 w-3.5 text-emerald-600 align-middle" /> atau <EyeOff className="inline h-3.5 w-3.5 text-neutral-400 align-middle" />) untuk menampilkan/menyembunyikan pengalaman atau proyek. Batasi tiap entitas pekerjaan menjadi 2-3 poin STAR/XYZ penting agar CV Anda muat dalam 1 lembar A4 yang rapi, padat, dan ATS-friendly.
                                </p>
                            </div>
                        </div>

                        {/* ATS Score & Keywords Panel */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className={`rounded-xl p-4 ring-1 ${atsColor.ring} ${atsColor.bg} flex flex-col justify-center`}>
                                <div className="flex items-center gap-3">
                                    <Target className={`h-8 w-8 ${atsColor.text}`} />
                                    <div>
                                        <div className={`text-2xl font-black tracking-tight ${atsColor.text}`}>
                                            {state.cvData.ats_match_score || cvGeneration.ats_score || '—'}%
                                        </div>
                                        <div className="text-xs text-neutral-500">Estimated ATS Match Score</div>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl p-4 ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" /> ATS Keywords
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-1">
                                    {(state.cvData.ats_keywords || []).slice(0, 15).map((kw, i) => {
                                        const isMatched = (state.cvData.matched_keywords || [])
                                            .map(k => k.toLowerCase().trim())
                                            .includes(kw.toLowerCase().trim());
                                        return (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className={`text-[10px] font-mono ${
                                                    isMatched
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800'
                                                }`}
                                            >
                                                {isMatched ? '✓ ' : '• '}
                                                {kw}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="rounded-xl p-4 ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-950">
                                <div className="text-xs font-semibold text-neutral-500 mb-1.5 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Saran Perbaikan (Menuju 100%)
                                </div>
                                <ul className="space-y-1 overflow-y-auto max-h-[85px] pr-1">
                                    {state.cvData.improvement_suggestions && state.cvData.improvement_suggestions.length > 0 ? (
                                        state.cvData.improvement_suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-[10px] text-neutral-600 dark:text-neutral-400 flex items-start gap-1">
                                                <span className="text-violet-500 select-none shrink-0">•</span>
                                                <span className="leading-tight">{suggestion}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-[10px] text-neutral-400 italic">
                                            Tidak ada saran perbaikan. CV Anda sudah sangat selaras dengan JD!
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Professional Summary */}
                        <Card className="border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-violet-500" />
                                    Professional Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <textarea
                                    className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none resize-y"
                                    value={state.cvData.professional_summary}
                                    onChange={(e) => dispatch({ type: 'UPDATE_SUMMARY', payload: e.target.value })}
                                    placeholder="Professional summary will be generated by AI..."
                                />
                            </CardContent>
                        </Card>

                        {/* Sections */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">CV Sections</h2>
                                <span className="text-[10px] text-neutral-400">{state.cvData.sections.length} sections</span>
                            </div>

                            {state.cvData.sections.map((section, sIdx) => (
                                <Card key={sIdx} className={`border transition-all ${section.is_visible ? 'border-neutral-200 dark:border-neutral-800' : 'border-dashed border-neutral-300 dark:border-neutral-700 opacity-60'}`}>
                                    {/* Section Header */}
                                    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 rounded-t-xl">
                                        {/* Drag handle */}
                                        <div className="flex flex-col gap-0.5">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5"
                                                disabled={sIdx === 0}
                                                onClick={() => dispatch({ type: 'MOVE_SECTION', from: sIdx, to: sIdx - 1 })}
                                            >
                                                <ChevronUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5"
                                                disabled={sIdx === state.cvData.sections.length - 1}
                                                onClick={() => dispatch({ type: 'MOVE_SECTION', from: sIdx, to: sIdx + 1 })}
                                            >
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        {/* Section Title (editable) */}
                                        <div className="flex-1 min-w-0">
                                            {editingSectionTitle === sIdx ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Input
                                                        ref={sectionTitleRef}
                                                        className="h-7 text-sm font-semibold"
                                                        defaultValue={section.title}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                dispatch({ type: 'RENAME_SECTION', sectionIndex: sIdx, title: (e.target as HTMLInputElement).value });
                                                                setEditingSectionTitle(null);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingSectionTitle(null);
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => {
                                                        if (sectionTitleRef.current) dispatch({ type: 'RENAME_SECTION', sectionIndex: sIdx, title: sectionTitleRef.current.value });
                                                        setEditingSectionTitle(null);
                                                    }}>
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingSectionTitle(null)}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                                    onClick={() => toggleSection(sIdx)}
                                                >
                                                    {expandedSections.has(sIdx) ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                                    {section.title}
                                                    <Badge variant="outline" className="text-[9px] ml-1 font-mono">{section.type}</Badge>
                                                    <span className="text-[10px] font-normal text-neutral-400 ml-1">({section.items.length})</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Section Actions */}
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingSectionTitle(sIdx)} title="Rename">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dispatch({ type: 'TOGGLE_SECTION', sectionIndex: sIdx })} title={section.is_visible ? 'Hide' : 'Show'}>
                                                {section.is_visible ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-neutral-400" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSection(sIdx)} title="Delete Section">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Section Items */}
                                    {expandedSections.has(sIdx) && (
                                        <CardContent className="p-3 space-y-3">
                                            {section.items.length === 0 ? (
                                                <p className="text-xs text-neutral-400 italic py-4 text-center">No items in this section.</p>
                                            ) : (
                                                section.items.map((item, iIdx) => (
                                                    <div
                                                        key={iIdx}
                                                        className={`rounded-lg border p-3 space-y-2 transition-all ${item.is_visible ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950' : 'border-dashed border-neutral-300 dark:border-neutral-700 opacity-50 bg-neutral-50 dark:bg-neutral-900/50'}`}
                                                    >
                                                        {/* Item Header */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="flex flex-col gap-0">
                                                                    <Button size="icon" variant="ghost" className="h-4 w-4" disabled={iIdx === 0} onClick={() => dispatch({ type: 'MOVE_ITEM', sectionIndex: sIdx, from: iIdx, to: iIdx - 1 })}>
                                                                        <ChevronUp className="h-2.5 w-2.5" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-4 w-4" disabled={iIdx === section.items.length - 1} onClick={() => dispatch({ type: 'MOVE_ITEM', sectionIndex: sIdx, from: iIdx, to: iIdx + 1 })}>
                                                                        <ChevronDown className="h-2.5 w-2.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                <Input
                                                                    className="h-8 text-sm font-semibold"
                                                                    value={item.title || ''}
                                                                    onChange={(e) => dispatch({ type: 'UPDATE_ITEM_FIELD', sectionIndex: sIdx, itemIndex: iIdx, field: 'title', value: e.target.value })}
                                                                    placeholder="Title (e.g. Senior Developer)"
                                                                />
                                                                <div className="grid gap-1.5 sm:grid-cols-2">
                                                                    <Input
                                                                        className="h-7 text-xs"
                                                                        value={item.subtitle || ''}
                                                                        onChange={(e) => dispatch({ type: 'UPDATE_ITEM_FIELD', sectionIndex: sIdx, itemIndex: iIdx, field: 'subtitle', value: e.target.value })}
                                                                        placeholder="Subtitle (e.g. Company — Jan 2024 – Present)"
                                                                    />
                                                                    <Input
                                                                        className="h-7 text-xs"
                                                                        value={item.location || ''}
                                                                        onChange={(e) => dispatch({ type: 'UPDATE_ITEM_FIELD', sectionIndex: sIdx, itemIndex: iIdx, field: 'location', value: e.target.value })}
                                                                        placeholder="Location (optional)"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                {item.source_type && item.source_id && (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                                                                        title="Regenerate with AI"
                                                                        disabled={isGeneratingItem?.sIdx === sIdx && isGeneratingItem?.iIdx === iIdx}
                                                                        onClick={() => handleGenerateItem(sIdx, item.source_type!, item.source_id!, iIdx)}
                                                                    >
                                                                        {isGeneratingItem?.sIdx === sIdx && isGeneratingItem?.iIdx === iIdx ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <Sparkles className="h-3 w-3" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dispatch({ type: 'TOGGLE_ITEM', sectionIndex: sIdx, itemIndex: iIdx })}>
                                                                    {item.is_visible ? <Eye className="h-3 w-3 text-emerald-600" /> : <EyeOff className="h-3 w-3 text-neutral-400" />}
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(sIdx, iIdx)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Bullet Points */}
                                                        {item.bullets && item.bullets.length > 0 && (
                                                            <div className="pl-6 space-y-1.5">
                                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bullet Points</Label>
                                                                {item.bullets.map((bullet, bIdx) => (
                                                                    <div key={bIdx} className="flex items-start gap-1.5 group">
                                                                        <div className="flex flex-col gap-0 mt-1">
                                                                            <Button size="icon" variant="ghost" className="h-3 w-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" disabled={bIdx === 0} onClick={() => dispatch({ type: 'MOVE_BULLET', sectionIndex: sIdx, itemIndex: iIdx, from: bIdx, to: bIdx - 1 })}>
                                                                                <ChevronUp className="h-2 w-2" />
                                                                            </Button>
                                                                            <Button size="icon" variant="ghost" className="h-3 w-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" disabled={bIdx === item.bullets.length - 1} onClick={() => dispatch({ type: 'MOVE_BULLET', sectionIndex: sIdx, itemIndex: iIdx, from: bIdx, to: bIdx + 1 })}>
                                                                                <ChevronDown className="h-2 w-2" />
                                                                            </Button>
                                                                        </div>
                                                                        <span className="text-violet-500 text-xs mt-2 shrink-0">•</span>
                                                                        <textarea
                                                                            className="border-input bg-background flex-1 min-h-[36px] rounded-md border px-2 py-1.5 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none resize-y"
                                                                            value={bullet}
                                                                            onChange={(e) => dispatch({ type: 'UPDATE_BULLET', sectionIndex: sIdx, itemIndex: iIdx, bulletIndex: bIdx, value: e.target.value })}
                                                                            rows={2}
                                                                        />
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 shrink-0 mt-1 text-neutral-400 hover:text-destructive opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                                                            onClick={() => dispatch({ type: 'DELETE_BULLET', sectionIndex: sIdx, itemIndex: iIdx, bulletIndex: bIdx })}
                                                                        >
                                                                            <Trash2 className="h-2.5 w-2.5" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add Bullet */}
                                                        <div className="pl-6">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-[11px] text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                                                                onClick={() => dispatch({ type: 'ADD_BULLET', sectionIndex: sIdx, itemIndex: iIdx })}
                                                            >
                                                                <Plus className="mr-1 h-3 w-3" />Add Bullet Point
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs border-dashed"
                                                    onClick={() => setAddDialog({ isOpen: true, sectionIndex: sIdx, sectionType: section.type })}
                                                >
                                                    <Plus className="mr-1 h-3 w-3" />Add Item from Database
                                                </Button>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Notes */}
                        <Card className="border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Personal Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <textarea
                                    className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none resize-y"
                                    value={state.notes}
                                    onChange={(e) => dispatch({ type: 'UPDATE_NOTES', payload: e.target.value })}
                                    placeholder="Add personal notes about this application..."
                                />
                            </CardContent>
                        </Card>

                        {/* Job Description Reference (Collapsible) */}
                        <details className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                            <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                                📋 Job Description Reference
                            </summary>
                            <div className="px-4 pb-4 pt-2">
                                {cvGeneration.job_url && (
                                    <a href={cvGeneration.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline mb-2 block">
                                        🔗 {cvGeneration.job_url}
                                    </a>
                                )}
                                <div className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                                    {cvGeneration.job_description}
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* Right Column: Live PDF Preview */}
                    <div className={`lg:col-span-5 lg:sticky lg:top-6 space-y-4 ${activeViewTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[600px] overflow-hidden bg-white dark:bg-neutral-950">
                            <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-row items-center justify-between space-y-0 py-2.5">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
                                    Live PDF Preview
                                </CardTitle>
                                <span className="text-[10px] text-neutral-400">Autosaves & reloads on changes</span>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 relative bg-neutral-100 dark:bg-neutral-900">
                                <iframe
                                    key={previewKey}
                                    src={`/admin/cv-generator/${cvGeneration.id}/download?preview=1`}
                                    className="w-full h-full border-none absolute inset-0"
                                    title="CV Live Preview"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto justify-center" onClick={() => router.get('/admin/cv-generator')}>
                        <ArrowLeft className="mr-1 h-3 w-3" />Back to History
                    </Button>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex-1 sm:flex-none justify-center"
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !state.isDirty}
                        >
                            {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                            Save Draft
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto justify-center">
                                    <Download className="mr-1 h-3 w-3" />Export <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=pdf`} target="_blank" rel="noopener noreferrer">
                                        Export as PDF
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=word`}>
                                        Export as Word (.doc)
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=json`}>
                                        Export as JSON
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/admin/cv-generator/${cvGeneration.id}/download?format=markdown`}>
                                        Export as Markdown (.md)
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Add Item Dialog */}
            <Dialog open={addDialog?.isOpen || false} onOpenChange={(open) => !open && setAddDialog(null)}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-base flex items-center gap-2">
                            <Plus className="h-4 w-4 text-violet-600" />
                            Add Item from Portfolio
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Pilih data dari portofolio Anda. AI akan menyeleksi dan menulis ulangnya secara instan agar 100% relevan dengan Job Description.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tab Navigation */}
                    <div className="flex border-b overflow-x-auto gap-2 py-1 scrollbar-none">
                        {[
                            { id: 'career', label: 'Experience' },
                            { id: 'project', label: 'Projects' },
                            { id: 'education', label: 'Education' },
                            { id: 'certificate', label: 'Certificates' },
                            { id: 'organization', label: 'Organizations' },
                            { id: 'achievement', label: 'Achievements' },
                        ].map(tab => {
                            const count = references[tab.id]?.length || 0;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-all border-b-2 -mb-[1px] ${
                                        isActive
                                            ? 'border-violet-600 text-violet-600 bg-violet-50/20'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                                    }`}
                                >
                                    {tab.label} <span className="opacity-60 font-mono text-[10px]">({count})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Field */}
                    <div className="relative mt-2">
                        <Input
                            placeholder={`Cari data referensi...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 pr-3 text-xs"
                        />
                        <span className="absolute left-2.5 top-2.5 text-[10px] text-neutral-400">🔍</span>
                    </div>

                    {/* Item Cards List */}
                    <div className="mt-2 max-h-[300px] overflow-y-auto space-y-2 pr-1 min-h-[120px]">
                        {(() => {
                            const items = references[activeTab] || [];
                            const filtered = items.filter(item =>
                                (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (filtered.length === 0) {
                                return (
                                    <div className="py-12 text-center text-xs text-neutral-400 italic">
                                        Tidak ada data referensi yang ditemukan.
                                    </div>
                                );
                            }

                            return filtered.map(item => (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-violet-50/5 dark:hover:bg-violet-500/5 transition-all shadow-sm group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">{item.title}</h4>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                                            {item.subtitle && <span className="font-semibold">{item.subtitle}</span>}
                                            {item.subtitle && item.date && <span className="opacity-40">•</span>}
                                            {item.date && <span>{item.date}</span>}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-7 text-[10px] shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-1.5 w-full sm:w-auto justify-center"
                                        disabled={isGeneratingItem !== null}
                                        onClick={() => {
                                            if (addDialog) {
                                                handleGenerateItem(addDialog.sectionIndex, activeTab, item.id);
                                            }
                                        }}
                                    >
                                        {isGeneratingItem?.sIdx === addDialog?.sectionIndex && isGeneratingItem !== null ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-3 w-3" />
                                                Add with AI
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ));
                        })()}
                    </div>

                    <DialogFooter className="pt-2 border-t mt-2">
                        <Button variant="outline" size="sm" onClick={() => setAddDialog(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
