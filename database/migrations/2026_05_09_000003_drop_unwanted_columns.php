<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (Schema::hasColumn('organizations', 'role_id')) {
                $table->dropColumn('role_id');
            }
        });

        Schema::table('careers', function (Blueprint $table) {
            if (Schema::hasColumn('careers', 'company_id')) {
                $table->dropColumn('company_id');
            }
        });

        Schema::table('educations', function (Blueprint $table) {
            if (Schema::hasColumn('educations', 'institution_id')) {
                $table->dropColumn('institution_id');
            }
            if (Schema::hasColumn('educations', 'degree_id')) {
                $table->dropColumn('degree_id');
            }
            if (Schema::hasColumn('educations', 'field_id')) {
                $table->dropColumn('field_id');
            }
        });
    }

    public function down(): void
    {
        //
    }
};
