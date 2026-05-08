<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('educations', function (Blueprint $table) {
            if (!Schema::hasColumn('educations', 'institution')) {
                $table->string('institution')->nullable();
            }
            if (!Schema::hasColumn('educations', 'degree')) {
                $table->string('degree')->nullable();
            }
            if (!Schema::hasColumn('educations', 'field')) {
                $table->string('field')->nullable();
            }
            if (!Schema::hasColumn('educations', 'start_date')) {
                $table->date('start_date')->nullable();
            }
            if (!Schema::hasColumn('educations', 'end_date')) {
                $table->date('end_date')->nullable();
            }
            if (!Schema::hasColumn('educations', 'description_id')) {
                $table->text('description_id')->nullable();
            }
            if (!Schema::hasColumn('educations', 'logo')) {
                $table->string('logo')->nullable();
            }
            if (!Schema::hasColumn('educations', 'sort_order')) {
                $table->integer('sort_order')->default(0);
            }
        });

        Schema::table('organizations', function (Blueprint $table) {
            if (!Schema::hasColumn('organizations', 'name')) {
                $table->string('name')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'role')) {
                $table->string('role')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'start_date')) {
                $table->date('start_date')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'end_date')) {
                $table->date('end_date')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'is_current')) {
                $table->boolean('is_current')->default(false);
            }
            if (!Schema::hasColumn('organizations', 'description_id')) {
                $table->text('description_id')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'logo')) {
                $table->string('logo')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'sort_order')) {
                $table->integer('sort_order')->default(0);
            }
        });

        Schema::table('careers', function (Blueprint $table) {
            if (!Schema::hasColumn('careers', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->constrained('careers')->nullOnDelete();
            }
            if (!Schema::hasColumn('careers', 'branch_label')) {
                $table->string('branch_label')->nullable();
            }
            if (!Schema::hasColumn('careers', 'branch_color')) {
                $table->string('branch_color')->nullable();
            }
        });
    }

    public function down(): void
    {
        //
    }
};
