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
        // Normalize sort_order to be sequential (fix legacy data with gaps/duplicates)
        $all = Certificate::orderBy('sort_order')->orderByDesc('created_at')->get();
        foreach ($all->values() as $i => $cert) {
            if ($cert->sort_order !== $i) {
                $cert->update(['sort_order' => $i]);
            }
        }

        return Inertia::render('admin/certificates/index', [
            'certificates' => Certificate::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'issuer' => ['required', 'string', 'max:255'],
            'credential_type' => ['nullable', 'string', 'max:255'],
            'credential_type_en' => ['nullable', 'string', 'max:255'],
            'credential_id' => ['nullable', 'string', 'max:255'],
            'credential_url' => ['nullable', 'url', 'max:500'],
            'image' => ['nullable', 'image', 'max:5120'],
            'issued_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'skills' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'category_en' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        // Auto-assign sort_order: new cert goes to top (0), push all existing down
        Certificate::query()->increment('sort_order');
        $validated['sort_order'] = 0;

        if ($request->hasFile('image')) {
            $media = $this->mediaService->upload($request->file('image'), 'certificates');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        // Process skills string to array
        if (isset($validated['skills'])) {
            $validated['skills'] = array_map('trim', explode(',', $validated['skills']));
        }

        $certificate = Certificate::create($validated);

        // Auto-generate SEO
        $certificate->seoMeta()->create([
            'meta_title_id' => $certificate->title . ' - Certificate',
            'meta_description_id' => substr(strip_tags($certificate->description_id ?? 'My Certification'), 0, 160),
            'og_image' => $certificate->image,
        ]);

        return back()->with('success', 'Certificate added.');
    }

    public function update(Request $request, Certificate $certificate): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'issuer' => ['required', 'string', 'max:255'],
            'credential_type' => ['nullable', 'string', 'max:255'],
            'credential_type_en' => ['nullable', 'string', 'max:255'],
            'credential_id' => ['nullable', 'string', 'max:255'],
            'credential_url' => ['nullable', 'url', 'max:500'],
            'image' => ['nullable', 'image', 'max:5120'],
            'issued_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'skills' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'category_en' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('image')) {
            $this->mediaService->delete($certificate->image);
            $media = $this->mediaService->upload($request->file('image'), 'certificates');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        // Process skills string to array
        if (isset($validated['skills']) && is_string($validated['skills'])) {
            $validated['skills'] = array_map('trim', explode(',', $validated['skills']));
        }

        $certificate->update($validated);

        // Auto-update SEO
        $certificate->seoMeta()->updateOrCreate(
            ['metaable_id' => $certificate->id, 'metaable_type' => Certificate::class],
            [
                'meta_title_id' => $certificate->title . ' - Certificate',
                'meta_description_id' => substr(strip_tags($certificate->description_id ?? 'My Certification'), 0, 160),
                'og_image' => $certificate->image,
            ]
        );

        return back()->with('success', 'Certificate updated.');
    }

    public function destroy(Certificate $certificate): RedirectResponse
    {
        $deletedOrder = $certificate->sort_order;
        $this->mediaService->delete($certificate->image);
        $certificate->seoMeta?->delete();
        $certificate->delete();

        // Re-compact sort_order after deletion
        Certificate::where('sort_order', '>', $deletedOrder)->decrement('sort_order');

        return back()->with('success', 'Certificate deleted.');
    }

    /**
     * Swap two certificates' positions.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'from_id' => ['required', 'integer', 'exists:certificates,id'],
            'to_id' => ['required', 'integer', 'exists:certificates,id'],
        ]);

        $from = Certificate::findOrFail($request->from_id);
        $to = Certificate::findOrFail($request->to_id);

        $fromOrder = $from->sort_order;
        $toOrder = $to->sort_order;

        $from->update(['sort_order' => $toOrder]);
        $to->update(['sort_order' => $fromOrder]);

        return back()->with('success', 'Order updated.');
    }
}
