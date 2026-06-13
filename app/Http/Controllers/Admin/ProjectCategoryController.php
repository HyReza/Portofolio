<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProjectCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = ProjectCategory::withCount('projects')->latest()->get();

        return Inertia::render('admin/project-categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        ProjectCategory::create($validated);

        return redirect()->back()->with('success', 'Project category created successfully.');
    }

    public function update(Request $request, ProjectCategory $projectCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $projectCategory->update($validated);

        return redirect()->back()->with('success', 'Project category updated successfully.');
    }

    public function destroy(ProjectCategory $projectCategory): RedirectResponse
    {
        if ($projectCategory->projects()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa dihapus karena sedang digunakan di proyek (Cannot delete because it is used in projects).']);
        }

        $projectCategory->delete();

        return redirect()->back()->with('success', 'Project category deleted successfully.');
    }
}
