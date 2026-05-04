<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\Organization;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SkillCategory;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('home', [
            'profiles' => Profile::ordered()->get()->keyBy('key'),
            'organizations' => Organization::ordered()->get(),
            'skillCategories' => SkillCategory::withOrderedSkills()->ordered()->limit(6)->get(),
            'projects' => Project::published()->featured()->orderByDesc('published_at')->limit(3)->get(),
            'blogs' => Blog::with('tags')->latestPublished()->limit(3)->get(),
        ]);
    }
}
