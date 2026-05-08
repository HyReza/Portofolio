<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'title_en',
        'issuer',
        'credential_type',
        'credential_type_en',
        'credential_id',
        'credential_url',
        'image',
        'issued_date',
        'expiry_date',
        'description_id',
        'description_en',
        'skills',
        'category',
        'category_en',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'issued_date' => 'date',
            'expiry_date' => 'date',
            'skills' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'metaable');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function getIsValidAttribute(): bool
    {
        return !$this->is_expired;
    }
}
