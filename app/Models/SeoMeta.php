<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SeoMeta extends Model
{
    use HasFactory;

    protected $table = 'seo_meta';

    protected $fillable = [
        'metaable_type',
        'metaable_id',
        'meta_title_id',
        'meta_title_en',
        'meta_description_id',
        'meta_description_en',
        'og_image',
        'schema_markup',
    ];

    protected function casts(): array
    {
        return [
            'schema_markup' => 'array',
        ];
    }

    public function metaable(): MorphTo
    {
        return $this->morphTo();
    }
}
