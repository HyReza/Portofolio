<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SoftSkill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SoftSkillController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/soft-skills/index', [
            'softSkills' => SoftSkill::ordered()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'description_id' => ['nullable', 'string', 'max:2000'],
            'description_en' => ['nullable', 'string', 'max:2000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'icon_file' => ['nullable', 'image', 'max:2048'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('icon_file')) {
            $path = $request->file('icon_file')->store('soft-skills', 'public');
            $validated['icon'] = $path;
        }
        unset($validated['icon_file']);

        SoftSkill::create($validated);

        return back()->with('success', 'Soft skill created.');
    }

    public function update(Request $request, SoftSkill $softSkill): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'description_id' => ['nullable', 'string', 'max:2000'],
            'description_en' => ['nullable', 'string', 'max:2000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'icon_file' => ['nullable', 'image', 'max:2048'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('icon_file')) {
            $path = $request->file('icon_file')->store('soft-skills', 'public');
            $validated['icon'] = $path;
        }
        unset($validated['icon_file']);

        $softSkill->update($validated);

        return back()->with('success', 'Soft skill updated.');
    }

    public function destroy(SoftSkill $softSkill): RedirectResponse
    {
        $softSkill->delete();

        return back()->with('success', 'Soft skill deleted.');
    }
}
