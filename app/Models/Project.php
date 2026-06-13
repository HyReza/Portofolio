<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title_id',
        'title_en',
        'excerpt_id',
        'excerpt_en',
        'problem_id',
        'problem_en',
        'solution_id',
        'solution_en',
        'content_id',
        'content_en',
        'thumbnail',
        'images',
        'tech_stack',
        'demo_url',
        'repo_url',
        'is_featured',
        'status',
        'published_at',
        'show_in_cv',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'tech_stack' => 'array',
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
            'show_in_cv' => 'boolean',
        ];
    }

    // ── Boot ──

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->slug)) {
                $project->slug = Str::slug($project->title_en ?: $project->title_id);
            }
        });
    }

    // ── Relationships ──

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'metaable');
    }

    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(ProjectTechnology::class);
    }

    public function types(): BelongsToMany
    {
        return $this->belongsToMany(ProjectType::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(ProjectCategory::class);
    }

    // ── Scopes ──

    public function scopePublished($query)
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeLatestPublished($query)
    {
        return $query->published()->orderByDesc('published_at');
    }

    // ── Route Model Binding ──

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
