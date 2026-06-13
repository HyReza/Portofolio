<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\DTOs\ProjectDTO;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Models\Project;
use App\Models\ProjectTechnology;
use App\Models\ProjectType;
use App\Models\ProjectCategory;
use App\Services\MediaService;
use App\Services\ProjectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly MediaService $mediaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/projects/index', [
            'projects' => $this->projectService->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/projects/create', [
            'allTechnologies' => ProjectTechnology::orderBy('name')->get(),
            'allTypes' => ProjectType::orderBy('name_id')->get(),
            'allCategories' => ProjectCategory::orderBy('name_id')->get(),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            $media = $this->mediaService->upload($request->file('thumbnail'), 'projects/thumbnails');
            $validated['thumbnail'] = $media['webp_path'] ?? $media['path'];
        }

        // Handle gallery images
        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $media = $this->mediaService->upload($image, 'projects/gallery');
                $imagePaths[] = $media['webp_path'] ?? $media['path'];
            }
            $validated['images'] = $imagePaths;
        }

        $projectTypeNames = $validated['project_type_names'] ?? [];
        $projectCategoryNames = $validated['project_category_names'] ?? [];
        unset($validated['project_type_names'], $validated['project_category_names']);

        $dto = ProjectDTO::fromRequest($validated);
        $project = $this->projectService->create($dto);

        // Sync technologies
        if (!empty($validated['tech_stack'])) {
            $techIds = $this->syncTechStack($validated['tech_stack']);
            $project->technologies()->sync($techIds);
        }

        if (!empty($projectTypeNames)) {
            $typeIds = $this->syncProjectTypes($projectTypeNames);
            $project->types()->sync($typeIds);
        }

        if (!empty($projectCategoryNames)) {
            $catIds = $this->syncProjectCategories($projectCategoryNames);
            $project->categories()->sync($catIds);
        }

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function edit(Project $project): Response
    {
        return Inertia::render('admin/projects/edit', [
            'project' => $project->load(['seoMeta', 'technologies', 'types', 'categories']),
            'allTechnologies' => ProjectTechnology::orderBy('name')->get(),
            'allTypes' => ProjectType::orderBy('name_id')->get(),
            'allCategories' => ProjectCategory::orderBy('name_id')->get(),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('thumbnail')) {
            $this->mediaService->delete($project->thumbnail);
            $media = $this->mediaService->upload($request->file('thumbnail'), 'projects/thumbnails');
            $validated['thumbnail'] = $media['webp_path'] ?? $media['path'];
        }

        if ($request->hasFile('images')) {
            // Delete old images
            if ($project->images) {
                foreach ($project->images as $oldImage) {
                    $this->mediaService->delete($oldImage);
                }
            }
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $media = $this->mediaService->upload($image, 'projects/gallery');
                $imagePaths[] = $media['webp_path'] ?? $media['path'];
            }
            $validated['images'] = $imagePaths;
        }

        $projectTypeNames = $validated['project_type_names'] ?? [];
        $projectCategoryNames = $validated['project_category_names'] ?? [];
        unset($validated['project_type_names'], $validated['project_category_names']);

        $dto = ProjectDTO::fromRequest($validated);
        $this->projectService->update($project, $dto);

        // Sync technologies
        $techIds = !empty($validated['tech_stack']) ? $this->syncTechStack($validated['tech_stack']) : [];
        $project->technologies()->sync($techIds);

        $typeIds = !empty($projectTypeNames) ? $this->syncProjectTypes($projectTypeNames) : [];
        $project->types()->sync($typeIds);

        $categoryIds = !empty($projectCategoryNames) ? $this->syncProjectCategories($projectCategoryNames) : [];
        $project->categories()->sync($categoryIds);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->mediaService->delete($project->thumbnail);
        if ($project->images) {
            foreach ($project->images as $image) {
                $this->mediaService->delete($image);
            }
        }

        $project->technologies()->detach();
        $project->types()->detach();
        $project->categories()->detach();
        $this->projectService->delete($project);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    /**
     * Inline create a new technology from the project form.
     */
    public function storeTechnology(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $existing = ProjectTechnology::where('name', $request->name)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Technology already exists',
                'technology' => $existing,
            ]);
        }

        $technology = ProjectTechnology::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return response()->json([
            'message' => 'Technology created successfully',
            'technology' => $technology,
        ]);
    }

    /**
     * Inline create a new type from the project form.
     */
    public function storeType(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $type = ProjectType::create([
            'name_id' => $request->name_id,
            'name_en' => $request->name_en,
            'slug' => Str::slug($request->name_en ?: $request->name_id),
        ]);

        return response()->json([
            'message' => 'Type created successfully',
            'type' => $type,
        ]);
    }

    /**
     * Inline create a new category from the project form.
     */
    public function storeCategory(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $category = ProjectCategory::create([
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
     * Convert tech_stack string array to technology IDs, creating new entries as needed.
     */
    private function syncTechStack(array $techStack): array
    {
        $ids = [];
        foreach ($techStack as $techName) {
            $trimmed = trim($techName);
            if (empty($trimmed)) continue;

            $tech = ProjectTechnology::firstOrCreate(
                ['name' => $trimmed],
                ['slug' => Str::slug($trimmed)]
            );
            $ids[] = $tech->id;
        }
        return $ids;
    }

    /**
     * Convert type names string array to type IDs, creating new entries as needed.
     */
    private function syncProjectTypes(array $names): array
    {
        $ids = [];
        foreach ($names as $name) {
            $trimmed = trim($name);
            if (empty($trimmed)) continue;

            $type = ProjectType::firstOrCreate(
                ['name_id' => $trimmed],
                ['name_en' => $trimmed, 'slug' => Str::slug($trimmed)]
            );
            $ids[] = $type->id;
        }
        return $ids;
    }

    /**
     * Convert category names string array to category IDs, creating new entries as needed.
     */
    private function syncProjectCategories(array $names): array
    {
        $ids = [];
        foreach ($names as $name) {
            $trimmed = trim($name);
            if (empty($trimmed)) continue;

            $category = ProjectCategory::firstOrCreate(
                ['name_id' => $trimmed],
                ['name_en' => $trimmed, 'slug' => Str::slug($trimmed)]
            );
            $ids[] = $category->id;
        }
        return $ids;
    }
}
