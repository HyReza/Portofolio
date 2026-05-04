<?php

namespace App\DTOs;

readonly class BlogDTO
{
    public function __construct(
        public string $title_id,
        public string $title_en,
        public ?string $slug = null,
        public ?string $content_id = null,
        public ?string $content_en = null,
        public ?string $excerpt_id = null,
        public ?string $excerpt_en = null,
        public ?string $thumbnail = null,
        public string $status = 'draft',
        public ?string $published_at = null,
        public ?array $tag_ids = null,
    ) {}

    public static function fromRequest(array $validated): self
    {
        return new self(...$validated);
    }

    public function toArray(): array
    {
        $data = get_object_vars($this);
        unset($data['tag_ids']);
        return array_filter($data, fn($v) => $v !== null);
    }
}
