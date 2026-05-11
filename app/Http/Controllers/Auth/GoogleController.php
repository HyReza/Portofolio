<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            \Log::warning('Google OAuth: failed to get user from Google', ['error' => $e->getMessage()]);
            return redirect()->route('chat')->with('error', 'Gagal login menggunakan Google. Silakan coba lagi.');
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
                    'password' => bcrypt(str()->random(16))
                ]);
            }

            Auth::login($user, true);

            return redirect()->route('chat');

        } catch (\Exception $e) {
            \Log::error('Google OAuth: login/create failed', [
                'email' => $googleUser->email ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
            return redirect()->route('chat')->with('error', 'Terjadi kesalahan saat memproses login. Silakan coba lagi.');
        }
    }
}
