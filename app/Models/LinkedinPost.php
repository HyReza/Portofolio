<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LinkedinPost extends Model
{
    protected $fillable = [
        'post_url',
        'title',
        'description',
        'thumbnail',
        'likes_count',
        'comments_count',
        'published_at',
        'is_active',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}
