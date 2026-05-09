<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SiteSetting;

$settings = SiteSetting::where('key', 'like', 'qwen%')
    ->orWhere('key', 'like', 'gemini%')
    ->get();

header('Content-Type: application/json');
echo json_encode($settings, JSON_PRETTY_PRINT);
