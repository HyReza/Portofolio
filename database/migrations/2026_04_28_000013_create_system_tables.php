<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->string('group')->default('general');
            $table->timestamps();

            $table->index('key');
            $table->index('group');
        });

        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->morphs('mediable');
            $table->string('collection')->default('default');
            $table->string('path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('webp_path')->nullable();
            $table->json('metadata')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('ai_chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique();
            $table->json('messages')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index('session_id');
        });

        Schema::create('visitor_achievements', function (Blueprint $table) {
            $table->id();
            $table->string('session_id');
            $table->string('achievement_key');
            $table->timestamp('unlocked_at');
            $table->timestamps();

            $table->unique(['session_id', 'achievement_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitor_achievements');
        Schema::dropIfExists('ai_chat_sessions');
        Schema::dropIfExists('media');
        Schema::dropIfExists('site_settings');
    }
};
