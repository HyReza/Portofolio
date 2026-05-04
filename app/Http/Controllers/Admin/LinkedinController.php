<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LinkedinPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LinkedinController extends Controller
{
    public function index(): Response
    {
        $stats = \App\Models\Profile::whereIn('key', ['li_username', 'li_bio'])
            ->get()
            ->pluck('value_en', 'key');

        return Inertia::render('admin/linkedin/index', [
            'posts' => LinkedinPost::orderByDesc('published_at')->get(),
            'li_stats' => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'post_url'       => ['required', 'url', 'max:500'],
            'title'          => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'thumbnail'      => ['nullable', 'string', 'max:1000'],
            'likes_count'    => ['nullable', 'integer', 'min:0'],
            'comments_count' => ['nullable', 'integer', 'min:0'],
            'published_at'   => ['nullable', 'date'],
            'is_active'      => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        LinkedinPost::create($validated);

        return back()->with('success', 'LinkedIn post added.');
    }

    public function update(Request $request, LinkedinPost $linkedin): RedirectResponse
    {
        $validated = $request->validate([
            'post_url'       => ['required', 'url', 'max:500'],
            'title'          => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string', 'max:1000'],
            'thumbnail'      => ['nullable', 'string', 'max:1000'],
            'likes_count'    => ['nullable', 'integer', 'min:0'],
            'comments_count' => ['nullable', 'integer', 'min:0'],
            'published_at'   => ['nullable', 'date'],
            'is_active'      => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $linkedin->update($validated);

        return back()->with('success', 'LinkedIn post updated.');
    }

    public function destroy(LinkedinPost $linkedin): RedirectResponse
    {
        $linkedin->delete();
        return back()->with('success', 'LinkedIn post deleted.');
    }
}
