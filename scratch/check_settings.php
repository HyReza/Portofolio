<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\SiteSetting;
use Illuminate\Contracts\Console\Kernel;

$settings = SiteSetting::where('key', 'like', 'qwen%')
    ->orWhere('key', 'like', 'gemini%')
    ->get();

header('Content-Type: application/json');
echo json_encode($settings, JSON_PRETTY_PRINT);
