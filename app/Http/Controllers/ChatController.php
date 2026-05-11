<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\MessageReaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Display the chat room page.
     */
    public function index()
    {
        return Inertia::render('public/chat');
    }

    /**
     * Fetch messages as JSON (for polling).
     */
    public function messages()
    {
        // Fetch all messages flat — frontend builds the threaded tree via parent_id
        $messages = ChatMessage::with(['user:id,name,avatar,email,role', 'reactions', 'reactions.user:id,name'])
            ->where('is_show', true)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Store a new chat message and trigger AI reply if applicable.
     */
    public function store(Request $request, \App\Services\AiChatService $aiService)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'parent_id' => 'nullable|uuid|exists:chat_messages,id',
        ]);

        $user = auth()->user();
        $msgId = Str::uuid()->toString();

        $msg = ChatMessage::create([
            'id' => $msgId,
            'user_id' => $user->id,
            'name' => $user->name, // fallback
            'email' => $user->email, // fallback
            'avatar' => $user->avatar, // fallback
            'message' => $request->message,
            'is_reply' => $request->filled('parent_id'),
            'parent_id' => $request->parent_id,
            'is_show' => true,
        ]);

        // Load relations before returning
        $msg->load(['user:id,name,avatar,email', 'reactions']);

        // Trigger AI reply if it's general or AI is mentioned
        $shouldReply = false;
        if (!$request->filled('parent_id')) {
            $shouldReply = true;
        } elseif (Str::contains(strtolower($request->message), ['ai', 'bot', 'admin', 'reza'])) {
            $shouldReply = true;
        }

        if ($shouldReply && !$user->isAdmin()) {
            $history = ChatMessage::where('is_show', true)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->reverse()
                ->map(function ($m) {
                    return [
                        'message' => $m->message,
                        'is_ai' => $m->user?->isAdmin() ?? false,
                    ];
                })
                ->toArray();

            dispatch(function () use ($request, $aiService, $history, $msgId) {
                $replyText = $aiService->generateReply($request->message, $history);
                
                if ($replyText) {
                    // Find admin user to attribute AI reply
                    $admin = \App\Models\User::where('role', \App\Models\User::ROLE_ADMIN)->first();
                    
                    if ($admin) {
                        ChatMessage::create([
                            'id' => Str::uuid()->toString(),
                            'user_id' => $admin->id,
                            'name' => $admin->name,
                            'email' => $admin->email,
                            'avatar' => $admin->avatar,
                            'message' => $replyText,
                            'is_reply' => true,
                            'parent_id' => $msgId,
                            'is_show' => true,
                        ]);
                    }
                }
            })->afterResponse();
        }

        return response()->json($msg, 201);
    }

    /**
     * Edit message — only the message owner can edit their own message.
     * Admin can only edit their own messages (not others').
     */
    public function update(Request $request, string $id)
    {
        $request->validate(['message' => 'required|string|max:1000']);
        
        $msg = ChatMessage::findOrFail($id);
        $user = auth()->user();

        // Only the message owner can edit their own message
        if ($msg->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $msg->update(['message' => $request->message]);
        
        return response()->json($msg->load(['user:id,name,avatar,email,role', 'reactions']));
    }

    /**
     * Delete a chat message.
     */
    public function destroy(string $id)
    {
        $msg = ChatMessage::findOrFail($id);
        $user = auth()->user();

        if (!$user->isAdmin() && $msg->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Reactions and replies will cascade delete due to DB constraints
        $msg->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Toggle Reaction
     */
    public function react(Request $request, string $id)
    {
        $request->validate(['reaction' => 'required|string|max:50']);
        
        $user = auth()->user();
        
        $existing = MessageReaction::where('chat_message_id', $id)
            ->where('user_id', $user->id)
            ->where('reaction', $request->reaction)
            ->first();

        if ($existing) {
            $existing->delete(); // Toggle off
        } else {
            MessageReaction::create([
                'chat_message_id' => $id,
                'user_id' => $user->id,
                'reaction' => $request->reaction
            ]); // Toggle on
        }

        return response()->json(['success' => true]);
    }
}
