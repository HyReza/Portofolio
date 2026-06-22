<?php

use App\Models\Profile;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

foreach (Profile::all() as $p) {
    echo "KEY: {$p->key}\n";
    echo "ID: {$p->value_id}\n";
    echo "EN: {$p->value_en}\n";
    echo "-----------------------\n";
}
