<?php

use App\Models\AiMessage;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$messages = AiMessage::orderBy('created_at', 'desc')->limit(15)->get(['id', 'role', 'content', 'created_at']);
foreach ($messages as $m) {
    echo "Time: {$m->created_at} | Role: {$m->role} | Content: {$m->content}\n";
}
