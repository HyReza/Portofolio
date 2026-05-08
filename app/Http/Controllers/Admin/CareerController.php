<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Career;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CareerController extends Controller
{
    public function __construct(
        private readonly MediaService $mediaService,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('admin/careers/index', [
            'careers' => Career::with('children')
                ->roots()
                ->ordered()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'company_en' => ['nullable', 'string', 'max:255'],
            'position_id' => ['required', 'string', 'max:255'],
            'position_en' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'is_current' => ['boolean'],
            'parent_id' => ['nullable', 'exists:careers,id'],
            'branch_label' => ['nullable', 'string', 'max:100'],
            'branch_color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('logo')) {
            $media = $this->mediaService->upload($request->file('logo'), 'careers/logos');
            $validated['logo'] = $media['webp_path'] ?? $media['path'];
        }

        Career::create($validated);

        return back()->with('success', 'Career entry added.');
    }

    public function update(Request $request, Career $career): RedirectResponse
    {
        $validated = $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'company_en' => ['nullable', 'string', 'max:255'],
            'position_id' => ['required', 'string', 'max:255'],
            'position_en' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'is_current' => ['boolean'],
            'parent_id' => ['nullable', 'exists:careers,id'],
            'branch_label' => ['nullable', 'string', 'max:100'],
            'branch_color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('logo')) {
            $this->mediaService->delete($career->logo);
            $media = $this->mediaService->upload($request->file('logo'), 'careers/logos');
            $validated['logo'] = $media['webp_path'] ?? $media['path'];
        }

        $career->update($validated);

        return back()->with('success', 'Career entry updated.');
    }

    public function destroy(Career $career): RedirectResponse
    {
        $this->mediaService->delete($career->logo);
        // Re-parent children to null
        $career->children()->update(['parent_id' => null]);
        $career->delete();

        return back()->with('success', 'Career entry deleted.');
    }
}
