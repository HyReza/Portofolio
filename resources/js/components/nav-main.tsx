import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ title, items = [] }: { title?: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
            {title && (
                <SidebarGroupLabel className="mb-0 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 transition-colors group-data-[collapsible=icon]:hidden">
                    {title}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-0.5">
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={`group h-8 w-full overflow-hidden rounded-md transition-colors ${
                                    active
                                        ? 'bg-neutral-200/50 text-neutral-900 font-medium dark:bg-neutral-800/80 dark:text-neutral-50'
                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200'
                                }`}
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-2">
                                    {item.icon && (
                                        <item.icon
                                            className={`size-4 shrink-0 transition-colors ${
                                                active
                                                    ? 'text-neutral-900 dark:text-neutral-100'
                                                    : 'text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-300'
                                            }`}
                                        />
                                    )}
                                    <span className="truncate group-data-[collapsible=icon]:hidden text-[13px]">{item.title}</span>
                                    
                                    {active && (
                                         <div className="ml-auto hidden size-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 group-data-[collapsible=icon]:block" />
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
