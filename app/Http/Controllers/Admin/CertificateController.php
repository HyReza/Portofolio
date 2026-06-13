<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateCategory;
use App\Models\CredentialType;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function __construct(private readonly MediaService $mediaService) {}

    public function index(): Response
    {
        return Inertia::render('admin/certificates/index', [
            'certificates' => Certificate::with(['categories', 'credentialTypes'])->ordered()->get(),
            'allCategories' => CertificateCategory::orderBy('name_id')->get(),
            'allCredentialTypes' => CredentialType::orderBy('name_id')->get(),
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
            'category_ids' => ['nullable', 'string'],
            'credential_type_ids' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'show_in_cv' => ['boolean'],
        ]);

        // sort_order is NULL by default (order by issued_date)
        $validated['sort_order'] = null;

        if ($request->hasFile('image')) {
            $media = $this->mediaService->upload($request->file('image'), 'certificates');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        // Process skills string to array
        if (isset($validated['skills'])) {
            $validated['skills'] = array_map('trim', explode(',', $validated['skills']));
        }

        // Remove ids before creating (not a model field)
        $categoryIds = $this->parseIds($validated['category_ids'] ?? null);
        $credentialTypeIds = $this->parseIds($validated['credential_type_ids'] ?? null);
        unset($validated['category_ids'], $validated['credential_type_ids']);

        $certificate = Certificate::create($validated);

        // Sync categories and credential types
        if (!empty($categoryIds)) {
            $certificate->categories()->sync($categoryIds);
        }
        if (!empty($credentialTypeIds)) {
            $certificate->credentialTypes()->sync($credentialTypeIds);
        }

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
            'category_ids' => ['nullable', 'string'],
            'credential_type_ids' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
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

        // Remove ids before updating (not a model field)
        $categoryIds = $this->parseIds($validated['category_ids'] ?? null);
        $credentialTypeIds = $this->parseIds($validated['credential_type_ids'] ?? null);
        unset($validated['category_ids'], $validated['credential_type_ids']);

        $certificate->update($validated);

        // Sync categories and credential types
        $certificate->categories()->sync($categoryIds);
        $certificate->credentialTypes()->sync($credentialTypeIds);

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
        $this->mediaService->delete($certificate->image);
        $certificate->categories()->detach();
        $certificate->credentialTypes()->detach();
        $certificate->seoMeta?->delete();
        $certificate->delete();

        return back()->with('success', 'Certificate deleted.');
    }

    /**
     * Swap two certificates' positions (manual sort).
     */
    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'from_id' => ['required', 'integer', 'exists:certificates,id'],
            'to_id' => ['required', 'integer', 'exists:certificates,id'],
        ]);

        $from = Certificate::findOrFail($request->from_id);
        $to = Certificate::findOrFail($request->to_id);

        // Get all certificates in their current order
        $allCerts = Certificate::ordered()->get();
        $fromIndex = $allCerts->search(fn ($c) => $c->id === $from->id);
        $toIndex = $allCerts->search(fn ($c) => $c->id === $to->id);

        if ($fromIndex === false || $toIndex === false) {
            return back()->with('error', 'Certificate not found in order.');
        }

        // Assign manual sort_order to ALL certificates to enable manual ordering
        foreach ($allCerts->values() as $i => $cert) {
            $cert->update(['sort_order' => $i]);
        }

        // Reload and swap
        $from->refresh();
        $to->refresh();
        $fromOrder = $from->sort_order;
        $toOrder = $to->sort_order;

        $from->update(['sort_order' => $toOrder]);
        $to->update(['sort_order' => $fromOrder]);

        return back()->with('success', 'Order updated.');
    }

    /**
     * Inline create a new category from the certificate form.
     */
    public function storeCategory(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $category = CertificateCategory::create([
            'name_id' => $request->name_id,
            'name_en' => $request->name_en,
            'slug' => Str::slug($request->name_en ?: $request->name_id),
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category,
        ]);
    }

    /**
     * Inline create a new credential type from the certificate form.
     */
    public function storeCredentialType(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $type = CredentialType::create([
            'name_id' => $request->name_id,
            'name_en' => $request->name_en,
            'slug' => Str::slug($request->name_en ?: $request->name_id),
        ]);

        return response()->json([
            'message' => 'Credential Type created successfully',
            'credentialType' => $type,
        ]);
    }

    /**
     * Parse comma-separated IDs string to array of integers.
     */
    private function parseIds(?string $ids): array
    {
        if (empty($ids)) return [];

        return array_filter(
            array_map('intval', explode(',', $ids)),
            fn ($id) => $id > 0
        );
    }
}
