import { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, Check, X } from 'lucide-react';

interface SearchableFilterProps {
    value: string;
    onValueChange: (value: string) => void;
    items: string[];
    /** Label for "All" option */
    allLabel?: string;
    /** Placeholder for search input */
    searchPlaceholder?: string;
    /** Icon to show before selected value */
    icon?: React.ReactNode;
    /** Whether using dark mode */
    dark?: boolean;
    /** Custom class for trigger */
    className?: string;
}

export function SearchableFilter({
    value,
    onValueChange,
    items,
    allLabel = 'All',
    searchPlaceholder = 'Search...',
    icon,
    dark = false,
    className = '',
}: SearchableFilterProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredItems = items.filter(item => {
        if (item === 'All') return true;
        return item.toLowerCase().includes(search.toLowerCase());
    });

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (open) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [open]);

    const displayValue = value === 'All' ? allLabel : value;

    return (
        <div ref={containerRef} className={`relative w-full sm:w-56 shrink-0 ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full rounded-2xl h-[46px] border px-4 transition-all flex items-center justify-between gap-2
                    ${dark
                        ? 'bg-white/5 border-white/5 text-white hover:bg-white/10 focus:ring-2 focus:ring-indigo-500/30'
                        : 'bg-gray-50 border-gray-100 text-gray-900 hover:bg-gray-100 shadow-sm focus:ring-2 focus:ring-indigo-500/20'
                    }`}
            >
                <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                    {icon || <Filter className="w-4 h-4 opacity-50 shrink-0" />}
                    <span className="truncate">{displayValue}</span>
                </div>
                <ChevronDown className={`w-4 h-4 opacity-50 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className={`absolute z-50 mt-2 w-full rounded-xl border shadow-xl overflow-hidden
                    ${dark
                        ? 'bg-neutral-900 border-white/10 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                >
                    {/* Search Input */}
                    {items.length > 5 && (
                        <div className={`px-3 pt-3 pb-2 ${dark ? 'border-b border-white/5' : 'border-b border-gray-100'}`}>
                            <div className="relative">
                                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${dark ? 'text-white/30' : 'text-gray-400'}`} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className={`w-full rounded-lg pl-8 pr-8 py-2 text-xs outline-none transition-all
                                        ${dark
                                            ? 'bg-white/5 text-white placeholder:text-white/30 border border-white/10 focus:border-indigo-500/30'
                                            : 'bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-indigo-500'
                                        }`}
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors
                                            ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items List */}
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filteredItems.length === 0 ? (
                            <div className={`px-3 py-4 text-center text-xs ${dark ? 'text-white/30' : 'text-gray-400'}`}>
                                No results found
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = value === item;
                                const displayLabel = item === 'All' ? allLabel : item;
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => {
                                            onValueChange(item);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2
                                            ${isSelected
                                                ? (dark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-700')
                                                : (dark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-gray-50 text-gray-700')
                                            }`}
                                    >
                                        <span className="truncate">{displayLabel}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
