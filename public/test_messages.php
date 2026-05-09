<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$messages = \App\Models\AiMessage::orderBy('created_at', 'desc')->limit(15)->get(['id', 'role', 'content', 'created_at']);
foreach ($messages as $m) {
    echo "Time: {$m->created_at} | Role: {$m->role} | Content: {$m->content}\n";
}
