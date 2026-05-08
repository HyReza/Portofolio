<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Educations ──
        Schema::table('educations', function (Blueprint $table) {
            if (!Schema::hasColumn('educations', 'institution_en')) {
                $table->string('institution_en')->nullable();
            }
            if (!Schema::hasColumn('educations', 'degree_en')) {
                $table->string('degree_en')->nullable();
            }
            if (!Schema::hasColumn('educations', 'field_en')) {
                $table->string('field_en')->nullable();
            }
            if (!Schema::hasColumn('educations', 'gpa')) {
                $table->string('gpa')->nullable();
            }
            if (!Schema::hasColumn('educations', 'activities_id')) {
                $table->text('activities_id')->nullable();
            }
            if (!Schema::hasColumn('educations', 'activities_en')) {
                $table->text('activities_en')->nullable();
            }
            if (!Schema::hasColumn('educations', 'description_en')) {
                $table->text('description_en')->nullable();
            }
            if (!Schema::hasColumn('educations', 'type')) {
                $table->string('type')->default('formal');
            }
        });

        // ── Careers ──
        Schema::table('careers', function (Blueprint $table) {
            if (!Schema::hasColumn('careers', 'company')) {
                $table->string('company')->nullable();
            }
            if (!Schema::hasColumn('careers', 'company_en')) {
                $table->string('company_en')->nullable();
            }
            if (!Schema::hasColumn('careers', 'position_id')) {
                $table->string('position_id')->nullable();
            }
            if (!Schema::hasColumn('careers', 'position_en')) {
                $table->string('position_en')->nullable();
            }
            if (!Schema::hasColumn('careers', 'start_date')) {
                $table->date('start_date')->nullable();
            }
            if (!Schema::hasColumn('careers', 'end_date')) {
                $table->date('end_date')->nullable();
            }
            if (!Schema::hasColumn('careers', 'description_id')) {
                $table->text('description_id')->nullable();
            }
            if (!Schema::hasColumn('careers', 'description_en')) {
                $table->text('description_en')->nullable();
            }
            if (!Schema::hasColumn('careers', 'logo')) {
                $table->string('logo')->nullable();
            }
            if (!Schema::hasColumn('careers', 'is_current')) {
                $table->boolean('is_current')->default(false);
            }
            if (!Schema::hasColumn('careers', 'sort_order')) {
                $table->integer('sort_order')->default(0);
            }
        });

        // ── Organizations ──
        Schema::table('organizations', function (Blueprint $table) {
            if (!Schema::hasColumn('organizations', 'name_en')) {
                $table->string('name_en')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'role_en')) {
                $table->string('role_en')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'description_en')) {
                $table->text('description_en')->nullable();
            }
            
            // Fix the mysterious name_id column that is causing "doesn't have a default value"
            if (Schema::hasColumn('organizations', 'name_id')) {
                $table->dropColumn('name_id');
            }
        });
    }

    public function down(): void
    {
        //
    }
};
