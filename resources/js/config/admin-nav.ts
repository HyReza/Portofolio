import type { NavItem } from '@/types/navigation';

// Admin sidebar navigation items
export const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/admin',
        icon: 'LayoutDashboard',
    },
    {
        title: 'Profile',
        url: '/admin/profile',
        icon: 'User',
    },
    {
        title: 'Education',
        url: '/admin/education',
        icon: 'GraduationCap',
    },
    {
        title: 'Careers',
        url: '/admin/careers',
        icon: 'GitBranch',
    },
    {
        title: 'Skills',
        url: '/admin/skills',
        icon: 'Zap',
    },
    {
        title: 'Projects',
        url: '/admin/projects',
        icon: 'FolderKanban',
    },
    {
        title: 'Blog',
        url: '/admin/blogs',
        icon: 'FileText',
    },
    {
        title: 'Achievements',
        url: '/admin/achievements',
        icon: 'Trophy',
    },
    {
        title: 'Certificates',
        url: '/admin/certificates',
        icon: 'Award',
    },
    {
        title: 'Contacts',
        url: '/admin/contacts',
        icon: 'Mail',
    },
];
