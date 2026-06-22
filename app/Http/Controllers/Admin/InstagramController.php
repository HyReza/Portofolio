<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InstagramPost;
use App\Models\Profile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstagramController extends Controller
{
    public function index(): Response
    {
        $stats = Profile::whereIn('key', ['ig_followers', 'ig_following', 'ig_posts', 'ig_avatar', 'ig_bio', 'ig_username'])
            ->get()
            ->pluck('value_en', 'key');

        return Inertia::render('admin/instagram/index', [
            'posts' => InstagramPost::orderByDesc('published_at')->get(),
            'ig_stats' => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'post_url' => ['required', 'url', 'max:500'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'thumbnail' => ['nullable', 'string', 'max:1000'],
            'likes_count' => ['nullable', 'integer', 'min:0'],
            'media_type' => ['nullable', 'in:IMAGE,VIDEO,CAROUSEL_ALBUM'],
            'published_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        InstagramPost::create($validated);

        return back()->with('success', 'Instagram post added.');
    }

    public function update(Request $request, InstagramPost $instagram): RedirectResponse
    {
        $validated = $request->validate([
            'post_url' => ['required', 'url', 'max:500'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'thumbnail' => ['nullable', 'string', 'max:1000'],
            'likes_count' => ['nullable', 'integer', 'min:0'],
            'media_type' => ['nullable', 'in:IMAGE,VIDEO,CAROUSEL_ALBUM'],
            'published_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $instagram->update($validated);

        return back()->with('success', 'Instagram post updated.');
    }

    public function destroy(InstagramPost $instagram): RedirectResponse
    {
        $instagram->delete();

        return back()->with('success', 'Instagram post deleted.');
    }
}
