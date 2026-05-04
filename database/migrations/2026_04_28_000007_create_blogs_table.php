<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blogs', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title_id');
            $table->string('title_en');
            $table->longText('content_id')->nullable();
            $table->longText('content_en')->nullable();
            $table->text('excerpt_id')->nullable();
            $table->text('excerpt_en')->nullable();
            $table->string('thumbnail')->nullable();
            $table->unsignedSmallInteger('reading_time')->default(0);
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('view_count')->default(0);
            $table->timestamps();

            $table->index('slug');
            $table->index('status');
        });

        Schema::create('blog_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name_id');
            $table->string('name_en');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('blog_blog_tag', function (Blueprint $table) {
            $table->foreignId('blog_id')->constrained()->cascadeOnDelete();
            $table->foreignId('blog_tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['blog_id', 'blog_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_blog_tag');
        Schema::dropIfExists('blog_tags');
        Schema::dropIfExists('blogs');
    }
};
