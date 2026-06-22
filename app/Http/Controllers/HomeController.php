<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SkillCategory;
use App\Models\SoftSkill;
use App\Models\Testimonial;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('home', [
            'profiles' => Profile::ordered()->get()->keyBy('key'),
            'testimonials' => Testimonial::ordered()->get(),
            'skillCategories' => SkillCategory::withOrderedSkills()->ordered()->limit(6)->get(),
            'softSkills' => SoftSkill::ordered()->get(),
            'projects' => Project::with('seoMeta')->published()->featured()->orderByDesc('published_at')->limit(3)->get(),
            'blogs' => Blog::with(['tags', 'seoMeta'])->latestPublished()->limit(3)->get(),
        ]);
    }
}
