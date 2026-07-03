<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$locale = 'id';

$val = function($data, $key, $default = '') {
    if (empty($data)) return $default;
    if (is_array($data)) {
        return $data[$key] ?? $default;
    }
    if (is_object($data)) {
        return $data->$key ?? $default;
    }
    return $default;
};

$localizedVal = function($data, $keyId, $keyEn, $default = '') use ($locale, $val) {
    if ($locale === 'id') {
        return $val($data, $keyId) ?: $val($data, $keyEn) ?: $default;
    } else {
        return $val($data, $keyEn) ?: $val($data, $keyId) ?: $default;
    }
};

try {
    $profile = \App\Models\Profile::ordered()->get()->keyBy('key');
} catch (\Exception $e) {
    $profile = collect();
}

$pv = function($key) use ($profile, $locale) {
    if (!isset($profile[$key])) return '';
    $p = $profile[$key];
    return $locale === 'id' 
        ? ($p->value_id ?: $p->value_en ?: '') 
        : ($p->value_en ?: $p->value_id ?: '');
};

$profileName = $pv('name') ?: 'Reza Edi Saputra';
$defaultTitle = $pv('meta_site_title') ?: ($profileName . ' - AI Engineer & Full-Stack Developer');
$rawDesc = $pv('meta_site_description') ?: '';

$defaultDescription = $rawDesc;
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
    $defaultDescription = $cleanDesc ?: $rawDesc;
}

$defaultPhoto = $pv('about_page_photo') ?: $pv('profile_photo') ?: '/assets/img/profil.jpeg';
$ogImageUrl = filter_var($defaultPhoto, FILTER_VALIDATE_URL) ? $defaultPhoto : url($defaultPhoto);
$websiteUrl = $pv('website_url') ?: request()->url();

// Simulate single blog show page
$blog = \App\Models\Blog::with('seoMeta')->first();
if ($blog) {
    // Convert to array to simulate Inertia serialized props
    $blogProps = $blog->toArray();
    
    $metaTitle = $defaultTitle;
    $metaDescription = $defaultDescription;
    
    $seoMeta = $val($blogProps, 'seo_meta');
    $customTitle = $localizedVal($seoMeta, 'meta_title_id', 'meta_title_en');
    $customDesc = $localizedVal($seoMeta, 'meta_description_id', 'meta_description_en');
    $customImage = $val($seoMeta, 'og_image');
    
    $blogTitle = $localizedVal($blogProps, 'title_id', 'title_en');
    $blogExcerpt = $localizedVal($blogProps, 'excerpt_id', 'excerpt_en') ?: strip_tags($localizedVal($blogProps, 'content_id', 'content_en'));
    $blogExcerpt = \Illuminate\Support\Str::limit($blogExcerpt, 160);
    
    $metaTitle = $customTitle ?: ($blogTitle . ' - ' . $profileName);
    $metaDescription = $customDesc ?: ($blogExcerpt ?: $defaultDescription);
    
    $thumbnail = $customImage ?: $val($blogProps, 'thumbnail');
    if ($thumbnail) {
        $ogImageUrl = filter_var($thumbnail, FILTER_VALIDATE_URL) ? $thumbnail : url('storage/' . $thumbnail);
    }
    
    echo "Simulated single blog show:\n";
    echo "Title: $metaTitle\n";
    echo "Description: $metaDescription\n";
    echo "Image: $ogImageUrl\n\n";
} else {
    echo "No blogs found for simulation\n\n";
}

// Simulate certificates list
$certs = \App\Models\Certificate::ordered()->get()->toArray();
if (!empty($certs)) {
    $metaTitle = ($locale === 'id' ? 'Sertifikasi & Kredensial' : 'Certifications & Credentials') . ' - ' . $profileName;
    $certList = [];
    $count = 0;
    foreach ($certs as $cert) {
        $cTitle = $localizedVal($cert, 'title', 'title_en');
        if ($cTitle) {
            $certList[] = $cTitle;
            if (++$count >= 3) break;
        }
    }
    if (!empty($certList)) {
        $metaDescription = ($locale === 'id' 
            ? 'Daftar sertifikasi profesional ' . $profileName . ' termasuk ' . implode(', ', $certList) . ' dan kredensial IT lainnya.'
            : 'List of professional certifications for ' . $profileName . ' including ' . implode(', ', $certList) . ' and other IT credentials.');
    }
    
    echo "Simulated certificates list:\n";
    echo "Title: $metaTitle\n";
    echo "Description: $metaDescription\n\n";
}
