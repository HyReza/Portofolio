import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, FileText, FolderKanban, BookOpen } from 'lucide-react';
import { useAchievements } from '@/hooks/useGimmicks';

interface SearchItem { type: 'project' | 'blog' | 'page'; title: string; href: string; }

const defaultItems: SearchItem[] = [
    { type: 'page', title: 'Home', href: '/' },
    { type: 'page', title: 'About Me', href: '/about' },
    { type: 'page', title: 'Projects', href: '/projects' },
    { type: 'page', title: 'Blog', href: '/blog' },
    { type: 'page', title: 'Certificates', href: '/certificates' },
    { type: 'page', title: 'Contact', href: '/contact' },
];

export function SpotlightSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { unlock } = useAchievements();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { 
                e.preventDefault(); 
                setOpen(true); 
                unlock('detective');
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => { if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

    const filtered = defaultItems.filter(i => i.title.toLowerCase().includes(query.toLowerCase()));
    const iconFor = (type: string) => type === 'project' ? <FolderKanban className="h-4 w-4" /> : type === 'blog' ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />;

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018] shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
                    <Search className="h-5 w-5 shrink-0 text-white/30" />
                    <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pages, projects, articles..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" />
                    <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/30 sm:inline">ESC</kbd>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <p className="p-4 text-center text-sm text-white/20">No results found.</p>
                    ) : filtered.map((item, i) => (
                        <a key={i} href={item.href} className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white/90">
                            <span className="text-white/20 group-hover:text-white/50">{iconFor(item.type)}</span>
                            <span className="flex-1">{item.title}</span>
                            <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                        </a>
                    ))}
                </div>
                <div className="border-t border-white/5 px-5 py-3 text-[11px] text-white/15">
                    <span className="mr-4"><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↑↓</kbd> Navigate</span>
                    <span className="mr-4"><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">⏎</kbd> Open</span>
                    <span><kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">Esc</kbd> Close</span>
                </div>
            </div>
        </div>
    );
}
