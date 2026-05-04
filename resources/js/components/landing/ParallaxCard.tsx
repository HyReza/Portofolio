import { useRef, type ReactNode, type MouseEvent } from 'react';

interface Props {
    children: ReactNode;
    className?: string;
    glareColor?: string;
}

export function ParallaxCard({ children, className = '', glareColor = 'rgba(6,182,212,0.15)' }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
        card.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
    };

    const handleLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className={`relative overflow-hidden transition-transform duration-300 ease-out ${className}`}
            style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
            {children}
            {/* Glare overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), ${glareColor}, transparent 60%)`,
                }}
            />
        </div>
    );
}
