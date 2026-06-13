<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProjectType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectTypeController extends Controller
{
    public function index(): Response
    {
        $types = ProjectType::withCount('projects')->latest()->get();

        return Inertia::render('admin/project-types/index', [
            'types' => $types,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        ProjectType::create($validated);

        return redirect()->back()->with('success', 'Project type created successfully.');
    }

    public function update(Request $request, ProjectType $projectType): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $projectType->update($validated);

        return redirect()->back()->with('success', 'Project type updated successfully.');
    }

    public function destroy(ProjectType $projectType): RedirectResponse
    {
        if ($projectType->projects()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa dihapus karena sedang digunakan di proyek (Cannot delete because it is used in projects).']);
        }

        $projectType->delete();

        return redirect()->back()->with('success', 'Project type deleted successfully.');
    }
}
