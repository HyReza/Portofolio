<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Career extends Model
{
    use HasFactory;

    protected $fillable = [
        'company',
        'position',
        'start_date',
        'end_date',
        'description_id',
        'description_en',
        'logo',
        'is_current',
        'parent_id',
        'branch_label',
        'branch_color',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // ── Relationships (Git-Branch Style) ──

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Career::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Career::class, 'parent_id');
    }

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'metaable');
    }

    // ── Scopes ──

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function scopeChronological($query)
    {
        return $query->orderByDesc('start_date');
    }
}
