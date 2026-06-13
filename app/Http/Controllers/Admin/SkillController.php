<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SkillCategory;
use App\Models\Skill;
use App\Services\SkillService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SkillController extends Controller
{
    public function __construct(
        private readonly SkillService $skillService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/skills/index', [
            'categories' => $this->skillService->getAllWithSkills(),
        ]);
    }

    // ── Category CRUD ──

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'icon_file' => ['nullable', 'image', 'max:2048'],
            'sort_order' => ['integer'],
        ]);

        if ($request->hasFile('icon_file')) {
            $path = $request->file('icon_file')->store('skill-categories', 'public');
            $validated['icon_image'] = $path;
            $validated['icon'] = null;
        }
        unset($validated['icon_file']);

        $this->skillService->createCategory($validated);

        return back()->with('success', 'Category created.');
    }

    public function updateCategory(Request $request, SkillCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'icon_file' => ['nullable', 'image', 'max:2048'],
            'sort_order' => ['integer'],
        ]);

        if ($request->hasFile('icon_file')) {
            $path = $request->file('icon_file')->store('skill-categories', 'public');
            $validated['icon_image'] = $path;
            $validated['icon'] = null;
        }
        unset($validated['icon_file']);

        $this->skillService->updateCategory($category, $validated);

        return back()->with('success', 'Category updated.');
    }

    public function destroyCategory(SkillCategory $category): RedirectResponse
    {
        if ($category->skills()->exists()) {
            return back()->withErrors(['error' => 'Tidak bisa dihapus karena masih memiliki skill (Cannot delete because it has skills).']);
        }

        $this->skillService->deleteCategory($category);

        return back()->with('success', 'Category deleted.');
    }

    // ── Skill CRUD ──

    public function storeSkill(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'skill_category_id' => ['required', 'exists:skill_categories,id'],
            'name_id' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'description_id' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'icon_file' => ['nullable', 'image', 'max:2048'],
            'proficiency' => ['integer', 'min:0', 'max:100'],
            'sort_order' => ['integer'],
        ]);

        if ($request->hasFile('icon_file')) {
            $path = $request->file('icon_file')->store('skills', 'public');
            $validated['icon'] = $path;
        }
        unset($validated['icon_file']);

        $this->skillService->createSkill($validated);

        return back()->with('success', 'Skill created.');
    }

    public function updateSkill(Request $request, Skill $skill): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => ['required', 'string', 'max:100'],
            'name_en' => ['required', 'string', 'max:100'],
            'description_id' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:255'],
            'icon_file' => ['nullable', 'image', 'max:2048'],
            'proficiency' => ['integer', 'min:0', 'max:100'],
            'sort_order' => ['integer'],
        ]);

        if ($request->hasFile('icon_file')) {
            $path = $request->file('icon_file')->store('skills', 'public');
            $validated['icon'] = $path;
        }
        unset($validated['icon_file']);

        $this->skillService->updateSkill($skill, $validated);

        return back()->with('success', 'Skill updated.');
    }

    public function destroySkill(Skill $skill): RedirectResponse
    {
        $this->skillService->deleteSkill($skill);

        return back()->with('success', 'Skill deleted.');
    }
}
