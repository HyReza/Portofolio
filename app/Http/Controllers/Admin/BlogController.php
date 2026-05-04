<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\DTOs\BlogDTO;
use App\Http\Requests\Admin\StoreBlogRequest;
use App\Models\Blog;
use App\Models\BlogTag;
use App\Services\BlogService;
use App\Services\MediaService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function __construct(
        private readonly BlogService $blogService,
        private readonly MediaService $mediaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/blogs/index', [
            'blogs' => $this->blogService->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/blogs/create', [
            'tags' => BlogTag::all(),
        ]);
    }

    public function store(StoreBlogRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('thumbnail')) {
            $media = $this->mediaService->upload($request->file('thumbnail'), 'blogs/thumbnails');
            $validated['thumbnail'] = $media['webp_path'] ?? $media['path'];
        }

        $dto = BlogDTO::fromRequest($validated);
        $this->blogService->create($dto);

        return redirect()->route('admin.blogs.index')
            ->with('success', 'Blog post created successfully.');
    }

    public function edit(Blog $blog): Response
    {
        return Inertia::render('admin/blogs/edit', [
            'blog' => $blog->load(['tags', 'seoMeta']),
            'tags' => BlogTag::all(),
        ]);
    }

    public function update(StoreBlogRequest $request, Blog $blog): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('thumbnail')) {
            $this->mediaService->delete($blog->thumbnail);
            $media = $this->mediaService->upload($request->file('thumbnail'), 'blogs/thumbnails');
            $validated['thumbnail'] = $media['webp_path'] ?? $media['path'];
        }

        $dto = BlogDTO::fromRequest($validated);
        $this->blogService->update($blog, $dto);

        return redirect()->route('admin.blogs.index')
            ->with('success', 'Blog post updated successfully.');
    }

    public function destroy(Blog $blog): RedirectResponse
    {
        $this->mediaService->delete($blog->thumbnail);
        $this->blogService->delete($blog);

        return redirect()->route('admin.blogs.index')
            ->with('success', 'Blog post deleted successfully.');
    }

    public function storeTag(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'name_id' => 'required|string|max:50',
            'name_en' => 'required|string|max:50',
        ]);

        $tag = BlogTag::create([
            'name_id' => $request->name_id,
            'name_en' => $request->name_en,
            'slug' => \Illuminate\Support\Str::slug($request->name_en),
        ]);

        return response()->json([
            'message' => 'Tag created successfully',
            'tag' => $tag
        ]);
    }
}
