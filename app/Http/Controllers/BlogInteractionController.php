<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\BlogBookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlogInteractionController extends Controller
{
    /**
     * Get comments for a specific blog post.
     */
    public function comments(Blog $blog)
    {
        $comments = $blog->comments()
            ->with(['user:id,name,avatar,role', 'likes'])
            ->withCount('likes')
            ->orderBy('is_pinned', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($comments);
    }

    /**
     * Store a comment on a blog post.
     */
    public function storeComment(Request $request, Blog $blog)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:blog_comments,id',
        ]);

        $comment = $blog->comments()->create([
            'user_id' => Auth::id(),
            'parent_id' => $request->parent_id,
            'content' => $request->content,
        ]);

        return response()->json($comment->load('user:id,name,avatar,role'), 201);
    }

    /**
     * Delete a comment.
     */
    public function destroyComment(BlogComment $comment)
    {
        $user = Auth::user();

        // Check if user is comment owner or admin
        if ($comment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Toggle bookmark state for a blog post.
     */
    public function toggleBookmark(Blog $blog)
    {
        $userId = Auth::id();

        $bookmark = $blog->bookmarks()->where('user_id', $userId)->first();

        if ($bookmark) {
            $bookmark->delete();
            $bookmarked = false;
        } else {
            $blog->bookmarks()->create([
                'user_id' => $userId,
            ]);
            $bookmarked = true;
        }

        return response()->json([
            'bookmarked' => $bookmarked,
            'bookmarks_count' => $blog->bookmarks()->count(),
        ]);
    }

    /**
     * Toggle like state for a blog post.
     */
    public function toggleLike(Blog $blog)
    {
        $userId = Auth::id();

        $like = $blog->likes()->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            $blog->likes()->create([
                'user_id' => $userId,
            ]);
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'likes_count' => $blog->likes()->count(),
        ]);
    }

    /**
     * Pin or unpin a comment.
     */
    public function togglePinComment(BlogComment $comment)
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $comment->update([
            'is_pinned' => !$comment->is_pinned,
        ]);

        return response()->json([
            'is_pinned' => $comment->is_pinned,
            'success' => true
        ]);
    }

    /**
     * Toggle like state for a blog comment.
     */
    public function toggleLikeComment(BlogComment $comment)
    {
        $userId = Auth::id();

        $like = $comment->likes()->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            $comment->likes()->create([
                'user_id' => $userId,
            ]);
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'likes_count' => $comment->likes()->count(),
        ]);
    }
}
