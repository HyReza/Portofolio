import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-neutral-50/30 dark:bg-[#0a0a0a]">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <main className="flex flex-1 flex-col">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8">
                         {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
