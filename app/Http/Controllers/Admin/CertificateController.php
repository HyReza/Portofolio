<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function __construct(private readonly MediaService $mediaService) {}

    public function index(): Response
    {
        return Inertia::render('admin/certificates/index', [
            'certificates' => Certificate::ordered()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'issuer' => ['required', 'string', 'max:255'],
            'credential_id' => ['nullable', 'string', 'max:255'],
            'credential_url' => ['nullable', 'url', 'max:500'],
            'image' => ['nullable', 'image', 'max:5120'],
            'issued_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'sort_order' => ['integer'],
        ]);

        if ($request->hasFile('image')) {
            $media = $this->mediaService->upload($request->file('image'), 'certificates');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        Certificate::create($validated);
        return back()->with('success', 'Certificate added.');
    }

    public function update(Request $request, Certificate $certificate): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'issuer' => ['required', 'string', 'max:255'],
            'credential_id' => ['nullable', 'string', 'max:255'],
            'credential_url' => ['nullable', 'url', 'max:500'],
            'image' => ['nullable', 'image', 'max:5120'],
            'issued_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'sort_order' => ['integer'],
        ]);

        if ($request->hasFile('image')) {
            $this->mediaService->delete($certificate->image);
            $media = $this->mediaService->upload($request->file('image'), 'certificates');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        $certificate->update($validated);
        return back()->with('success', 'Certificate updated.');
    }

    public function destroy(Certificate $certificate): RedirectResponse
    {
        $this->mediaService->delete($certificate->image);
        $certificate->seoMeta?->delete();
        $certificate->delete();
        return back()->with('success', 'Certificate deleted.');
    }
}
