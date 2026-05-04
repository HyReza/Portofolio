interface GlassIconProps {
    name: string;
    icon: React.ReactNode;
    background: string;
}

export function GlassIcon({ name, icon, background }: GlassIconProps) {
    return (
        <button
            type="button"
            aria-label={name}
            className="glass-icon-btn group relative h-[2.6em] w-[2.6em] bg-transparent outline-none md:h-[3em] md:w-[3em]"
        >
            {/* Colored background layer */}
            <span
                className={`glass-icon-bg absolute left-0 top-0 block h-full w-full rotate-[15deg] rounded-[1.25em] ${background}`}
            />
            {/* Frosted glass front layer */}
            <span className="glass-icon-front absolute left-0 top-0 flex h-full w-full rounded-[1.25em] bg-[hsla(0,0%,100%,0.15)]">
                <span className="m-auto flex h-[1.5em] w-[1.5em] items-center justify-center" aria-hidden="true">
                    {icon}
                </span>
            </span>
            {/* Label */}
            <span className="glass-icon-label absolute left-0 right-0 top-full translate-y-0 whitespace-nowrap text-center text-sm leading-[2] opacity-0">
                {name}
            </span>
        </button>
    );
}
