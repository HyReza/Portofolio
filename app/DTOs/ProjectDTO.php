<?php

namespace App\DTOs;

readonly class ProjectDTO
{
    public function __construct(
        public string $title_id,
        public string $title_en,
        public ?string $slug = null,
        public ?string $excerpt_id = null,
        public ?string $excerpt_en = null,
        public ?string $problem_id = null,
        public ?string $problem_en = null,
        public ?string $solution_id = null,
        public ?string $solution_en = null,
        public ?string $content_id = null,
        public ?string $content_en = null,
        public ?string $thumbnail = null,
        public ?array $images = null,
        public ?array $tech_stack = null,
        public ?string $demo_url = null,
        public ?string $repo_url = null,
        public bool $is_featured = false,
        public string $status = 'draft',
        public ?string $published_at = null,
        public bool $show_in_cv = true,
    ) {}

    public static function fromRequest(array $validated): self
    {
        return new self(...$validated);
    }

    public function toArray(): array
    {
        return array_filter(get_object_vars($this), fn($v) => $v !== null);
    }
}
