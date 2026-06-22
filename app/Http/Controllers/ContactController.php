<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessageNotification;
use App\Models\Contact;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $executed = RateLimiter::attempt(
            'contact-form-v3:'.$request->ip(),
            $maxAttempts = 3,
            function () use ($request) {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'email' => 'required|email|max:255',
                    'message' => 'required|string|max:5000',
                ]);

                // Store in database
                $newContact = Contact::create([
                    'name' => strip_tags($validated['name']),
                    'email' => $validated['email'],
                    'message' => strip_tags($validated['message']),
                    'is_read' => false,
                    'ip_address' => $request->ip(),
                ]);

                // Send email notification
                $profile = Profile::where('key', 'email')->first();
                $toEmail = $profile ? ($profile->value_en ?: $profile->value_id) : env('MAIL_FROM_ADDRESS', 'admin@example.com');

                if ($toEmail) {
                    try {
                        Mail::to($toEmail)->send(new ContactMessageNotification($newContact));
                    } catch (\Exception $e) {
                        // Log error but don't fail the request
                        Log::error('Failed to send contact notification email: '.$e->getMessage());
                    }
                }
            },
            $decaySeconds = 3600 // 1 hour per 3 messages
        );

        if (! $executed) {
            return response()->json([
                'message' => 'Too many messages sent. Please try again later.',
            ], 429);
        }

        return response()->json(['message' => 'Message sent successfully!']);
    }
}
