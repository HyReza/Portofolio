<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoftSkill extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_id',
        'name_en',
        'description_id',
        'description_en',
        'icon',
        'sort_order',
        'show_in_cv',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'show_in_cv' => 'boolean',
        ];
    }

    // ── Scopes ──

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at');
    }

    public function scopeShowInCv($query)
    {
        return $query->where('show_in_cv', true);
    }
}
