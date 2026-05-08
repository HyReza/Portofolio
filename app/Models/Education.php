<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Education extends Model
{
    use HasFactory;

    protected $table = 'educations';

    protected $fillable = [
        'institution',
        'institution_en',
        'degree',
        'degree_en',
        'field',
        'field_en',
        'gpa',
        'start_date',
        'end_date',
        'description_id',
        'description_en',
        'activities_id',
        'activities_en',
        'logo',
        'type',
        'sort_order',
        'show_in_cv',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'sort_order' => 'integer',
            'show_in_cv' => 'boolean',
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

    public function scopeChronological($query)
    {
        return $query->orderByDesc('start_date');
    }
}
