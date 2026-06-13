import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface Suggestion {
    id: number;
    label: string;
    /** Optional secondary label (e.g. bilingual name) */
    labelSecondary?: string;
}

interface TagInputWithSuggestionsProps {
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions: Suggestion[];
    placeholder?: string;
    className?: string;
    /** Called when user creates a brand new item not in suggestions */
    onCreateNew?: (name: string) => void;
}

export function TagInputWithSuggestions({
    value,
    onChange,
    suggestions,
    placeholder = 'Type and press Enter...',
    className = '',
    onCreateNew,
}: TagInputWithSuggestionsProps) {
    const [input, setInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on input and already selected values
    const filtered = suggestions.filter(s => {
        const alreadySelected = value.some(v => v.toLowerCase() === s.label.toLowerCase());
        if (alreadySelected) return false;
        if (!input.trim()) return true;
        return s.label.toLowerCase().includes(input.toLowerCase()) ||
            (s.labelSecondary && s.labelSecondary.toLowerCase().includes(input.toLowerCase()));
    });

    const isExactMatch = suggestions.some(s => s.label.toLowerCase() === input.trim().toLowerCase());
    const canCreateNew = input.trim() && !isExactMatch && !value.some(v => v.toLowerCase() === input.trim().toLowerCase());

    const addTag = useCallback((tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInput('');
        setShowDropdown(false);
        setHighlightIndex(-1);
    }, [value, onChange]);

    const removeTag = useCallback((index: number) => {
        onChange(value.filter((_, i) => i !== index));
    }, [value, onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const maxIndex = filtered.length + (canCreateNew ? 0 : -1);
            setHighlightIndex(prev => Math.min(prev + 1, maxIndex));
            setShowDropdown(true);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < filtered.length) {
                addTag(filtered[highlightIndex].label);
            } else if (highlightIndex === filtered.length && canCreateNew) {
                handleCreateNew();
            } else if (input.trim()) {
                addTag(input);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setHighlightIndex(-1);
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1);
        } else if (e.key === ',') {
            e.preventDefault();
            if (input.trim()) {
                addTag(input);
            }
        }
    };

    const handleCreateNew = () => {
        const trimmed = input.trim();
        if (trimmed) {
            if (onCreateNew) {
                onCreateNew(trimmed);
            }
            addTag(trimmed);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        if (text.includes(',')) {
            e.preventDefault();
            const parts = text.split(',').map(s => s.trim()).filter(Boolean);
            const newTags = [...value];
            parts.forEach(p => {
                if (!newTags.includes(p)) newTags.push(p);
            });
            onChange(newTags);
            setInput('');
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setHighlightIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div
                className={`flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm cursor-text transition-colors
                    border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950
                    focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500
                    ${className}`}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag, i) => (
                    <span
                        key={`${tag}-${i}`}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-xs font-medium border border-indigo-200 dark:border-indigo-500/30 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/25"
                    >
                        <span className="truncate max-w-[150px]">{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-500/40 text-indigo-500 dark:text-indigo-400 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setShowDropdown(true);
                        setHighlightIndex(-1);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onBlur={() => {
                        // Small delay to allow clicking dropdown items
                        setTimeout(() => {
                            if (input.trim() && !showDropdown) {
                                addTag(input);
                            }
                        }, 200);
                    }}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-sm py-1 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 dark:text-white"
                />
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && (filtered.length > 0 || canCreateNew) && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-lg max-h-48 overflow-y-auto">
                    {filtered.map((suggestion, i) => (
                        <button
                            key={suggestion.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2
                                ${i === highlightIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                }`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                addTag(suggestion.label);
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                        >
                            <span className="truncate font-medium">{suggestion.label}</span>
                            {suggestion.labelSecondary && (
                                <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate shrink-0">
                                    {suggestion.labelSecondary}
                                </span>
                            )}
                        </button>
                    ))}
                    {canCreateNew && (
                        <button
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800
                                ${highlightIndex === filtered.length
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                                }`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleCreateNew();
                            }}
                            onMouseEnter={() => setHighlightIndex(filtered.length)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="font-medium">Create "{input.trim()}"</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
