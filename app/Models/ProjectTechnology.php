<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class ProjectTechnology extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
    ];

    protected static function booted(): void
    {
        static::creating(function (ProjectTechnology $tech) {
            if (empty($tech->slug)) {
                $tech->slug = Str::slug($tech->name);
            }
        });
    }

    // ── Relationships ──

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
