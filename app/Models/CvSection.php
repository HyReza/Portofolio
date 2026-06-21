<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CvSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'cv_generation_id',
        'type',
        'title',
        'sort_order',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_visible' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function generation(): BelongsTo
    {
        return $this->belongsTo(CvGeneration::class, 'cv_generation_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CvSectionItem::class)->orderBy('sort_order');
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
