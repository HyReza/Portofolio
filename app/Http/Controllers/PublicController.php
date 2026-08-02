<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\Blog;
use App\Models\Career;
use App\Models\Certificate;
use App\Models\CertificateCategory;
use App\Models\CredentialType;
use App\Models\Education;
use App\Models\Organization;
use App\Models\Profile;
use App\Models\Project;
use App\Models\ProjectCategory;
use App\Models\ProjectTechnology;
use App\Models\ProjectType;
use App\Models\SkillCategory;
use App\Models\SoftSkill;
use App\Models\Testimonial;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    private function profiles()
    {
        return Profile::ordered()->get()->keyBy('key');
    }

    public function about(): Response
    {
        return Inertia::render('public/about', [
            'profiles' => $this->profiles(),
            'educations' => Education::chronological()->get(),
            'careers' => Career::with('children')->roots()->chronological()->get(),
            'organizations' => Organization::ordered()->get(),
            'skillCategories' => SkillCategory::withOrderedSkills()->ordered()->get(),
            'softSkills' => SoftSkill::ordered()->get(),
            'achievements' => Achievement::ordered()->get(),
        ]);
    }

    public function projects(): Response
    {
        return Inertia::render('public/projects', [
            'projects' => Project::with(['seoMeta', 'technologies', 'types', 'categories'])->latestPublished()->get(),
            'allTypes' => ProjectType::all(),
            'allCategories' => ProjectCategory::all(),
            'allTechnologies' => ProjectTechnology::all(),
        ]);
    }

    public function projectShow(Project $project): Response
    {
        $project->load('seoMeta');

        // Get related projects (same tech stack overlap)
        $related = Project::with('seoMeta')->published()
            ->where('id', '!=', $project->id)
            ->limit(3)
            ->get();

        return Inertia::render('public/project-show', [
            'project' => $project,
            'related' => $related,
        ]);
    }

    public function blog(): Response
    {
        $bookmarkedIds = [];
        $likedIds = [];
        if (auth()->check()) {
            $bookmarkedIds = auth()->user()->bookmarks()->pluck('blog_id')->toArray();
            $likedIds = auth()->user()->likes()->pluck('blog_id')->toArray();
        }

        return Inertia::render('public/blog', [
            'blogs' => Blog::with(['tags', 'seoMeta'])
                ->withCount(['comments', 'bookmarks', 'likes'])
                ->latestPublished()
                ->paginate(12),
            'bookmarkedIds' => $bookmarkedIds,
            'likedIds' => $likedIds,
        ]);
    }

    public function blogShow(Blog $blog): Response
    {
        $blog->incrementViewCount();
        $blog->load(['tags', 'seoMeta']);
        $blog->loadCount(['comments', 'bookmarks', 'likes']);

        $isBookmarked = false;
        $isLiked = false;
        if (auth()->check()) {
            $isBookmarked = $blog->bookmarks()->where('user_id', auth()->id())->exists();
            $isLiked = $blog->likes()->where('user_id', auth()->id())->exists();
        }

        // Get related articles by shared tags
        $tagIds = $blog->tags->pluck('id');
        $related = Blog::with(['tags', 'seoMeta'])
            ->withCount(['comments', 'bookmarks', 'likes'])
            ->published()
            ->where('id', '!=', $blog->id)
            ->when($tagIds->isNotEmpty(), function ($q) use ($tagIds) {
                $q->whereHas('tags', fn ($q2) => $q2->whereIn('blog_tags.id', $tagIds));
            })
            ->limit(3)
            ->get();

        return Inertia::render('public/blog-show', [
            'blog' => $blog,
            'related' => $related,
            'isBookmarked' => $isBookmarked,
            'isLiked' => $isLiked,
        ]);
    }

    public function certificates(): Response
    {
        return Inertia::render('public/certificates', [
            'certificates' => Certificate::with(['categories', 'credentialTypes'])->ordered()->get(),
            'allCategories' => CertificateCategory::all(),
            'allCredentialTypes' => CredentialType::all(),
        ]);
    }

    public function testimonials(): Response
    {
        return Inertia::render('public/testimonials', [
            'testimonials' => Testimonial::ordered()->get(),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('public/contact', [
            'profiles' => $this->profiles(),
        ]);
    }

    public function badges(): Response
    {
        return Inertia::render('public/badges');
    }
}
