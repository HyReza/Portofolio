<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $baseSlug = $this->slug ?: \Illuminate\Support\Str::slug($this->title_en ?? $this->title_id);
        if ($baseSlug) {
            $slug = $baseSlug;
            $count = 1;

            $blogId = $this->route('blog')?->id;

            while (\App\Models\Blog::where('slug', $slug)->when($blogId, fn($q) => $q->where('id', '!=', $blogId))->exists()) {
                $slug = $baseSlug . '-' . $count;
                $count++;
            }

            $this->merge([
                'slug' => $slug,
            ]);
        }
    }

    public function rules(): array
    {
        $blogId = $this->route('blog')?->id;
        
        return [
            'title_id' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', \Illuminate\Validation\Rule::unique('blogs', 'slug')->ignore($blogId)],
            'content_id' => ['nullable', 'string'],
            'content_en' => ['nullable', 'string'],
            'excerpt_id' => ['nullable', 'string', 'max:1000'],
            'excerpt_en' => ['nullable', 'string', 'max:1000'],
            'thumbnail' => ['nullable', 'image', 'max:5120'],
            'status' => ['required', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['exists:blog_tags,id'],
        ];
    }
}
