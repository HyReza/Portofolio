<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            if (!Schema::hasColumn('skills', 'description_id')) {
                $table->text('description_id')->nullable()->after('name_en');
            }
            if (!Schema::hasColumn('skills', 'description_en')) {
                $table->text('description_en')->nullable()->after('description_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn(['description_id', 'description_en']);
        });
    }
};
