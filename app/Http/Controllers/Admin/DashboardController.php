<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Blog;
use App\Models\Certificate;
use App\Models\Contact;
use App\Models\Project;
use App\Models\Skill;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'projects' => Project::count(),
            'blogs' => Blog::count(),
            'certificates' => Certificate::count(),
            'contacts' => Contact::count(),
            'achievements' => Achievement::count(),
            'skills' => Skill::count(),
            'published_blogs' => Blog::published()->count(),
            'featured_projects' => Project::where('is_featured', true)->count(),
            'total_blog_views' => Blog::sum('view_count'),
            'unread_contacts' => Contact::where('is_read', false)->count(),
        ];

        $recentActivity = collect()
            ->merge(
                Blog::latest()->limit(3)->get()->map(fn ($b) => [
                    'type' => 'blog', 'title' => $b->title_en ?: $b->title_id,
                    'date' => $b->created_at->toISOString(), 'status' => $b->status,
                ])
            )
            ->merge(
                Project::latest()->limit(3)->get()->map(fn ($p) => [
                    'type' => 'project', 'title' => $p->title_en ?: $p->title_id,
                    'date' => $p->created_at->toISOString(), 'status' => $p->status,
                ])
            )
            ->merge(
                Contact::latest()->limit(3)->get()->map(fn ($c) => [
                    'type' => 'contact', 'title' => $c->subject ?: $c->name,
                    'date' => $c->created_at->toISOString(), 'status' => $c->is_read ? 'read' : 'unread',
                ])
            )
            ->sortByDesc('date')
            ->take(8)
            ->values();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
        ]);
    }
}
