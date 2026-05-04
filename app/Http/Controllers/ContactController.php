<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $executed = RateLimiter::attempt(
            'contact-form:' . $request->ip(),
            $maxAttempts = 3,
            function() use ($request) {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'email' => 'required|email|max:255',
                    'message' => 'required|string|max:5000',
                ]);

                // Store in database
                Contact::create([
                    'name' => strip_tags($validated['name']),
                    'email' => $validated['email'],
                    'message' => strip_tags($validated['message']),
                    'status' => 'unread'
                ]);

                // TODO: Send email notification (Phase 2B)
            },
            $decaySeconds = 3600 // 1 hour per 3 messages
        );

        if (! $executed) {
            return response()->json([
                'message' => 'Too many messages sent. Please try again later.'
            ], 429);
        }

        return response()->json(['message' => 'Message sent successfully!']);
    }
}
