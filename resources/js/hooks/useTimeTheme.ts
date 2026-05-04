import { useMemo } from 'react';

type TimeTheme = {
    period: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
    greeting: string;
    greetingId: string;
    emoji: string;
    accent: string;        // primary accent
    accentRgb: string;     // for rgba usage
    gradientFrom: string;
    gradientTo: string;
    heroGlow: string;
    particleColor: string;
};

const themes: Record<string, TimeTheme> = {
    dawn: {
        period: 'dawn',
        greeting: 'Good Morning, Early Bird',
        greetingId: 'Selamat Pagi, Si Rajin',
        emoji: '🌅',
        accent: '#f59e0b',
        accentRgb: '245,158,11',
        gradientFrom: '#f59e0b',
        gradientTo: '#f97316',
        heroGlow: 'rgba(245,158,11,0.08)',
        particleColor: 'rgba(245,158,11,0.3)',
    },
    morning: {
        period: 'morning',
        greeting: 'Good Morning',
        greetingId: 'Selamat Pagi',
        emoji: '☀️',
        accent: '#06b6d4',
        accentRgb: '6,182,212',
        gradientFrom: '#06b6d4',
        gradientTo: '#14b8a6',
        heroGlow: 'rgba(6,182,212,0.08)',
        particleColor: 'rgba(6,182,212,0.3)',
    },
    afternoon: {
        period: 'afternoon',
        greeting: 'Good Afternoon',
        greetingId: 'Selamat Siang',
        emoji: '🌤️',
        accent: '#0ea5e9',
        accentRgb: '14,165,233',
        gradientFrom: '#0ea5e9',
        gradientTo: '#06b6d4',
        heroGlow: 'rgba(14,165,233,0.08)',
        particleColor: 'rgba(14,165,233,0.3)',
    },
    evening: {
        period: 'evening',
        greeting: 'Good Evening',
        greetingId: 'Selamat Sore',
        emoji: '🌆',
        accent: '#a855f7',
        accentRgb: '168,85,247',
        gradientFrom: '#a855f7',
        gradientTo: '#ec4899',
        heroGlow: 'rgba(168,85,247,0.08)',
        particleColor: 'rgba(168,85,247,0.3)',
    },
    night: {
        period: 'night',
        greeting: 'Good Night',
        greetingId: 'Selamat Malam',
        emoji: '🌙',
        accent: '#6366f1',
        accentRgb: '99,102,241',
        gradientFrom: '#6366f1',
        gradientTo: '#8b5cf6',
        heroGlow: 'rgba(99,102,241,0.08)',
        particleColor: 'rgba(99,102,241,0.3)',
    },
};

export function useTimeTheme(): TimeTheme {
    return useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 7) return themes.dawn;
        if (hour >= 7 && hour < 12) return themes.morning;
        if (hour >= 12 && hour < 16) return themes.afternoon;
        if (hour >= 16 && hour < 19) return themes.evening;
        return themes.night;
    }, []);
}
