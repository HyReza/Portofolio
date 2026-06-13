<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
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

            $projectId = $this->route('project')?->id;

            while (\App\Models\Project::where('slug', $slug)->when($projectId, fn($q) => $q->where('id', '!=', $projectId))->exists()) {
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
        $projectId = $this->route('project')?->id;

        return [
            'title_id' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', \Illuminate\Validation\Rule::unique('projects', 'slug')->ignore($projectId)],
            'excerpt_id' => ['nullable', 'string', 'max:1000'],
            'excerpt_en' => ['nullable', 'string', 'max:1000'],
            'problem_id' => ['nullable', 'string'],
            'problem_en' => ['nullable', 'string'],
            'solution_id' => ['nullable', 'string'],
            'solution_en' => ['nullable', 'string'],
            'content_id' => ['nullable', 'string'],
            'content_en' => ['nullable', 'string'],
            'thumbnail' => ['nullable', 'image', 'max:5120'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'],
            'tech_stack' => ['nullable', 'array'],
            'tech_stack.*' => ['string'],
            'project_type_names' => ['nullable', 'array'],
            'project_type_names.*' => ['string'],
            'project_category_names' => ['nullable', 'array'],
            'project_category_names.*' => ['string'],
            'demo_url' => ['nullable', 'url', 'max:500'],
            'repo_url' => ['nullable', 'url', 'max:500'],
            'is_featured' => ['boolean'],
            'status' => ['required', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'show_in_cv' => ['boolean'],
        ];
    }
}
