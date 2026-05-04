<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestBookEntry extends Model
{
    protected $fillable = [
        'name',
        'message',
        'avatar_url',
        'ip_address',
    ];
}
