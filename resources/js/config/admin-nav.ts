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
        title: 'Soft Skills',
        url: '/admin/soft-skills',
        icon: 'Brain',
    },
    {
        title: 'Projects',
        url: '/admin/projects',
        icon: 'FolderKanban',
    },
    {
        title: 'Project Types',
        url: '/admin/project-types',
        icon: 'LayoutTemplate',
    },
    {
        title: 'Project Categories',
        url: '/admin/project-categories',
        icon: 'Folders',
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
        title: 'Cert. Categories',
        url: '/admin/certificate-categories',
        icon: 'Layers',
    },
    {
        title: 'Credential Types',
        url: '/admin/credential-types',
        icon: 'FileBadge',
    },
    {
        title: 'Contacts',
        url: '/admin/contacts',
        icon: 'Mail',
    },
];
