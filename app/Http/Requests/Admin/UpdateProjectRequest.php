<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title_id' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('projects')->ignore($this->route('project'))],
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
            'demo_url' => ['nullable', 'url', 'max:500'],
            'repo_url' => ['nullable', 'url', 'max:500'],
            'is_featured' => ['boolean'],
            'status' => ['required', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
