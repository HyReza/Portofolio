<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add parent_id for nested replies (uuid)
        Schema::table('chat_messages', function (Blueprint $table) {
            if (! Schema::hasColumn('chat_messages', 'parent_id')) {
                $table->uuid('parent_id')->nullable();
            }
        });

        // Create message_reactions table
        Schema::create('message_reactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('chat_message_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reaction', 50); // emoji
            $table->timestamps();

            // A user can only react once with a specific emoji per message
            $table->unique(['chat_message_id', 'user_id', 'reaction']);
            $table->foreign('chat_message_id')->references('id')->on('chat_messages')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reactions');
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn('parent_id');
        });
    }
};
