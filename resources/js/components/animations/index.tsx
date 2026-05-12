import { useRef, useEffect, type ReactNode } from 'react';
import { motion, useInView, useAnimation, type Variant } from 'framer-motion';
import gsap from 'gsap';

/* ── Framer Motion Reveals ── */

interface RevealProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
}

const fadeUp = { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } };
const fadeLeft = { hidden: { opacity: 0, x: 80 }, visible: { opacity: 1, x: 0 } };
const fadeRight = { hidden: { opacity: 0, x: -80 }, visible: { opacity: 1, x: 0 } };
const scaleIn = { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } };
const blurIn = { hidden: { opacity: 0, filter: 'blur(10px)' }, visible: { opacity: 1, filter: 'blur(0px)' } };

export function FadeUp({ children, delay = 0, duration = 0.8, className = '', once = true }: RevealProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once, margin: '-50px' });
    return <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={fadeUp} transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }} className={className}>{children}</motion.div>;
}

export function FadeLeft({ children, delay = 0, duration = 0.8, className = '' }: RevealProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={fadeLeft} transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }} className={className}>{children}</motion.div>;
}

export function FadeRight({ children, delay = 0, duration = 0.8, className = '' }: RevealProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={fadeRight} transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }} className={className}>{children}</motion.div>;
}

export function ScaleIn({ children, delay = 0, duration = 0.8, className = '' }: RevealProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={scaleIn} transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }} className={className}>{children}</motion.div>;
}

export function BlurIn({ children, delay = 0, duration = 1, className = '' }: RevealProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    return <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={blurIn} transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }} className={className}>{children}</motion.div>;
}

/* ── GSAP Text Split Reveal ── */
export function TextReveal({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Split into words then chars
        const text = el.innerText;
        el.innerHTML = '';
        text.split(' ').forEach((word, wi) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.overflow = 'hidden';
            word.split('').forEach(char => {
                const charSpan = document.createElement('span');
                charSpan.innerText = char;
                charSpan.style.display = 'inline-block';
                charSpan.style.transform = 'translateY(120%)';
                charSpan.style.opacity = '0';
                charSpan.className = 'char-reveal';
                wordSpan.appendChild(charSpan);
            });
            el.appendChild(wordSpan);
            if (wi < text.split(' ').length - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                space.style.display = 'inline-block';
                el.appendChild(space);
            }
        });

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                const chars = el.querySelectorAll('.char-reveal');
                gsap.to(chars, {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.02,
                    delay,
                    ease: 'power3.out',
                });
                observer.disconnect();
            }
        }, { threshold: 0.3 });

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return <div ref={ref} className={className}>{children}</div>;
}

/* ── Magnetic Button ── */
export function MagneticButton({ children, className = '' }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
        };
        const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);
        return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
    }, []);

    return <div ref={ref} className={`inline-block ${className}`}>{children}</div>;
}

/* ── Parallax element ── */
export function Parallax({ children, speed = 0.5, className = '' }: { children: ReactNode; speed?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onScroll = () => {
            const rect = el.getBoundingClientRect();
            const scrolled = window.innerHeight - rect.top;
            if (scrolled > 0) {
                gsap.set(el, { y: scrolled * speed * -0.1 });
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [speed]);

    return <div ref={ref} className={className}>{children}</div>;
}

/* ── Stagger children ── */
export function StaggerChildren({ children, className = '', stagger = 0.1 }: { children: ReactNode; className?: string; stagger?: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-30px' });
    return (
        <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
            className={className}>
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }} className={className}>
            {children}
        </motion.div>
    );
}

/* ── Image Reveal (clip-path animation) ── */
export function ImageReveal({ src, alt = '', className = '' }: { src: string; alt?: string; className?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className={`overflow-hidden block relative ${className}`}
        >
            <motion.img 
                src={src} 
                alt={alt} 
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
                className="block absolute inset-0 h-full w-full object-cover" 
            />
        </motion.div>
    );
}

/* ── Horizontal Scroll Section ── */
export function HorizontalScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const scroll = scrollRef.current;
        if (!container || !scroll) return;

        const onScroll = () => {
            const rect = container.getBoundingClientRect();
            const scrollWidth = scroll.scrollWidth - window.innerWidth;
            const progress = Math.max(0, Math.min(1, -rect.top / (container.offsetHeight - window.innerHeight)));
            gsap.set(scroll, { x: -progress * scrollWidth });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div ref={containerRef} className={className} style={{ height: '300vh' }}>
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                <div ref={scrollRef} className="flex gap-8 pl-8 will-change-transform">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ── Marquee ── */
export function Marquee({ children, speed = 30, className = '' }: { children: ReactNode; speed?: number; className?: string }) {
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.div className="flex gap-8 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}>
                {children}
                {children}
            </motion.div>
        </div>
    );
}
