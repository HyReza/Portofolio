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
        Schema::table('blog_comments', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false)->after('content');
        });

        Schema::create('blog_comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('blog_comment_id')->constrained('blog_comments')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'blog_comment_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_comment_likes');

        Schema::table('blog_comments', function (Blueprint $table) {
            $table->dropColumn('is_pinned');
        });
    }
};
