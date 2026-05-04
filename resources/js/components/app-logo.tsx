import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const sp = props.siteProfile || {};
    const siteName = sp['name']?.value_en || sp['name']?.value_id || 'Portfolio';
    const profilePhoto = sp['profile_photo']?.value_en || sp['profile_photo']?.value_id;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {profilePhoto ? (
                    <img src={profilePhoto} alt={siteName} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-xs font-bold text-white dark:text-black">{siteName.charAt(0).toUpperCase()}</span>
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {siteName}
                </span>
            </div>
        </>
    );
}

