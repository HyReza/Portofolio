<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificateCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificateCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = CertificateCategory::withCount('certificates')->latest()->get();

        return Inertia::render('admin/certificate-categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        CertificateCategory::create($validated);

        return redirect()->back()->with('success', 'Certificate category created successfully.');
    }

    public function update(Request $request, CertificateCategory $certificateCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $certificateCategory->update($validated);

        return redirect()->back()->with('success', 'Certificate category updated successfully.');
    }

    public function destroy(CertificateCategory $certificateCategory): RedirectResponse
    {
        $certificateCategory->delete();

        return redirect()->back()->with('success', 'Certificate category deleted successfully.');
    }
}
