<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_id',
        'name_en',
        'icon',
        'icon_image',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    // ── Relationships ──

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    // ── Scopes ──

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function scopeWithOrderedSkills($query)
    {
        return $query->with(['skills' => fn($q) => $q->orderBy('sort_order')]);
    }
}
