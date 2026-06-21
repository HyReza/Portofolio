import { Link } from '@inertiajs/react';
import {
    Award, FileText, FolderKanban, GitBranch, GraduationCap,
    LayoutDashboard, Linkedin, Instagram, Mail, MessageSquare,
    Settings, Trophy, User, Users, Zap, Tag, ExternalLink,
    Layers, Cpu, Brain, LayoutTemplate, Folders, FileBadge, Sparkles
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const overviewNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Profile', href: '/admin/profile', icon: User },
];

const portfolioNavItems: NavItem[] = [
    { title: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { title: 'Project Types', href: '/admin/project-types', icon: LayoutTemplate },
    { title: 'Project Categories', href: '/admin/project-categories', icon: Folders },
    { title: 'Technologies', href: '/admin/technologies', icon: Cpu },
    { title: 'Skills', href: '/admin/skills', icon: Zap },
    { title: 'Soft Skills', href: '/admin/soft-skills', icon: Brain },
    { title: 'Tags', href: '/admin/tags', icon: Tag },
];

const resumeNavItems: NavItem[] = [
    { title: 'CV Generator', href: '/admin/cv-generator', icon: Sparkles },
    { title: 'Experience', href: '/admin/careers', icon: GitBranch },
    { title: 'Education', href: '/admin/education', icon: GraduationCap },
    { title: 'Organizations', href: '/admin/organizations', icon: Users },
    { title: 'Certificates', href: '/admin/certificates', icon: Award },
    { title: 'Cert. Categories', href: '/admin/certificate-categories', icon: Layers },
    { title: 'Credential Types', href: '/admin/credential-types', icon: FileBadge },
    { title: 'Achievements', href: '/admin/achievements', icon: Trophy },
];

const contentNavItems: NavItem[] = [
    { title: 'Blog', href: '/admin/blogs', icon: FileText },
    { title: 'Messages', href: '/admin/contacts', icon: Mail },
    { title: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
];

const systemNavItems: NavItem[] = [
    { title: 'Settings', href: '/admin/settings', icon: Settings },
    { title: 'LinkedIn', href: '/admin/linkedin', icon: Linkedin },
    { title: 'Instagram', href: '/admin/instagram', icon: Instagram },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-neutral-50/50 dark:bg-[#111111]">
            <SidebarHeader className="p-2 border-b border-transparent">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden space-y-2 group-data-[collapsible=icon]:space-y-0">
                <NavMain items={overviewNavItems} />
                <NavMain title="Portfolio" items={portfolioNavItems} />
                <NavMain title="Resume" items={resumeNavItems} />
                <NavMain title="Content" items={contentNavItems} />
                <NavMain title="System" items={systemNavItems} />
            </SidebarContent>

            <SidebarFooter className="p-2 border-t border-transparent space-y-2">
                {/* Minimalist Live Site Button */}
                <div className="group-data-[collapsible=icon]:hidden px-2 mb-1">
                    <Link
                        href="/"
                        target="_blank"
                        className="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Live Website
                    </Link>
                </div>
                {/* Icon mode live site button */}
                <div className="hidden group-data-[collapsible=icon]:flex w-full justify-center mb-1">
                    <Link
                        href="/"
                        target="_blank"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:hover:text-white"
                        title="Live Website"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </div>

                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
