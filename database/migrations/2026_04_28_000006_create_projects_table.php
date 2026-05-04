<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title_id');
            $table->string('title_en');
            $table->text('excerpt_id')->nullable();
            $table->text('excerpt_en')->nullable();
            $table->longText('problem_id')->nullable();
            $table->longText('problem_en')->nullable();
            $table->longText('solution_id')->nullable();
            $table->longText('solution_en')->nullable();
            $table->string('thumbnail')->nullable();
            $table->json('images')->nullable();
            $table->json('tech_stack')->nullable();
            $table->string('demo_url')->nullable();
            $table->string('repo_url')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index('slug');
            $table->index('status');
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
