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
        Schema::table('chat_messages', function (Blueprint $table) {
            if (! Schema::hasColumn('chat_messages', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            }
            if (! Schema::hasColumn('chat_messages', 'reply_to_id')) {
                $table->foreignId('reply_to_id')->nullable()->constrained('chat_messages')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['reply_to_id']);
            $table->dropColumn(['user_id', 'reply_to_id']);
        });
    }
};
