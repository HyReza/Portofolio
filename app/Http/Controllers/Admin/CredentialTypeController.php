<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CredentialType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CredentialTypeController extends Controller
{
    public function index(): Response
    {
        $types = CredentialType::withCount('certificates')->latest()->get();

        return Inertia::render('admin/credential-types/index', [
            'types' => $types,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        CredentialType::create($validated);

        return redirect()->back()->with('success', 'Credential type created successfully.');
    }

    public function update(Request $request, CredentialType $credentialType): RedirectResponse
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $credentialType->update($validated);

        return redirect()->back()->with('success', 'Credential type updated successfully.');
    }

    public function destroy(CredentialType $credentialType): RedirectResponse
    {
        if ($credentialType->certificates()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa dihapus karena sedang digunakan di sertifikat (Cannot delete because it is used in certificates).']);
        }

        $credentialType->delete();

        return redirect()->back()->with('success', 'Credential type deleted successfully.');
    }
}
