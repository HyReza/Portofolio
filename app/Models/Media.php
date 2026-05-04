<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    protected $fillable = [
        'mediable_type',
        'mediable_id',
        'collection',
        'path',
        'mime_type',
        'size',
        'webp_path',
        'metadata',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->path);
    }

    public function getWebpUrlAttribute(): ?string
    {
        return $this->webp_path ? asset('storage/' . $this->webp_path) : null;
    }

    /**
     * Returns WebP URL if available, otherwise original.
     */
    public function getOptimizedUrlAttribute(): string
    {
        return $this->webp_url ?? $this->url;
    }
}
