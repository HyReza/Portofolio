<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Blog;
use Illuminate\Contracts\Console\Kernel;

$blogs = Blog::where('content_id', 'like', '%pacar%')
    ->orWhere('content_id', 'like', '%hubungan%')
    ->orWhere('title_id', 'like', '%pacar%')
    ->get(['id', 'title_id', 'slug']);

echo 'FOUND BLOGS: '.$blogs->count()."\n";
foreach ($blogs as $b) {
    echo "- ID: {$b->id}, Title: {$b->title_id}, Slug: {$b->slug}\n";
}
