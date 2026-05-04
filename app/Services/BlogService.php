<?php

namespace App\Services;

use App\DTOs\BlogDTO;
use App\Models\Blog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BlogService
{
    public function paginate(int $perPage = 15, ?string $status = null): LengthAwarePaginator
    {
        $query = Blog::with(['tags', 'seoMeta'])
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    public function getPublished(int $perPage = 12): LengthAwarePaginator
    {
        return Blog::with(['tags', 'seoMeta'])
            ->latestPublished()
            ->paginate($perPage);
    }

    public function getLatest(int $limit = 5): Collection
    {
        return Blog::with(['tags'])
            ->latestPublished()
            ->limit($limit)
            ->get();
    }

    public function findBySlug(string $slug): Blog
    {
        return Blog::with(['tags', 'seoMeta'])
            ->where('slug', $slug)
            ->firstOrFail();
    }

    public function create(BlogDTO $dto): Blog
    {
        $blog = Blog::create($dto->toArray());

        if ($dto->tag_ids) {
            $blog->tags()->sync($dto->tag_ids);
        }

        return $blog->load('tags');
    }

    public function update(Blog $blog, BlogDTO $dto): Blog
    {
        $blog->update($dto->toArray());

        if ($dto->tag_ids !== null) {
            $blog->tags()->sync($dto->tag_ids);
        }

        return $blog->fresh('tags');
    }

    public function delete(Blog $blog): void
    {
        $blog->tags()->detach();
        $blog->seoMeta?->delete();
        $blog->delete();
    }

    public function incrementView(Blog $blog): void
    {
        $blog->incrementViewCount();
    }
}
