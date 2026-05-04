<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
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
        $messages = ChatMessage::where('is_show', true)
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('public/chat', [
            'messages' => $messages,
        ]);
    }

    /**
     * Fetch messages as JSON (for polling).
     */
    public function messages()
    {
        $messages = ChatMessage::where('is_show', true)
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
            'name' => 'required|string|max:100',
            'message' => 'required|string|max:1000',
            'email' => 'nullable|email|max:255',
            'avatar' => 'nullable|string|max:500',
            'is_reply' => 'boolean',
            'reply_to' => 'nullable|string|max:100',
        ]);

        $msgId = Str::uuid()->toString();

        $msg = ChatMessage::create([
            'id' => $msgId,
            'name' => $request->name,
            'email' => $request->email,
            'avatar' => $request->avatar,
            'message' => $request->message,
            'is_reply' => $request->boolean('is_reply', false),
            'reply_to' => $request->reply_to,
            'is_show' => true,
        ]);

        // If it's a general message or mentioning the AI, trigger AI reply
        $shouldReply = false;
        if (!$request->boolean('is_reply')) {
            $shouldReply = true;
        } elseif (Str::contains(strtolower($request->reply_to ?? ''), ['reza-sync', 'ai', 'admin'])) {
            $shouldReply = true;
        }

        if ($shouldReply) {
            // Get last few messages for context
            $history = ChatMessage::where('is_show', true)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->reverse()
                ->map(function ($m) {
                    return [
                        'message' => $m->message,
                        'is_ai' => $m->email === 'admin@example.com',
                    ];
                })
                ->toArray();

            // Run AI request in background so it doesn't block the user's request
            dispatch(function () use ($request, $aiService, $history) {
                $replyText = $aiService->generateReply($request->message, $history);
                
                if ($replyText) {
                    ChatMessage::create([
                        'id' => Str::uuid()->toString(),
                        'name' => 'Reza-Sync',
                        'email' => 'admin@example.com', // Admin email indicates AI/Owner
                        'avatar' => '/assets/img/profil.jpeg', // Same avatar
                        'message' => $replyText,
                        'is_reply' => true,
                        'reply_to' => $request->name,
                        'is_show' => true,
                    ]);
                }
            })->afterResponse();
        }

        return response()->json($msg, 201);
    }

    /**
     * Delete a chat message (admin only).
     */
    public function destroy(string $id)
    {
        $msg = ChatMessage::findOrFail($id);
        $msg->delete();

        return response()->json(['success' => true]);
    }
}
