<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->integer('sort_order')->nullable()->default(null)->change();
        });

        // Set all existing sort_order to NULL (default = order by issued_date)
        DB::table('certificates')->update(['sort_order' => null]);
    }

    public function down(): void
    {
        // Re-assign sequential sort_order
        $certs = DB::table('certificates')->orderBy('id')->get();
        foreach ($certs->values() as $i => $cert) {
            DB::table('certificates')->where('id', $cert->id)->update(['sort_order' => $i]);
        }

        Schema::table('certificates', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->change();
        });
    }
};
