<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_en',
        'role',
        'role_en',
        'start_date',
        'end_date',
        'is_current',
        'description_id',
        'description_en',
        'logo',
        'sort_order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    public function scopeOrdered(Builder $query)
    {
        return $query->orderBy('sort_order', 'asc')
            ->orderBy('start_date', 'desc');
    }
}
