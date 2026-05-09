import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

type LayoutMode = 'sidebar' | 'topbar';

interface AppCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
    layout: LayoutMode;
    setLayout: (l: LayoutMode) => void;
    t: (en: string, id: string) => string;
    dk: boolean;
}

const Ctx = createContext<AppCtx>({} as AppCtx);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => {
        if (typeof window !== 'undefined') return (localStorage.getItem('lang') as Lang) || 'en';
        return 'en';
    });
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') return (localStorage.getItem('theme') as Theme) || 'dark';
        return 'dark';
    });
    const [layout, setLayoutState] = useState<LayoutMode>(() => {
        if (typeof window !== 'undefined') return (localStorage.getItem('layout') as LayoutMode) || 'sidebar';
        return 'sidebar';
    });

    const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem('lang', l); }, []);
    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem('theme', t);
        if (t === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    }, []);
    const setLayout = useCallback((l: LayoutMode) => { setLayoutState(l); localStorage.setItem('layout', l); }, []);

    const t = useCallback((en: string, id: string) => lang === 'id' ? id : en, [lang]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    }, [theme]);

    const dk = theme === 'dark';

    return <Ctx.Provider value={{ lang, setLang, theme, setTheme, layout, setLayout, t, dk }}>{children}</Ctx.Provider>;
}
