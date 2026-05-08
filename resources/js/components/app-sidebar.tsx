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
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild variant="outline" className="mt-2">
                            <Link href="/">
                                <Zap className="h-4 w-4 text-orange-500" />
                                <span>View Website</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="space-y-4">
                <NavMain title="Main" items={mainNavItems} />
                <NavMain title="Personal" items={personalNavItems} />
                <NavMain title="Portfolio" items={contentNavItems} />
                <NavMain title="Social Media" items={socialNavItems} />
                <NavMain title="Inbox" items={inboxNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
