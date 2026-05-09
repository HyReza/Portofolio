import { motion } from 'framer-motion';

interface ChatSkeletonProps {
    dk: boolean;
    count?: number;
}

function Pulse({ className, dk }: { className: string; dk: boolean }) {
    return (
        <motion.div
            className={`rounded-lg ${dk ? 'bg-neutral-700/40' : 'bg-neutral-200/50'} ${className}`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

function SkeletonBubble({ dk, type, widths }: { dk: boolean; type: 'author' | 'mine' | 'other'; widths: string[] }) {
    const isRight = type === 'mine' || type === 'author';
    
    // Match colors from ChatBubble.tsx
    const bubbleColor = type === 'author'
        ? (dk ? 'bg-gradient-to-br from-teal-900/30 to-teal-800/20 border border-teal-700/20' : 'bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100')
        : type === 'mine'
            ? (dk ? 'bg-gradient-to-br from-indigo-900/30 to-violet-900/20 border border-indigo-700/10' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100')
            : (dk ? 'bg-neutral-800/40 border border-neutral-700/30' : 'bg-white border border-neutral-200/80');

    const tailRound = isRight ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md';

    return (
        <div className={`flex gap-2.5 w-full mb-4 ${isRight ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <motion.div
                className={`shrink-0 h-9 w-9 rounded-full shadow-sm ${dk ? 'bg-neutral-800 border border-neutral-700' : 'bg-neutral-100 border border-neutral-200'}`}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
            />

            {/* Content */}
            <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                {/* Name + Time line */}
                <div className={`flex items-center gap-1.5 mb-1.5 px-1 ${isRight ? 'flex-row-reverse' : ''}`}>
                    <Pulse dk={dk} className={`h-2.5 ${type === 'author' ? 'w-24' : 'w-16'} rounded-md`} />
                    <Pulse dk={dk} className="h-2 w-8 rounded-md" />
                </div>

                {/* Bubble */}
                <div className={`${tailRound} ${bubbleColor} px-3.5 py-3 shadow-sm space-y-2`}>
                    {widths.map((w, i) => (
                        <Pulse key={i} dk={dk} className={`h-3 ${w} rounded-md`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ChatSkeleton({ dk, count = 5 }: ChatSkeletonProps) {
    const bubbles: { type: 'author' | 'mine' | 'other'; widths: string[] }[] = [
        { type: 'author', widths: ['w-48', 'w-32'] },
        { type: 'other', widths: ['w-36', 'w-52'] },
        { type: 'mine', widths: ['w-40', 'w-28', 'w-16'] },
        { type: 'other', widths: ['w-44'] },
        { type: 'author', widths: ['w-56', 'w-24'] },
    ];

    return (
        <div className="w-full">
            {bubbles.slice(0, count).map((b, i) => (
                <SkeletonBubble key={i} dk={dk} type={b.type} widths={b.widths} />
            ))}
        </div>
    );
}
