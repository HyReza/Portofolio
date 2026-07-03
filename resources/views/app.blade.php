<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" translate="no" @class(['dark' => ($appearance ?? 'system') == 'dark', 'notranslate'])>

<head>
    @php
        $locale = app()->getLocale();
        try {
            $profile = \App\Models\Profile::ordered()->get()->keyBy('key');
        } catch (\Exception $e) {
            $profile = collect();
        }

        $pv = function ($key) use ($profile, $locale) {
            if (!isset($profile[$key]))
                return '';
            $p = $profile[$key];
            return $locale === 'id'
                ? ($p->value_id ?: $p->value_en ?: '')
                : ($p->value_en ?: $p->value_id ?: '');
        };

        $profileName = $pv('name') ?: 'Reza Edi Saputra';
        $metaTitle = $pv('meta_site_title') ?: ($profileName . ' - AI Engineer & Full-Stack Developer');

        $rawDesc = $pv('meta_site_description') ?: 'Portfolio profesional Reza Edi Saputra, lulusan S1 Informatika UMPP dengan 3+ tahun pengalaman sebagai Software Engineer.';

        $metaDescription = $rawDesc;
        if (strpos($rawDesc, 'BAHASA INDONESIA:') !== false) {
            $parts = explode('BAHASA INDONESIA:', $rawDesc);
            $cleanDesc = trim($parts[1]);
            if (strpos($cleanDesc, 'ENGLISH:') !== false) {
                $subparts = explode('ENGLISH:', $cleanDesc);
                $cleanDesc = trim($subparts[0]);
            }
            if (strpos($cleanDesc, 'EN:') !== false) {
                $subparts = explode('EN:', $cleanDesc);
                $cleanDesc = trim($subparts[0]);
            }
            $metaDescription = $cleanDesc ?: $rawDesc;
        }

        $metaKeywords = $pv('meta_keywords') ?: 'software engineer, AI engineer, full stack developer, reza edi saputra, reza, rez, edi saputra, reza edi, reza edi saputra software engineer, reza edi saputra AI engineer, reza edi saputra full stack developer, reza edi saputra 2024, reza edi saputra 2025, ';
        $metaAuthor = $pv('meta_author') ?: $profileName;
        $siteName = $pv('meta_site_title') ?: ($profileName . ' Portfolio');

        $profilePhoto = $pv('about_page_photo') ?: $pv('profile_photo') ?: '/assets/img/profil.jpeg';
        $ogImageUrl = filter_var($profilePhoto, FILTER_VALIDATE_URL) ? $profilePhoto : url($profilePhoto);
        $websiteUrl = $pv('website_url') ?: request()->url();
    @endphp
    <!-- Google Tag Manager -->
    <script>(function (w, d, s, l, i) {
            w[l] = w[l] || []; w[l].push({
                'gtm.start':
                    new Date().getTime(), event: 'gtm.js'
            }); var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                    'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', 'GTM-T83R2HVS');</script>
    <!-- End Google Tag Manager -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="google" content="notranslate">

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-5R2LYSZ6QS"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-5R2LYSZ6QS');
    </script>

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function () {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <link rel="icon" href="/assets/img/logo.png" type="image/png">
    <link rel="apple-touch-icon" href="/assets/img/logo.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700|sora:400,500,600,700&display=swap"
        rel="stylesheet" />

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    <x-inertia::head>
        <title inertia>{{ $metaTitle }}</title>
        <meta name="description" content="{{ $metaDescription }}" />
        <meta name="keywords" content="{{ $metaKeywords }}" />
        <meta name="author" content="{{ $metaAuthor }}" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="{{ $websiteUrl }}" />

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ $websiteUrl }}" />
        <meta property="og:title" content="{{ $metaTitle }}" />
        <meta property="og:description" content="{{ $metaDescription }}" />
        <meta property="og:image" content="{{ $ogImageUrl }}" />
        <meta property="og:site_name" content="{{ $siteName }}" />

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="{{ $websiteUrl }}" />
        <meta name="twitter:title" content="{{ $metaTitle }}" />
        <meta name="twitter:description" content="{{ $metaDescription }}" />
        <meta name="twitter:image" content="{{ $ogImageUrl }}" />
    </x-inertia::head>
</head>

<body class="font-sans antialiased">
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T83R2HVS" height="0" width="0"
            style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    <x-inertia::app />
</body>

</html>