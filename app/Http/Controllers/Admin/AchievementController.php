<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AchievementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/achievements/index', [
            'achievements' => Achievement::ordered()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title_id' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'date' => ['nullable', 'date'],
            'type' => ['required', 'in:academic,professional,award'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        Achievement::create($validated);

        return back()->with('success', 'Achievement added.');
    }

    public function update(Request $request, Achievement $achievement): RedirectResponse
    {
        $validated = $request->validate([
            'title_id' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'date' => ['nullable', 'date'],
            'type' => ['required', 'in:academic,professional,award'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        $achievement->update($validated);

        return back()->with('success', 'Achievement updated.');
    }

    public function destroy(Achievement $achievement): RedirectResponse
    {
        $achievement->seoMeta?->delete();
        $achievement->delete();

        return back()->with('success', 'Achievement deleted.');
    }
}
