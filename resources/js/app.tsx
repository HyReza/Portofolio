import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { AppProvider } from '@/hooks/useApp';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Portfolio';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
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
            case name.startsWith('admin/'):
            case name === 'dashboard':
                return AppLayout;
            default:
                return null;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <AppProvider>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </AppProvider>
        );
    },
    progress: {
        color: '#06b6d4', // cyan-500
    },
});

// This will set light / dark mode on load...
initializeTheme();
