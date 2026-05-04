import { useEffect, useState } from 'react';

interface Props {
    name: string | null | undefined;
    className?: string;
}

export function ReactIconRender({ name, className = "h-5 w-5" }: Props) {
    const [Icon, setIcon] = useState<any>(null);

    useEffect(() => {
        if (!name || name.length < 3) {
            setIcon(null);
            return;
        }

        let isMounted = true;

        const loadIcon = async () => {
            try {
                // Determine prefix (e.g. 'Fa' -> 'fa', 'Si' -> 'si')
                // Note: vsc icons start with Vsc, hi2 starts with Hi
                let prefix = name.substring(0, 2).toLowerCase();
                if (name.startsWith('Vsc')) prefix = 'vsc';
                if (name.startsWith('Hi') && name.length > 2 && name[2] !== name[2].toLowerCase()) prefix = 'hi'; 
                // There are edge cases like Io5 vs Io, but we'll try the basic ones first.
                if (name.startsWith('Io5')) prefix = 'io5';
                else if (name.startsWith('Io')) prefix = 'io';
                
                if (name.startsWith('Hi2')) prefix = 'hi2';

                let pack: any;
                switch (prefix) {
                    case 'fa': pack = await import('react-icons/fa'); break;
                    case 'si': pack = await import('react-icons/si'); break;
                    case 'di': pack = await import('react-icons/di'); break;
                    case 'fi': pack = await import('react-icons/fi'); break;
                    case 'md': pack = await import('react-icons/md'); break;
                    case 'bi': pack = await import('react-icons/bi'); break;
                    case 'bs': pack = await import('react-icons/bs'); break;
                    case 'cg': pack = await import('react-icons/cg'); break;
                    case 'ci': pack = await import('react-icons/ci'); break;
                    case 'fc': pack = await import('react-icons/fc'); break;
                    case 'gi': pack = await import('react-icons/gi'); break;
                    case 'go': pack = await import('react-icons/go'); break;
                    case 'gr': pack = await import('react-icons/gr'); break;
                    case 'hi': pack = await import('react-icons/hi'); break;
                    case 'hi2': pack = await import('react-icons/hi2'); break;
                    case 'im': pack = await import('react-icons/im'); break;
                    case 'io': pack = await import('react-icons/io'); break;
                    case 'io5': pack = await import('react-icons/io5'); break;
                    case 'lia': pack = await import('react-icons/lia'); break;
                    case 'lu': pack = await import('react-icons/lu'); break;
                    case 'md': pack = await import('react-icons/md'); break;
                    case 'pi': pack = await import('react-icons/pi'); break;
                    case 'ri': pack = await import('react-icons/ri'); break;
                    case 'rx': pack = await import('react-icons/rx'); break;
                    case 'sl': pack = await import('react-icons/sl'); break;
                    case 'tb': pack = await import('react-icons/tb'); break;
                    case 'tfi': pack = await import('react-icons/tfi'); break;
                    case 'ti': pack = await import('react-icons/ti'); break;
                    case 'vsc': pack = await import('react-icons/vsc'); break;
                    case 'wi': pack = await import('react-icons/wi'); break;
                    default: 
                        if (isMounted) setIcon(null); 
                        return;
                }

                if (isMounted) {
                    if (pack && pack[name]) {
                        setIcon(() => pack[name]);
                    } else {
                        setIcon(null);
                    }
                }
            } catch (e) {
                if (isMounted) setIcon(null);
            }
        };

        loadIcon();

        return () => {
            isMounted = false;
        };
    }, [name]);

    if (!Icon) {
        return (
            <div className={`flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-mono text-[10px] ${className}`}>
                ?
            </div>
        );
    }

    return <Icon className={className} />;
}
