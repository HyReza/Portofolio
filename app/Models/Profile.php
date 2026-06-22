<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value_id',
        'value_en',
        'type',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    // ── Relationships ──

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'metaable');
    }

    // ── Scopes ──

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    // ── Accessors ──

    public function getLocalizedValueAttribute(): ?string
    {
        $locale = app()->getLocale();

        return $locale === 'id' ? $this->value_id : $this->value_en;
    }
}
