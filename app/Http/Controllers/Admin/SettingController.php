<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        $geminiKey = SiteSetting::getValue('gemini_api_key', '');
        $geminiMasked = $geminiKey ? substr($geminiKey, 0, 8) . '...' . substr($geminiKey, -4) : '';

        $qwenKey = SiteSetting::getValue('qwen_api_key', '');
        $qwenMasked = $qwenKey ? substr($qwenKey, 0, 8) . '...' . substr($qwenKey, -4) : '';

        return Inertia::render('admin/settings/index', [
            'settings' => [
                // Gemini
                'gemini_api_key_masked' => $geminiMasked,
                'gemini_api_key_set' => !empty($geminiKey),
                'gemini_api_valid' => (bool) SiteSetting::getValue('gemini_api_valid', false),
                'gemini_api_error' => SiteSetting::getValue('gemini_api_error', ''),
                'gemini_model' => SiteSetting::getValue('gemini_model', 'gemini-2.0-flash'),
                'ai_gemini_exhausted' => (bool) SiteSetting::getValue('ai_gemini_exhausted', false),

                // Qwen
                'qwen_api_key_masked' => $qwenMasked,
                'qwen_api_key_set' => !empty($qwenKey),
                'qwen_api_valid' => (bool) SiteSetting::getValue('qwen_api_valid', false),
                'qwen_api_error' => SiteSetting::getValue('qwen_api_error', ''),
                'qwen_model' => SiteSetting::getValue('qwen_model', 'qwen-plus'),
                'qwen_endpoint' => SiteSetting::getValue('qwen_endpoint', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'),
                'ai_qwen_exhausted' => (bool) SiteSetting::getValue('ai_qwen_exhausted', false),

                // Legacy compat (maps to gemini exhausted for backward compat)
                'ai_token_exhausted' => (bool) SiteSetting::getValue('ai_gemini_exhausted', false) || (bool) SiteSetting::getValue('ai_token_exhausted', false),

                // General
                'ai_assistant_enabled' => (bool) SiteSetting::getValue('ai_assistant_enabled', true),
            ],
        ]);
    }

    /* ─── Gemini API Key ─── */

    public function updateApiKey(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'gemini_api_key' => ['required', 'string', 'min:10'],
        ]);

        $apiKey = $validated['gemini_api_key'];
        $model = SiteSetting::getValue('gemini_model', 'gemini-2.0-flash');

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    ['parts' => [['text' => 'Hello, respond with just "OK"']]]
                ],
            ]);

            if ($response->successful()) {
                SiteSetting::setValue('gemini_api_key', $apiKey, 'api');
                SiteSetting::setValue('gemini_api_valid', true, 'api');
                SiteSetting::setValue('gemini_api_error', '', 'api');
                SiteSetting::setValue('ai_gemini_exhausted', false, 'api');
                SiteSetting::setValue('ai_token_exhausted', false, 'api');

                return back()->with('success', 'Gemini API Key valid dan berhasil disimpan!');
            } else {
                $error = $response->json('error.message', 'Unknown error');
                SiteSetting::setValue('gemini_api_key', $apiKey, 'api');
                SiteSetting::setValue('gemini_api_valid', false, 'api');
                SiteSetting::setValue('gemini_api_error', $error, 'api');

                return back()->with('error', "Gemini API Key tersimpan tapi tidak valid: {$error}");
            }
        } catch (\Exception $e) {
            SiteSetting::setValue('gemini_api_key', $apiKey, 'api');
            SiteSetting::setValue('gemini_api_valid', false, 'api');
            SiteSetting::setValue('gemini_api_error', $e->getMessage(), 'api');

            return back()->with('error', 'Gagal menguji Gemini API Key: ' . $e->getMessage());
        }
    }

    public function removeApiKey(): RedirectResponse
    {
        SiteSetting::setValue('gemini_api_key', '', 'api');
        SiteSetting::setValue('gemini_api_valid', false, 'api');
        SiteSetting::setValue('gemini_api_error', '', 'api');

        return back()->with('success', 'Gemini API Key dihapus.');
    }

    /* ─── Qwen API Key ─── */

    public function updateQwenApiKey(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'qwen_api_key' => ['required', 'string', 'min:10'],
        ]);

        $apiKey = $validated['qwen_api_key'];
        $model = SiteSetting::getValue('qwen_model', 'qwen-plus');
        $endpoint = SiteSetting::getValue('qwen_endpoint', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions');

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'user', 'content' => 'Hello, respond with just "OK"'],
                    ],
                    'max_tokens' => 10,
                ]);

            if ($response->successful()) {
                SiteSetting::setValue('qwen_api_key', $apiKey, 'api');
                SiteSetting::setValue('qwen_api_valid', true, 'api');
                SiteSetting::setValue('qwen_api_error', '', 'api');
                SiteSetting::setValue('ai_qwen_exhausted', false, 'api');

                return back()->with('success', 'Qwen API Key valid dan berhasil disimpan!');
            } else {
                $error = $response->json('message', $response->json('error.message', 'Unknown error'));
                SiteSetting::setValue('qwen_api_key', $apiKey, 'api');
                SiteSetting::setValue('qwen_api_valid', false, 'api');
                SiteSetting::setValue('qwen_api_error', $error, 'api');

                return back()->with('error', "Qwen API Key tersimpan tapi tidak valid: {$error}");
            }
        } catch (\Exception $e) {
            SiteSetting::setValue('qwen_api_key', $apiKey, 'api');
            SiteSetting::setValue('qwen_api_valid', false, 'api');
            SiteSetting::setValue('qwen_api_error', $e->getMessage(), 'api');

            return back()->with('error', 'Gagal menguji Qwen API Key: ' . $e->getMessage());
        }
    }

    public function removeQwenApiKey(): RedirectResponse
    {
        SiteSetting::setValue('qwen_api_key', '', 'api');
        SiteSetting::setValue('qwen_api_valid', false, 'api');
        SiteSetting::setValue('qwen_api_error', '', 'api');

        return back()->with('success', 'Qwen API Key dihapus.');
    }

    /* ─── AI Settings ─── */

    public function updateAiSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'gemini_model' => ['required', 'string', 'max:100'],
            'qwen_model' => ['required', 'string', 'max:100'],
            'qwen_endpoint' => ['required', 'url', 'max:500'],
            'ai_assistant_enabled' => ['required', 'boolean'],
        ]);

        SiteSetting::setValue('gemini_model', $validated['gemini_model'], 'api');
        SiteSetting::setValue('qwen_model', $validated['qwen_model'], 'api');
        SiteSetting::setValue('qwen_endpoint', $validated['qwen_endpoint'], 'api');
        SiteSetting::setValue('ai_assistant_enabled', $validated['ai_assistant_enabled'], 'api');

        return back()->with('success', 'AI Assistant settings updated.');
    }

    public function resetExhausted(): RedirectResponse
    {
        SiteSetting::setValue('ai_gemini_exhausted', false, 'api');
        SiteSetting::setValue('ai_qwen_exhausted', false, 'api');
        SiteSetting::setValue('ai_token_exhausted', false, 'api');
        return back()->with('success', 'All provider exhaustion flags have been reset.');
    }
}
