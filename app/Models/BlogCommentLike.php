<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogCommentLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'blog_comment_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comment()
    {
        return $this->belongsTo(BlogComment::class, 'blog_comment_id');
    }
}
