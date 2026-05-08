<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Achievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_id',
        'title_en',
        'description_id',
        'description_en',
        'icon',
        'date',
        'type',
        'sort_order',
        'show_in_cv',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'sort_order' => 'integer',
            'show_in_cv' => 'boolean',
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

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
