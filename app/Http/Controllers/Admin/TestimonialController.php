<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestimonialController extends Controller
{
    public function __construct(private readonly MediaService $mediaService) {}

    public function index(): Response
    {
        // Normalize sort_order
        $all = Testimonial::orderBy('sort_order')->orderByDesc('created_at')->get();
        foreach ($all->values() as $i => $item) {
            if ($item->sort_order !== $i) {
                $item->update(['sort_order' => $i]);
            }
        }

        return Inertia::render('admin/testimonials/index', [
            'testimonials' => Testimonial::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'company_en' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'position_en' => ['nullable', 'string', 'max:255'],
            'relation' => ['nullable', 'string', 'max:255'],
            'relation_en' => ['nullable', 'string', 'max:255'],
            'content_id' => ['required', 'string'],
            'content_en' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:5120'],
            'project_url' => ['nullable', 'url', 'max:500'],
        ]);

        // Auto-assign sort_order: new goes to top (0), push existing down
        Testimonial::query()->increment('sort_order');
        $validated['sort_order'] = 0;

        if ($request->hasFile('image')) {
            $media = $this->mediaService->upload($request->file('image'), 'testimonials');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        $testimonial = Testimonial::create($validated);

        // Auto-generate SEO
        $testimonial->seoMeta()->create([
            'title' => 'Testimonial from '.$testimonial->client_name,
            'description' => substr(strip_tags($testimonial->content_id), 0, 160),
            'keywords' => implode(',', array_filter(['testimonial', 'review', $testimonial->client_name, $testimonial->company])),
            'og_image' => $testimonial->image,
        ]);

        return back()->with('success', 'Testimonial added.');
    }

    public function update(Request $request, Testimonial $testimonial): RedirectResponse
    {
        $validated = $request->validate([
            'client_name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'company_en' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'position_en' => ['nullable', 'string', 'max:255'],
            'relation' => ['nullable', 'string', 'max:255'],
            'relation_en' => ['nullable', 'string', 'max:255'],
            'content_id' => ['required', 'string'],
            'content_en' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:5120'],
            'project_url' => ['nullable', 'url', 'max:500'],
        ]);

        if ($request->hasFile('image')) {
            $this->mediaService->delete($testimonial->image);
            $media = $this->mediaService->upload($request->file('image'), 'testimonials');
            $validated['image'] = $media['webp_path'] ?? $media['path'];
        }

        $testimonial->update($validated);

        // Auto-update SEO
        $testimonial->seoMeta()->updateOrCreate(
            ['metaable_id' => $testimonial->id, 'metaable_type' => Testimonial::class],
            [
                'title' => 'Testimonial from '.$testimonial->client_name,
                'description' => substr(strip_tags($testimonial->content_id), 0, 160),
                'keywords' => implode(',', array_filter(['testimonial', 'review', $testimonial->client_name, $testimonial->company])),
                'og_image' => $testimonial->image,
            ]
        );

        return back()->with('success', 'Testimonial updated.');
    }

    public function destroy(Testimonial $testimonial): RedirectResponse
    {
        $deletedOrder = $testimonial->sort_order;
        $this->mediaService->delete($testimonial->image);
        $testimonial->seoMeta?->delete();
        $testimonial->delete();

        // Re-compact sort_order
        Testimonial::where('sort_order', '>', $deletedOrder)->decrement('sort_order');

        return back()->with('success', 'Testimonial deleted.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'from_id' => ['required', 'integer', 'exists:testimonials,id'],
            'to_id' => ['required', 'integer', 'exists:testimonials,id'],
        ]);

        $from = Testimonial::findOrFail($request->from_id);
        $to = Testimonial::findOrFail($request->to_id);

        $fromOrder = $from->sort_order;
        $toOrder = $to->sort_order;

        $from->update(['sort_order' => $toOrder]);
        $to->update(['sort_order' => $fromOrder]);

        return back()->with('success', 'Order updated.');
    }
}
