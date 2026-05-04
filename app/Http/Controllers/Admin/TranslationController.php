<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TranslationController extends Controller
{
    public function translate(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
            'source' => 'nullable|string',
            'target' => 'required|string',
        ]);

        try {
            $source = $request->source ?? 'id';
            $target = $request->target;
            $text = $request->text;

            $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$source}&tl={$target}&dt=t&q=" . urlencode($text);
            
            $response = Http::get($url);
            
            if ($response->successful()) {
                $result = $response->json();
                $translatedText = '';
                // The translation is usually an array of arrays in the first element
                if (isset($result[0]) && is_array($result[0])) {
                    foreach ($result[0] as $sentence) {
                        if (isset($sentence[0])) {
                            $translatedText .= $sentence[0];
                        }
                    }
                }
                
                return response()->json([
                    'success' => true,
                    'translated' => trim($translatedText)
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to Google Translate.'
            ], 500);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
