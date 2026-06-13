<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class CertificateCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_id',
        'name_en',
        'slug',
    ];

    protected static function booted(): void
    {
        static::creating(function (CertificateCategory $category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name_en ?: $category->name_id);
            }
        });
    }

    // ── Relationships ──

    public function certificates(): BelongsToMany
    {
        return $this->belongsToMany(Certificate::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
