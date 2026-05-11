import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:border-neutral-800/80 dark:bg-neutral-950/80">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200" />
                {breadcrumbs.length > 0 && (
                    <>
                        <Separator orientation="vertical" className="h-5 bg-neutral-200 dark:bg-neutral-700" />
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </>
                )}
            </div>
        </header>
    );
}
