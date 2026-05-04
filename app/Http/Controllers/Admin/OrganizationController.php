<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function index()
    {
        $organizations = Organization::ordered()->get();

        return Inertia::render('admin/organizations/index', [
            'organizations' => $organizations
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'boolean',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'sort_order' => 'integer'
        ]);

        Organization::create($validated);

        return redirect()->back()->with('success', 'Organization created successfully.');
    }

    public function update(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'boolean',
            'description_id' => 'nullable|string',
            'description_en' => 'nullable|string',
            'sort_order' => 'integer'
        ]);

        $organization->update($validated);

        return redirect()->back()->with('success', 'Organization updated successfully.');
    }

    public function destroy(Organization $organization)
    {
        $organization->delete();

        return redirect()->back()->with('success', 'Organization deleted successfully.');
    }
}
