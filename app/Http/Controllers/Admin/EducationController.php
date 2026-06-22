<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Education;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EducationController extends Controller
{
    public function __construct(
        private readonly MediaService $mediaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/education/index', [
            'educations' => Education::ordered()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'institution' => ['required', 'string', 'max:255'],
            'institution_en' => ['nullable', 'string', 'max:255'],
            'degree' => ['nullable', 'string', 'max:255'],
            'degree_en' => ['nullable', 'string', 'max:255'],
            'field' => ['nullable', 'string', 'max:255'],
            'field_en' => ['nullable', 'string', 'max:255'],
            'gpa' => ['nullable', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'activities_id' => ['nullable', 'string'],
            'activities_en' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'type' => ['required', 'string', 'in:formal,informal'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('logo')) {
            $media = $this->mediaService->upload($request->file('logo'), 'education/logos');
            $validated['logo'] = $media['webp_path'] ?? $media['path'];
        }

        Education::create($validated);

        return back()->with('success', 'Education added.');
    }

    public function update(Request $request, Education $education): RedirectResponse
    {
        $validated = $request->validate([
            'institution' => ['required', 'string', 'max:255'],
            'institution_en' => ['nullable', 'string', 'max:255'],
            'degree' => ['nullable', 'string', 'max:255'],
            'degree_en' => ['nullable', 'string', 'max:255'],
            'field' => ['nullable', 'string', 'max:255'],
            'field_en' => ['nullable', 'string', 'max:255'],
            'gpa' => ['nullable', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description_id' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'activities_id' => ['nullable', 'string'],
            'activities_en' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'type' => ['required', 'string', 'in:formal,informal'],
            'sort_order' => ['integer'],
            'show_in_cv' => ['boolean'],
        ]);

        if ($request->hasFile('logo')) {
            $this->mediaService->delete($education->logo);
            $media = $this->mediaService->upload($request->file('logo'), 'education/logos');
            $validated['logo'] = $media['webp_path'] ?? $media['path'];
        }

        $education->update($validated);

        return back()->with('success', 'Education updated.');
    }

    public function destroy(Education $education): RedirectResponse
    {
        $this->mediaService->delete($education->logo);
        $education->delete();

        return back()->with('success', 'Education deleted.');
    }
}
