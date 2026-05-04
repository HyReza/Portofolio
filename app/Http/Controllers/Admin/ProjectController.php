<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\DTOs\ProjectDTO;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Models\Project;
use App\Services\MediaService;
use App\Services\ProjectService;
use Illuminate\Http\RedirectResponse;
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
        return Inertia::render('admin/projects/create');
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

        $dto = ProjectDTO::fromRequest($validated);
        $this->projectService->create($dto);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function edit(Project $project): Response
    {
        return Inertia::render('admin/projects/edit', [
            'project' => $project->load('seoMeta'),
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

        $dto = ProjectDTO::fromRequest($validated);
        $this->projectService->update($project, $dto);

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

        $this->projectService->delete($project);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully.');
    }
}
