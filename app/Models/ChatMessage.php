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
        'parent_id',
        'user_id',
        'is_show',
    ];

    protected $casts = [
        'is_reply' => 'boolean',
        'is_show' => 'boolean',
        'user_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class, 'chat_message_id');
    }

    public function parent()
    {
        return $this->belongsTo(ChatMessage::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(ChatMessage::class, 'parent_id');
    }
}
