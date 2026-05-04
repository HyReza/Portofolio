import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutoTranslateButtonProps {
    sourceText: string;
    onTranslate: (translatedText: string) => void;
    sourceLang?: string;
    targetLang?: string;
    className?: string;
}

export function AutoTranslateButton({ sourceText, onTranslate, sourceLang = 'id', targetLang = 'en', className = '' }: AutoTranslateButtonProps) {
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        if (!sourceText || !sourceText.trim()) {
            toast.error('Teks sumber (Bahasa Indonesia) masih kosong!');
            return;
        }

        setIsTranslating(true);
        try {
            const response = await fetch('/admin/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // CSRF token is usually handled by axios automatically, for fetch we need to pass it or rely on cookies
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    text: sourceText,
                    source: sourceLang,
                    target: targetLang
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.success) {
                onTranslate(data.translated);
                toast.success('Berhasil diterjemahkan otomatis!');
            } else {
                toast.error(data.message || 'Gagal menerjemahkan.');
            }
        } catch (error: any) {
            console.error('Translation error:', error);
            toast.error('Gagal terhubung ke layanan terjemahan.');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating}
            className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 ${className}`}
            title={`Auto-translate to ${targetLang.toUpperCase()}`}
        >
            {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3 shrink-0" />}
            <span className="hidden sm:inline">Auto Translate</span>
        </Button>
    );
}
