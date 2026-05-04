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
        <SidebarGroup className="px-2 py-0">
            {title && <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{title}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => {
                    const active = isCurrentUrl(item.href);
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={`transition-all duration-200 ${
                                    active 
                                    ? 'bg-neutral-100 font-medium text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100' 
                                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200'
                                }`}
                            >
                                <Link href={item.href} prefetch className="flex items-center gap-3">
                                    {item.icon && <item.icon className={`h-4 w-4 ${active ? 'text-indigo-500' : 'text-neutral-500'}`} />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
