<?php

namespace App\Http\Controllers;

use App\Models\InstagramPost;
use App\Models\Profile;
use Inertia\Inertia;

class InstagramController extends Controller
{
    public function index()
    {
        $posts = InstagramPost::where('is_active', true)
            ->orderByDesc('published_at')
            ->get();

        $stats = Profile::whereIn('key', ['ig_followers', 'ig_following', 'ig_posts', 'ig_avatar', 'avatar', 'ig_username', 'ig_bio'])
            ->get()
            ->pluck('value_en', 'key');

        return Inertia::render('public/instagram', [
            'posts' => $posts,
            'ig_stats' => $stats,
        ]);
    }
}
