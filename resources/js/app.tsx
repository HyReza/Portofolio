import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { AppProvider } from '@/hooks/useApp';
import { AchievementProvider } from '@/hooks/useGimmicks';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Portfolio';

createInertiaApp({
    title: (title) => title || appName,
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'home':
            case name.startsWith('public/'):
                return null; // These pages use PublicLayout internally
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            // admin/* and dashboard pages wrap themselves in <AppLayout> explicitly
            // to pass per-page breadcrumbs — do NOT double-wrap here
            default:
                return null;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <AppProvider>
                <AchievementProvider>
                    <TooltipProvider delayDuration={0}>
                        {app}
                        <Toaster />
                    </TooltipProvider>
                </AchievementProvider>
            </AppProvider>
        );
    },
    progress: {
        color: '#06b6d4', // cyan-500
    },
});

// This will set light / dark mode on load...
initializeTheme();
