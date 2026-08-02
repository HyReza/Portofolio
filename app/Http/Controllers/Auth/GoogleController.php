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
        if ($request->has('redirect')) {
            session(['login_redirect_url' => $request->query('redirect')]);
            session()->save(); // Explicitly save session before external redirect
        }
        
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            // Using stateless() prevents session mismatch (InvalidStateException) on callback
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            \Log::warning('Google OAuth: failed to get user from Google', ['error' => $e->getMessage()]);

            $redirectUrl = session()->pull('login_redirect_url', route('chat'));
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

            $redirectUrl = session()->pull('login_redirect_url', route('chat'));
            return redirect($redirectUrl);

        } catch (\Exception $e) {
            \Log::error('Google OAuth: login/create failed', [
                'email' => $googleUser->email ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            $redirectUrl = session()->pull('login_redirect_url', route('chat'));
            return redirect($redirectUrl)->with('error', 'Terjadi kesalahan saat memproses login. Silakan coba lagi.');
        }
    }
}
