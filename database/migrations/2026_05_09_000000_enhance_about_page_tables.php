<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Educations: add bilingual fields, GPA, activities ──
        if (! Schema::hasColumn('educations', 'institution_en')) {
            Schema::table('educations', function (Blueprint $table) {
                $table->string('institution_en')->nullable()->after('institution');
                $table->string('degree_en')->nullable()->after('degree');
                $table->string('field_en')->nullable()->after('field');
                $table->string('gpa')->nullable()->after('field_en');
                $table->text('activities_id')->nullable()->after('description_en');
                $table->text('activities_en')->nullable()->after('activities_id');
            });
        }

        // ── Careers: rename position → position_id, add position_en, company_en ──
        if (Schema::hasColumn('careers', 'position')) {
            Schema::table('careers', function (Blueprint $table) {
                $table->renameColumn('position', 'position_id');
            });
        }

        if (! Schema::hasColumn('careers', 'position_en')) {
            Schema::table('careers', function (Blueprint $table) {
                $table->string('position_en')->nullable()->after('position_id');
                $table->string('company_en')->nullable()->after('company');
            });
        }

        // ── Organizations: add bilingual name/role ──
        if (! Schema::hasColumn('organizations', 'name_en')) {
            Schema::table('organizations', function (Blueprint $table) {
                $table->string('name_en')->nullable()->after('name');
                $table->string('role_en')->nullable()->after('role');
            });
        }
    }

    public function down(): void
    {
        Schema::table('educations', function (Blueprint $table) {
            $table->dropColumn(['institution_en', 'degree_en', 'field_en', 'gpa', 'activities_id', 'activities_en']);
        });

        Schema::table('careers', function (Blueprint $table) {
            $table->dropColumn(['position_en', 'company_en']);
        });

        Schema::table('careers', function (Blueprint $table) {
            $table->renameColumn('position_id', 'position');
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['name_en', 'role_en']);
        });
    }
};
