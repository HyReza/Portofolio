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
        } else if ($this->isImage($file)) {
            // Fallback: Native PHP GD Compression & Resizing
            try {
                $this->compressNativeImage(Storage::disk('public')->path($path), $file->getMimeType());
                $result['size'] = filesize(Storage::disk('public')->path($path));
            } catch (\Exception $e) {
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
     * Native GD Library Image Compression & Resizing fallback.
     * Prevents giant 5MB+ images from slowing down the website.
     */
    protected function compressNativeImage(string $fullPath, string $mime): void
    {
        if (!in_array($mime, ['image/jpeg', 'image/png'])) return;

        $image = $mime === 'image/jpeg' ? @imagecreatefromjpeg($fullPath) : @imagecreatefrompng($fullPath);
        if ($image === false) return;

        $width = imagesx($image);
        $height = imagesy($image);
        $maxWidth = 1920; // 1080p max width for excellent quality

        // Resize if too large
        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int)($height * ($maxWidth / $width));
            
            $resized = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($mime === 'image/png') {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                $transparent = imagecolorallocatealpha($resized, 255, 255, 255, 127);
                imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, $transparent);
            }
            
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        // Save compressed image back to disk
        if ($mime === 'image/jpeg') {
            imagejpeg($image, $fullPath, 85); // 85% high quality
        } else if ($mime === 'image/png') {
            imagepng($image, $fullPath, 8); // PNG compression 0-9
        }
        
        imagedestroy($image);
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
