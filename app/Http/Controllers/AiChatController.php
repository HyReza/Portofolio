<?php

namespace App\Http\Controllers;

use App\Services\AiAssistantService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class AiChatController extends Controller
{
    protected $aiService;

    public function __construct(AiAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Handle chat message request.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:500',
            'lang' => 'nullable|string|in:id,en',
        ]);

        $sessionId = Session::getId();
        $lang = $request->input('lang', 'en');

        $conversation = $this->aiService->getConversation(
            $sessionId,
            $request->ip(),
            $request->userAgent()
        );

        $result = $this->aiService->chat($conversation, $request->message, $lang);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ]);
    }

    /**
     * Get chat history.
     */
    public function history()
    {
        $sessionId = Session::getId();
        $conversation = $this->aiService->getConversation($sessionId);

        $messages = $conversation->messages()
            ->select(['role', 'content', 'created_at'])
            ->get()
            ->map(function ($m) {
                return [
                    'role' => $m->role,
                    'content' => $m->content,
                    'time' => $m->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Clear chat history.
     */
    public function destroy()
    {
        $sessionId = Session::getId();
        $conversation = $this->aiService->getConversation($sessionId);

        $conversation->messages()->delete();
        $conversation->update(['messages_count' => 0]);

        return response()->json([
            'success' => true,
            'message' => 'History cleared',
        ]);
    }
}
