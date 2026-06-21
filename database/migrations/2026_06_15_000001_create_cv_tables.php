<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cv_generations', function (Blueprint $table) {
            $table->id();
            $table->string('job_title', 500);
            $table->string('company_name', 500)->nullable();
            $table->longText('job_description');
            $table->string('job_url', 2048)->nullable();
            $table->enum('language', ['en', 'id'])->default('en');
            $table->enum('status', ['draft', 'final', 'archived'])->default('draft');
            $table->unsignedTinyInteger('ats_score')->nullable();
            $table->string('ai_provider', 50)->nullable();
            $table->unsignedInteger('ai_tokens_used')->default(0);
            $table->json('raw_ai_response')->nullable();
            $table->json('cv_data');
            $table->string('pdf_path', 500)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });

        Schema::create('cv_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_generation_id')->constrained('cv_generations')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title', 255);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['cv_generation_id', 'sort_order']);
        });

        Schema::create('cv_section_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cv_section_id')->constrained('cv_sections')->cascadeOnDelete();
            $table->string('source_type', 100)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('title', 500)->nullable();
            $table->string('subtitle', 500)->nullable();
            $table->string('location', 255)->nullable();
            $table->json('bullets')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['cv_section_id', 'sort_order']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cv_section_items');
        Schema::dropIfExists('cv_sections');
        Schema::dropIfExists('cv_generations');
    }
};
