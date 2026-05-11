<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (\App\Models\Profile::all() as $p) {
    echo "KEY: {$p->key}\n";
    echo "ID: {$p->value_id}\n";
    echo "EN: {$p->value_en}\n";
    echo "-----------------------\n";
}
