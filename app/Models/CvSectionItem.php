<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvSectionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cv_section_id',
        'source_type',
        'source_id',
        'title',
        'subtitle',
        'location',
        'bullets',
        'metadata',
        'sort_order',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'bullets' => 'array',
            'metadata' => 'array',
            'sort_order' => 'integer',
            'is_visible' => 'boolean',
            'source_id' => 'integer',
        ];
    }

    // ── Relationships ──

    public function section(): BelongsTo
    {
        return $this->belongsTo(CvSection::class, 'cv_section_id');
    }

    // ── Scopes ──

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }
}
