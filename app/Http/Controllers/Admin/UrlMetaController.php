<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class UrlMetaController extends Controller
{
    /**
     * Fetch Open Graph metadata from a given URL.
     * Used for auto-populating LinkedIn/Instagram post data.
     */
    public function fetch(Request $request): JsonResponse
    {
        $request->validate(['url' => ['required', 'url']]);

        $url = $request->input('url');

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])
                ->get($url);

            if (! $response->successful()) {
                return response()->json(['error' => 'Failed to fetch URL'], 422);
            }

            $html = $response->body();
            $meta = $this->parseOpenGraph($html);
            $meta['platform'] = $this->detectPlatform($url);

            // Try Instagram oEmbed for better embed support
            if ($meta['platform'] === 'instagram') {
                $meta['embed_html'] = $this->getInstagramEmbed($url);
            }

            // Try LinkedIn embed
            if ($meta['platform'] === 'linkedin') {
                $meta['embed_html'] = $this->getLinkedinEmbed($url);
            }

            return response()->json($meta);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not fetch metadata: '.$e->getMessage()], 422);
        }
    }

    /**
     * Fetch Instagram profile stats (Followers, Following, Posts, Avatar)
     */
    public function fetchIgProfile(Request $request): JsonResponse
    {
        $request->validate(['username' => ['required', 'string']]);
        $username = trim($request->input('username'), '@');
        $url = "https://www.instagram.com/{$username}/";

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])
                ->get($url);

            if (! $response->successful()) {
                return response()->json(['error' => 'Failed to fetch profile'], 422);
            }

            $html = $response->body();

            // Extract from meta description: "1,751 Followers, 343 Following, 17 Posts - See Instagram photos..."
            $followers = '0';
            $following = '0';
            $posts = '0';
            $avatar = null;

            if (preg_match('/<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']/is', $html, $match)) {
                $desc = html_entity_decode($match[1], ENT_QUOTES, 'UTF-8');
                if (preg_match('/([\d\.,MK]+)\s+Followers/i', $desc, $m)) {
                    $followers = $m[1];
                }
                if (preg_match('/([\d\.,MK]+)\s+Following/i', $desc, $m)) {
                    $following = $m[1];
                }
                if (preg_match('/([\d\.,MK]+)\s+Posts/i', $desc, $m)) {
                    $posts = $m[1];
                }
            }

            // Try to extract avatar from og:image
            if (preg_match('/<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']*)["\']/is', $html, $match)) {
                $avatar = html_entity_decode($match[1], ENT_QUOTES, 'UTF-8');
            }

            // Update profiles table
            $keys = [
                'ig_followers' => $followers,
                'ig_following' => $following,
                'ig_posts' => $posts,
            ];

            if ($avatar) {
                $keys['ig_avatar'] = $avatar;
            }

            foreach ($keys as $k => $v) {
                Profile::updateOrCreate(
                    ['key' => $k],
                    ['value_en' => $v, 'value_id' => $v, 'type' => 'text']
                );
            }

            return response()->json($keys);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not fetch profile: '.$e->getMessage()], 422);
        }
    }

    private function parseOpenGraph(string $html): array
    {
        $meta = [
            'title' => null,
            'description' => null,
            'image' => null,
            'type' => null,
            'site_name' => null,
        ];

        // Parse OG tags
        $ogMapping = [
            'og:title' => 'title',
            'og:description' => 'description',
            'og:image' => 'image',
            'og:type' => 'type',
            'og:site_name' => 'site_name',
        ];

        foreach ($ogMapping as $property => $key) {
            if (preg_match('/<meta\s+(?:property|name)=["\']'.preg_quote($property, '/').'["\']\s+content=["\']([^"\']*)["\']|<meta\s+content=["\']([^"\']*?)["\']\s+(?:property|name)=["\']'.preg_quote($property, '/').'["\']/is', $html, $match)) {
                $meta[$key] = html_entity_decode($match[1] ?: $match[2], ENT_QUOTES, 'UTF-8');
            }
        }

        // Fallback to <title> tag
        if (! $meta['title'] && preg_match('/<title>([^<]*)<\/title>/is', $html, $match)) {
            $meta['title'] = html_entity_decode(trim($match[1]), ENT_QUOTES, 'UTF-8');
        }

        // Fallback to meta description
        if (! $meta['description'] && preg_match('/<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']|<meta\s+content=["\']([^"\']*?)["\']\s+name=["\']description["\']/is', $html, $match)) {
            $meta['description'] = html_entity_decode($match[1] ?: $match[2], ENT_QUOTES, 'UTF-8');
        }

        return $meta;
    }

    private function detectPlatform(string $url): string
    {
        if (str_contains($url, 'instagram.com')) {
            return 'instagram';
        }
        if (str_contains($url, 'linkedin.com')) {
            return 'linkedin';
        }
        if (str_contains($url, 'twitter.com') || str_contains($url, 'x.com')) {
            return 'twitter';
        }
        if (str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be')) {
            return 'youtube';
        }

        return 'other';
    }

    private function getInstagramEmbed(string $url): ?string
    {
        try {
            // Instagram oEmbed API (public, no token needed for basic embed HTML)
            $oembedUrl = 'https://api.instagram.com/oembed?url='.urlencode($url).'&omitscript=true';
            $response = Http::timeout(8)->get($oembedUrl);

            if ($response->successful()) {
                $data = $response->json();

                return $data['html'] ?? null;
            }
        } catch (\Exception $e) {
            // Fallback: construct basic embed
        }

        // Fallback embed using iframe
        $cleanUrl = rtrim(strtok($url, '?'), '/');

        return '<blockquote class="instagram-media" data-instgrm-permalink="'.e($cleanUrl).'/" data-instgrm-version="14"></blockquote>';
    }

    private function getLinkedinEmbed(string $url): ?string
    {
        // LinkedIn doesn't have a public oEmbed API
        // Use their embed post iframe approach
        // Extract the post URN from URL patterns like:
        // https://www.linkedin.com/posts/username_title-activity-1234567890_
        // https://www.linkedin.com/feed/update/urn:li:activity:1234567890

        if (preg_match('/activity[:-](\d+)/', $url, $match)) {
            $activityId = $match[1];

            return '<iframe src="https://www.linkedin.com/embed/feed/update/urn:li:activity:'.e($activityId).'" height="600" width="100%" frameborder="0" allowfullscreen="" title="LinkedIn Post"></iframe>';
        }

        // For share URLs: https://www.linkedin.com/posts/...
        // We can try to use the URL directly
        return '<iframe src="'.e($url).'?trk=embed" height="600" width="100%" frameborder="0" allowfullscreen="" title="LinkedIn Post"></iframe>';
    }
}
