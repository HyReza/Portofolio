import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function TagInput({ value, onChange, placeholder = 'Type and press Enter...', className = '' }: TagInputProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = useCallback((tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
    }, [value, onChange]);

    const removeTag = useCallback((index: number) => {
        onChange(value.filter((_, i) => i !== index));
    }, [value, onChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            // Support pasting comma-separated values
            const parts = input.split(',').map(s => s.trim()).filter(Boolean);
            const newTags = [...value];
            parts.forEach(p => {
                if (!newTags.includes(p)) newTags.push(p);
            });
            onChange(newTags);
            setInput('');
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1);
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

    return (
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
                    {tag}
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => {
                    if (input.trim()) {
                        addTag(input);
                        setInput('');
                    }
                }}
                placeholder={value.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[100px] bg-transparent outline-none text-sm py-1 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 dark:text-white"
            />
        </div>
    );
}
