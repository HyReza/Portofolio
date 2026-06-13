<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProjectTechnology;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectTechnologyController extends Controller
{
    public function index(): Response
    {
        $technologies = ProjectTechnology::withCount('projects')->latest()->get();

        return Inertia::render('admin/technologies/index', [
            'technologies' => $technologies,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:project_technologies,name',
        ]);

        ProjectTechnology::create($validated);

        return redirect()->back()->with('success', 'Technology created successfully.');
    }

    public function update(Request $request, ProjectTechnology $technology): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:project_technologies,name,' . $technology->id,
        ]);

        $technology->update($validated);

        return redirect()->back()->with('success', 'Technology updated successfully.');
    }

    public function destroy(ProjectTechnology $technology): RedirectResponse
    {
        $technology->delete();

        return redirect()->back()->with('success', 'Technology deleted successfully.');
    }
}
