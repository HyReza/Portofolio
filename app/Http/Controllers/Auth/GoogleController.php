<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(Request $request)
    {
        $redirectUrl = $request->query('redirect', route('chat'));
        
        // Encode the redirect URL into the state parameter
        $state = base64_encode($redirectUrl);
        
        return Socialite::driver('google')
            ->with(['state' => $state])
            ->redirect();
    }

    public function callback(Request $request)
    {
        // Retrieve the redirect URL from the state parameter
        $state = $request->query('state');
        $decodedUrl = $state ? base64_decode($state) : null;
        $redirectUrl = $decodedUrl ? $this->getSafeRedirectUrl($decodedUrl) : route('chat');

        try {
            // Using stateless() prevents session mismatch (InvalidStateException) on callback
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            \Log::warning('Google OAuth: failed to get user from Google', ['error' => $e->getMessage()]);
            return redirect($redirectUrl)->with('error', 'Gagal login menggunakan Google. Silakan coba lagi.');
        }

        try {
            $user = User::where('email', $googleUser->email)->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleUser->id,
                    'avatar' => $user->avatar ?? $googleUser->avatar,
                ]);
            } else {
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar,
                    'password' => bcrypt(str()->random(16)),
                ]);
            }

            Auth::login($user, true);

            return redirect($redirectUrl);

        } catch (\Exception $e) {
            \Log::error('Google OAuth: login/create failed', [
                'email' => $googleUser->email ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            return redirect($redirectUrl)->with('error', 'Terjadi kesalahan saat memproses login. Silakan coba lagi.');
        }
    }

    /**
     * Ensure the redirect URL is safe to prevent open redirect vulnerabilities.
     */
    private function getSafeRedirectUrl(string $url): string
    {
        if (str_starts_with($url, '/') && !str_starts_with($url, '//')) {
            return $url;
        }

        $appUrl = config('app.url');
        if (str_starts_with($url, $appUrl)) {
            return $url;
        }

        return route('chat');
    }
}
