<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    /**
     * Upload a file, auto-convert images to WebP.
     */
    public function upload(UploadedFile $file, string $directory = 'uploads'): array
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');

        $result = [
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'webp_path' => null,
        ];

        // Auto-convert images to WebP if Intervention Image is available
        if ($this->isImage($file) && class_exists(\Intervention\Image\ImageManager::class)) {
            try {
                $result['webp_path'] = $this->convertToWebp($path, $directory);
            } catch (\Exception $e) {
                // Silently fail — original image is still available
                report($e);
            }
        }

        return $result;
    }

    /**
     * Convert an image to WebP format.
     */
    protected function convertToWebp(string $originalPath, string $directory): ?string
    {
        $manager = new \Intervention\Image\ImageManager(
            new \Intervention\Image\Drivers\Gd\Driver()
        );

        $fullPath = Storage::disk('public')->path($originalPath);
        $webpFilename = pathinfo($originalPath, PATHINFO_FILENAME) . '.webp';
        $webpPath = $directory . '/webp/' . $webpFilename;
        $webpFullPath = Storage::disk('public')->path($webpPath);

        // Ensure directory exists
        $webpDir = dirname($webpFullPath);
        if (!is_dir($webpDir)) {
            mkdir($webpDir, 0755, true);
        }

        $manager->decodePath($fullPath)
            ->encodeUsingFileExtension('webp', quality: 80)
            ->save($webpFullPath);

        return $webpPath;
    }

    /**
     * Delete a file and its WebP variant.
     */
    public function delete(?string $path, ?string $webpPath = null): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
        if ($webpPath) {
            Storage::disk('public')->delete($webpPath);
        }
    }

    /**
     * Check if the uploaded file is an image.
     */
    protected function isImage(UploadedFile $file): bool
    {
        return str_starts_with($file->getMimeType(), 'image/');
    }
}
