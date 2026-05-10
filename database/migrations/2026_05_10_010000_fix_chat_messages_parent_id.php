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
            // Check if reply_to_id exists and rename it to parent_id if it does
            if (Schema::hasColumn('chat_messages', 'reply_to_id')) {
                $table->renameColumn('reply_to_id', 'parent_id');
            } elseif (!Schema::hasColumn('chat_messages', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->constrained('chat_messages')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            if (Schema::hasColumn('chat_messages', 'parent_id')) {
                $table->renameColumn('parent_id', 'reply_to_id');
            }
        });
    }
};
