<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'title_en',
        'issuer',
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
        'show_in_cv',
    ];

    protected function casts(): array
    {
        return [
            'issued_date' => 'date',
            'expiry_date' => 'date',
            'skills' => 'array',
            'sort_order' => 'integer',
            'show_in_cv' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'metaable');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(CertificateCategory::class);
    }

    public function credentialTypes(): BelongsToMany
    {
        return $this->belongsToMany(CredentialType::class);
    }

    // ── Scopes ──

    /**
     * Order certificates: manual sort_order first (ASC), then by issued_date DESC for unordered.
     */
    public function scopeOrdered($query)
    {
        return $query
            ->orderByRaw('CASE WHEN sort_order IS NOT NULL THEN 0 ELSE 1 END')
            ->orderBy('sort_order')
            ->orderByDesc('issued_date');
    }

    // ── Accessors ──

    public function getIsExpiredAttribute(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function getIsValidAttribute(): bool
    {
        return !$this->is_expired;
    }
}
