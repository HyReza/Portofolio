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
        $apiKey = SiteSetting::getValue('gemini_api_key', '');
        $masked = $apiKey ? substr($apiKey, 0, 8) . '...' . substr($apiKey, -4) : '';

        return Inertia::render('admin/settings/index', [
            'settings' => [
                'gemini_api_key_masked' => $masked,
                'gemini_api_key_set' => !empty($apiKey),
                'gemini_api_valid' => (bool) SiteSetting::getValue('gemini_api_valid', false),
                'gemini_api_error' => SiteSetting::getValue('gemini_api_error', ''),
            ],
        ]);
    }

    public function updateApiKey(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'gemini_api_key' => ['required', 'string', 'min:10'],
        ]);

        $apiKey = $validated['gemini_api_key'];

        // Test the API key
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}", [
                'contents' => [
                    ['parts' => [['text' => 'Hello, respond with just "OK"']]]
                ],
            ]);

            if ($response->successful()) {
                SiteSetting::setValue('gemini_api_key', $apiKey, 'api');
                SiteSetting::setValue('gemini_api_valid', true, 'api');
                SiteSetting::setValue('gemini_api_error', '', 'api');

                return back()->with('success', 'API Key valid dan berhasil disimpan!');
            } else {
                $error = $response->json('error.message', 'Unknown error');
                SiteSetting::setValue('gemini_api_key', $apiKey, 'api');
                SiteSetting::setValue('gemini_api_valid', false, 'api');
                SiteSetting::setValue('gemini_api_error', $error, 'api');

                return back()->with('error', "API Key tersimpan tapi tidak valid: {$error}");
            }
        } catch (\Exception $e) {
            SiteSetting::setValue('gemini_api_key', $apiKey, 'api');
            SiteSetting::setValue('gemini_api_valid', false, 'api');
            SiteSetting::setValue('gemini_api_error', $e->getMessage(), 'api');

            return back()->with('error', 'Gagal menguji API Key: ' . $e->getMessage());
        }
    }

    public function removeApiKey(): RedirectResponse
    {
        SiteSetting::setValue('gemini_api_key', '', 'api');
        SiteSetting::setValue('gemini_api_valid', false, 'api');
        SiteSetting::setValue('gemini_api_error', '', 'api');

        return back()->with('success', 'API Key dihapus.');
    }
}
