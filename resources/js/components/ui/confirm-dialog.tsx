import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    const iconMap = {
        danger: <Trash2 className="h-6 w-6 text-red-500" />,
        warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        info: <Info className="h-6 w-6 text-blue-500" />,
    };
    const iconBgMap = {
        danger: 'bg-red-50 dark:bg-red-500/10 ring-red-100 dark:ring-red-500/20',
        warning: 'bg-amber-50 dark:bg-amber-500/10 ring-amber-100 dark:ring-amber-500/20',
        info: 'bg-blue-50 dark:bg-blue-500/10 ring-blue-100 dark:ring-blue-500/20',
    };
    const btnMap = {
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25',
        info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="p-6 pb-4 text-center">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${iconBgMap[variant]}`}>
                        {iconMap[variant]}
                    </div>
                    <DialogHeader className="text-center space-y-2">
                        <DialogTitle className="text-lg font-bold text-center">{title}</DialogTitle>
                        <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <DialogFooter className="flex flex-row gap-2 border-t border-neutral-100 dark:border-neutral-800 px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 rounded-xl"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => { onConfirm(); onOpenChange(false); }}
                        className={`flex-1 rounded-xl shadow-lg ${btnMap[variant]}`}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Hook for easy usage
export function useConfirmDialog() {
    const [state, setState] = useState<{
        open: boolean;
        title: string;
        description: string;
        confirmText: string;
        variant: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        confirmText: 'Delete',
        variant: 'danger',
        onConfirm: () => {},
    });

    const confirm = useCallback((opts: {
        title?: string;
        description?: string;
        confirmText?: string;
        variant?: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }) => {
        setState({
            open: true,
            title: opts.title || 'Are you sure?',
            description: opts.description || 'This action cannot be undone.',
            confirmText: opts.confirmText || 'Delete',
            variant: opts.variant || 'danger',
            onConfirm: opts.onConfirm,
        });
    }, []);

    const dialogProps = {
        ...state,
        onOpenChange: (open: boolean) => setState(s => ({ ...s, open })),
    };

    return { confirm, dialogProps, ConfirmDialog };
}
