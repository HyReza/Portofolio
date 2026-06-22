<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'certificates',
            'projects',
            'careers',
            'educations',
            'organizations',
            'achievements',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'show_in_cv')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->boolean('show_in_cv')->default(true)->after('id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'certificates',
            'projects',
            'careers',
            'educations',
            'organizations',
            'achievements',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'show_in_cv')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropColumn('show_in_cv');
                });
            }
        }
    }
};
