<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            if (! Schema::hasColumn('skills', 'name_en')) {
                $table->string('name_en')->nullable()->after('name');
            }
        });

        Schema::table('skills', function (Blueprint $table) {
            if (Schema::hasColumn('skills', 'name')) {
                $table->renameColumn('name', 'name_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('name_en');
            $table->renameColumn('name_id', 'name');
        });
    }
};
