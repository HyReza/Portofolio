import { Link } from '@inertiajs/react';
import {
    Award, FileText, FolderKanban, GitBranch, GraduationCap,
    LayoutDashboard, Linkedin, Instagram, Mail, MessageCircle, MessageSquare,
    Settings, Trophy, User, Users, Zap, Tag,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
];

const personalNavItems: NavItem[] = [
    { title: 'Profile', href: '/admin/profile', icon: User },
    { title: 'Education', href: '/admin/education', icon: GraduationCap },
    { title: 'Careers', href: '/admin/careers', icon: GitBranch },
    { title: 'Organizations', href: '/admin/organizations', icon: Users },
];

const contentNavItems: NavItem[] = [
    { title: 'Skills', href: '/admin/skills', icon: Zap },
    { title: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { title: 'Blog', href: '/admin/blogs', icon: FileText },
    { title: 'Tags', href: '/admin/tags', icon: Tag },
    { title: 'Achievements', href: '/admin/achievements', icon: Trophy },
    { title: 'Certificates', href: '/admin/certificates', icon: Award },
    { title: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
];

const socialNavItems: NavItem[] = [
    { title: 'LinkedIn', href: '/admin/linkedin', icon: Linkedin },
    { title: 'Instagram', href: '/admin/instagram', icon: Instagram },
];

const inboxNavItems: NavItem[] = [
    { title: 'Contacts', href: '/admin/contacts', icon: Mail },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-r-0 shadow-none">
            <SidebarHeader className="pt-6 px-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="mt-4">
                        <SidebarMenuButton asChild variant="default" className="bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white shadow-md transition-all duration-200 h-10">
                            <Link href="/" target="_blank">
                                <Zap className="h-4 w-4" />
                                <span className="font-semibold">Live Website</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 mt-4 custom-scrollbar">
                <div className="space-y-6">
                    <NavMain title="Core" items={mainNavItems} />
                    <NavMain title="Personal" items={personalNavItems} />
                    <NavMain title="Content Management" items={contentNavItems} />
                    <NavMain title="Engagement" items={inboxNavItems} />
                    <NavMain title="Socials" items={socialNavItems} />
                </div>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
