<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\MediaService;
use App\Services\ProfileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
        private readonly MediaService $mediaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('admin/profile/index', [
            'profiles' => $this->profileService->getAll(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:100'],
            'settings.*.value_id' => ['nullable', 'string'],
            'settings.*.value_en' => ['nullable', 'string'],
            'settings.*.type' => ['required', 'in:text,html,json'],
        ]);

        foreach ($validated['settings'] as $setting) {
            $this->profileService->upsert($setting['key'], $setting);
        }

        // Clear the global profile cache so changes appear immediately
        Cache::forget('site_profile');

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Upload profile photo via file upload.
     */
    public function uploadPhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:5120'], // max 5MB
            'key' => ['nullable', 'string', 'in:profile_photo,about_page_photo'],
        ]);

        $key = $request->input('key', 'profile_photo');

        $result = $this->mediaService->upload($request->file('photo'), 'profile');
        $photoPath = '/storage/' . $result['path'];

        // Save to both value_id and value_en (same photo for both languages)
        $this->profileService->upsert($key, [
            'key' => $key,
            'value_id' => $photoPath,
            'value_en' => $photoPath,
            'type' => 'text',
        ]);

        Cache::forget('site_profile');

        return back()->with('success', 'Photo uploaded successfully.');
    }

    public function destroy(Profile $profile): RedirectResponse
    {
        $this->profileService->delete($profile);

        Cache::forget('site_profile');

        return back()->with('success', 'Profile entry deleted.');
    }
}
