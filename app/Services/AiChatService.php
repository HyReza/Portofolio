<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiChatService
{
    /**
     * Generate an AI reply to a user message.
     */
    public function generateReply(string $userMessage, array $chatHistory = []): ?string
    {
        $apiKey = SiteSetting::getValue('GEMINI_API_KEY', config('services.gemini.key'));
        
        if (empty($apiKey)) {
            Log::warning('AI Chat: No Gemini API key configured.');
            return "Maaf, sistem AI sedang offline saat ini.";
        }

        $context = $this->buildContext();
        $systemPrompt = "You are 'Reza-Sync', the AI assistant and digital clone of Reza Edi Saputra. Your role is to answer questions about Reza's professional background, skills, and projects based strictly on the provided context. Be professional, slightly tech-savvy, helpful, and concise. You can answer in Indonesian or English depending on the user's language. If asked something outside the context, politely decline and steer the conversation back to Reza's portfolio. Do not invent information.\n\nContext:\n" . $context;

        $contents = [];
        
        // Add chat history (limit to last 5 messages for context)
        foreach (array_slice($chatHistory, -5) as $msg) {
            $contents[] = [
                'role' => $msg['is_ai'] ? 'model' : 'user',
                'parts' => [['text' => $msg['message']]]
            ];
        }

        // Add current message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]]
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey, [
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]]
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 500,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? "Maaf, saya tidak bisa memproses permintaan Anda saat ini.";
            }

            Log::error('Gemini API Error: ' . $response->body());
            return "Maaf, terjadi kesalahan saat menghubungi server AI.";

        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
            return "Maaf, koneksi ke server AI terputus.";
        }
    }

    /**
     * Build the context string from CMS data.
     */
    private function buildContext(): string
    {
        $profiles = \App\Models\Profile::pluck('value_id', 'key')->toArray();
        $name = $profiles['name'] ?? 'Reza Edi Saputra';
        $bio = $profiles['bio'] ?? '';
        $email = $profiles['email'] ?? '';

        $context = "Name: $name\n";
        $context .= "Bio: $bio\n";
        $context .= "Email: $email\n\n";

        // Skills
        $skills = \App\Models\Skill::pluck('name')->toArray();
        if (!empty($skills)) {
            $context .= "Skills: " . implode(', ', $skills) . "\n\n";
        }

        // Careers
        $careers = \App\Models\Career::orderBy('start_date', 'desc')->get();
        if ($careers->isNotEmpty()) {
            $context .= "Experience:\n";
            foreach ($careers as $career) {
                $context .= "- {$career->position_en} at {$career->company} ({$career->start_date} to " . ($career->end_date ?? 'Present') . ")\n";
            }
            $context .= "\n";
        }

        return $context;
    }
}
