import { usePage } from '@inertiajs/react';
import { Hexagon } from 'lucide-react';

export default function AppLogo() {
    const { props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const sp = props.siteProfile || {};
    const siteName = sp['name']?.value_en || sp['name']?.value_id || 'Portfolio';
    const profilePhoto = sp['profile_photo']?.value_en || sp['profile_photo']?.value_id;

    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                {profilePhoto ? (
                    <img src={profilePhoto} alt={siteName} className="h-full w-full object-cover" />
                ) : (
                    <Hexagon className="size-5 fill-current" />
                )}
            </div>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sm text-neutral-900 dark:text-white">
                    {siteName}
                </span>
                <span className="truncate text-xs text-neutral-500">
                    Workspace
                </span>
            </div>
        </div>
    );
}
