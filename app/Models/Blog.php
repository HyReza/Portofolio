<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Str;

class Blog extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title_id',
        'title_en',
        'content_id',
        'content_en',
        'excerpt_id',
        'excerpt_en',
        'thumbnail',
        'reading_time',
        'status',
        'published_at',
        'view_count',
    ];

    protected function casts(): array
    {
        return [
            'reading_time' => 'integer',
            'view_count' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    // ── Boot ──

    protected static function booted(): void
    {
        static::creating(function (Blog $blog) {
            if (empty($blog->slug)) {
                $blog->slug = Str::slug($blog->title_en ?: $blog->title_id);
            }
        });

        static::saving(function (Blog $blog) {
            // Auto-calculate reading time from content (~200 words/min)
            $content = $blog->content_en ?: $blog->content_id;
            if ($content) {
                $wordCount = str_word_count(strip_tags($content));
                $blog->reading_time = max(1, (int) ceil($wordCount / 200));
            }
        });
    }

    // ── Relationships ──

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(BlogTag::class);
    }

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'metaable');
    }

    public function comments()
    {
        return $this->hasMany(BlogComment::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(BlogBookmark::class);
    }

    public function likes()
    {
        return $this->hasMany(BlogLike::class);
    }

    // ── Scopes ──

    public function scopePublished($query)
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }

    public function scopeLatestPublished($query)
    {
        return $query->published()->orderByDesc('published_at');
    }

    // ── Methods ──

    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
