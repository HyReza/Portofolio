<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            if (!Schema::hasColumn('certificates', 'title_en')) {
                $table->string('title_en')->nullable()->after('title');
            }
            if (!Schema::hasColumn('certificates', 'description_id')) {
                $table->text('description_id')->nullable()->after('title_en');
            }
            if (!Schema::hasColumn('certificates', 'description_en')) {
                $table->text('description_en')->nullable()->after('description_id');
            }
            if (!Schema::hasColumn('certificates', 'skills')) {
                $table->json('skills')->nullable()->after('description_en');
            }
            if (!Schema::hasColumn('certificates', 'category')) {
                $table->string('category')->nullable()->after('skills');
            }
            if (!Schema::hasColumn('certificates', 'category_en')) {
                $table->string('category_en')->nullable()->after('category');
            }
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['title_en', 'description_id', 'description_en', 'skills', 'category', 'category_en']);
        });
    }
};
