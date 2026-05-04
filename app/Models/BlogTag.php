<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class BlogTag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_id',
        'name_en',
        'slug',
    ];

    protected static function booted(): void
    {
        static::creating(function (BlogTag $tag) {
            if (empty($tag->slug)) {
                $tag->slug = Str::slug($tag->name_en ?: $tag->name_id);
            }
        });
    }

    // ── Relationships ──

    public function blogs(): BelongsToMany
    {
        return $this->belongsToMany(Blog::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
