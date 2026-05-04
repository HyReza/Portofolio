<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'name',
        'email',
        'avatar',
        'message',
        'is_reply',
        'reply_to',
        'is_show',
    ];

    protected $casts = [
        'is_reply' => 'boolean',
        'is_show' => 'boolean',
    ];
}
