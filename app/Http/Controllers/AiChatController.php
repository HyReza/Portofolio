<?php

namespace App\Http\Controllers;

use App\Services\AiAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AiChatController extends Controller
{
    public function __construct(
        private AiAssistantService $aiService
    ) {}

    /**
     * Handle AI chat message.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:500'],
            'lang' => ['sometimes', 'string', 'in:en,id'],
        ]);

        // Get or generate session ID for this visitor
        $sessionId = $request->session()->get('ai_session_v6_id');
        if (!$sessionId) {
            $sessionId = Str::uuid()->toString();
            $request->session()->put('ai_session_v6_id', $sessionId);
        }

        // Rate limit check
        if ($this->aiService->isRateLimited($sessionId)) {
            $lang = $request->input('lang', 'en');
            return response()->json([
                'success' => false,
                'message' => $lang === 'id'
                    ? 'Anda telah mencapai batas pesan harian. Silakan coba lagi besok.'
                    : 'You have reached the daily message limit. Please try again tomorrow.',
            ], 429);
        }

        // Get or create conversation
        $conversation = $this->aiService->getConversation(
            $sessionId,
            $request->ip(),
            $request->userAgent()
        );

        $lang = $request->input('lang', 'en');
        $result = $this->aiService->chat($conversation, $request->input('message'), $lang);

        return response()->json($result, $result['success'] ? 200 : 503);
    }

    /**
     * Get conversation history for current session.
     */
    public function history(Request $request): JsonResponse
    {
        $sessionId = $request->session()->get('ai_session_v6_id');
        if (!$sessionId) {
            return response()->json(['messages' => []]);
        }

        $conversation = $this->aiService->getConversation($sessionId);
        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->limit(50)
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json(['messages' => $messages]);
    }
}
