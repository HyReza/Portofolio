<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = [
        'skill_category_id',
        'name_id',
        'name_en',
        'description_id',
        'description_en',
        'icon',
        'proficiency',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'proficiency' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    // ── Relationships ──

    public function category(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class, 'skill_category_id');
    }

    // ── Scopes ──

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
