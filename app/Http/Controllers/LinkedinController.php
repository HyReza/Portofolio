<?php

namespace App\Http\Controllers;

use App\Models\LinkedinPost;
use App\Models\Profile;
use Inertia\Inertia;

class LinkedinController extends Controller
{
    public function index()
    {
        $posts = LinkedinPost::where('is_active', true)
            ->orderByDesc('published_at')
            ->get();

        $stats = Profile::whereIn('key', ['li_username', 'li_bio'])
            ->get()
            ->pluck('value_en', 'key');

        return Inertia::render('public/linkedin', [
            'posts' => $posts,
            'li_stats' => $stats,
        ]);
    }
}
