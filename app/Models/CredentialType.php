<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class CredentialType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_id',
        'name_en',
        'slug',
    ];

    protected static function booted(): void
    {
        static::creating(function (CredentialType $type) {
            if (empty($type->slug)) {
                $type->slug = Str::slug($type->name_en ?: $type->name_id);
            }
        });
    }

    public function certificates(): BelongsToMany
    {
        return $this->belongsToMany(Certificate::class);
    }
}
