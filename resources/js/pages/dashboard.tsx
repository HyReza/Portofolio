import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BarChart3, Eye, FileText, FolderKanban, Mail, MailOpen, Trophy, Zap, Award, Plus, ArrowUpRight, Clock, Download, ExternalLink, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MdVerified } from 'react-icons/md';

interface Stats {
    projects: number;
    blogs: number;
    certificates: number;
    contacts: number;
    achievements: number;
    skills: number;
    published_blogs: number;
    featured_projects: number;
    total_blog_views: number;
    unread_contacts: number;
}

interface Activity {
    type: string;
    title: string;
    date: string;
    status: string;
}

interface DashboardProps {
    stats: Stats;
    recentActivity: Activity[];
}

export default function Dashboard({ stats, recentActivity }: DashboardProps) {
    const { props } = usePage<{ siteProfile?: Record<string, { value_id: string | null; value_en: string | null }> }>();
    const sp = props.siteProfile || {};
    const pv = (key: string) => sp[key]?.value_en || sp[key]?.value_id || '';
    const profilePhoto = pv('profile_photo') || '/assets/img/profil.jpeg';
    const profileName = pv('name') || 'Reza Edi Saputra';
    const profileTitle = pv('title') || 'Software Engineer';
    const profileBio = pv('about_short') || pv('bio') || '';
    const profileUsername = pv('username') || 'rezaedisaputra';

    const statCards = [
        { label: 'Projects', value: stats.projects, sub: `${stats.featured_projects} featured`, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Blog Posts', value: stats.blogs, sub: `${stats.published_blogs} published`, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Blog Views', value: stats.total_blog_views, sub: 'total views', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Skills', value: stats.skills, sub: 'total skills', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Certificates', value: stats.certificates, sub: 'credentials', icon: Award, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
        { label: 'Inbox', value: stats.contacts, sub: `${stats.unread_contacts} unread`, icon: Mail, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    ];

    const quickActions = [
        { label: 'New Blog Post', href: '/admin/blogs/create', icon: FileText },
        { label: 'New Project', href: '/admin/projects/create', icon: FolderKanban },
        { label: 'Manage Skills', href: '/admin/skills', icon: Zap },
        { label: 'Edit Profile', href: '/admin/profile', icon: BarChart3 },
    ];

    const activityIcon: Record<string, any> = { blog: FileText, project: FolderKanban, contact: Mail };
    const activityColor: Record<string, string> = { blog: 'text-emerald-500', project: 'text-blue-500', contact: 'text-rose-500' };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/admin' }]}>
            <Head title="Admin Dashboard" />
            <div className="space-y-4 sm:space-y-8 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Overview of your portfolio content and analytics.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-1.5 h-3.5 w-3.5" />
                                    Download CV
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white dark:bg-[#121212] border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold font-sora">Download CV</DialogTitle>
                                    <DialogDescription className="text-neutral-500 dark:text-neutral-400 mt-1">
                                        Please select the language version you prefer.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                                    <a href="/cv/en" target="_blank" rel="noopener" className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all group">
                                        <span className="text-4xl mb-3 transition-transform group-hover:scale-110">🇺🇸</span>
                                        <span className="font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">English</span>
                                        <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">International</span>
                                    </a>
                                    <a href="/cv/id" target="_blank" rel="noopener" className="flex flex-col items-center justify-center p-6 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all group">
                                        <span className="text-4xl mb-3 transition-transform group-hover:scale-110">🇮🇩</span>
                                        <span className="font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Indonesia</span>
                                        <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Bahasa</span>
                                    </a>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>


                {/* Stat Cards */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {statCards.map((card) => (
                        <Card key={card.label} className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                                        <card.icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                </div>
                                <p className="mt-2 text-2xl font-bold">{card.value.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                    {/* Quick Actions */}
                    <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {quickActions.map((action) => (
                                <Link key={action.href} href={action.href} className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                        <action.icon className="h-4 w-4" />
                                    </div>
                                    {action.label}
                                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-neutral-400" />
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
                        <CardContent>
                            {recentActivity.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-6 text-center">No recent activity.</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivity.map((item, i) => {
                                        const Icon = activityIcon[item.type] || FileText;
                                        return (
                                            <div key={i} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 ${activityColor[item.type] || ''}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className={`text-[10px] ${item.status === 'published' || item.status === 'read' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
