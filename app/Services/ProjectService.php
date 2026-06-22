<?php

namespace App\Services;

use App\DTOs\ProjectDTO;
use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    public function paginate(int $perPage = 15, ?string $status = null): LengthAwarePaginator
    {
        $query = Project::with('seoMeta')
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    public function getPublished(): Collection
    {
        return Project::with('seoMeta')
            ->latestPublished()
            ->get();
    }

    public function getFeatured(int $limit = 6): Collection
    {
        return Project::with('seoMeta')
            ->published()
            ->featured()
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();
    }

    public function findBySlug(string $slug): ?Project
    {
        return Project::with('seoMeta')
            ->where('slug', $slug)
            ->firstOrFail();
    }

    public function create(ProjectDTO $dto): Project
    {
        return Project::create($dto->toArray());
    }

    public function update(Project $project, ProjectDTO $dto): Project
    {
        $project->update($dto->toArray());

        return $project->fresh();
    }

    public function delete(Project $project): void
    {
        $project->seoMeta?->delete();
        $project->delete();
    }
}
