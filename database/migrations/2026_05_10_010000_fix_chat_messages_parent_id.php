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
        $hasReplyToId = Schema::hasColumn('chat_messages', 'reply_to_id');
        $hasParentId = Schema::hasColumn('chat_messages', 'parent_id');

        if ($hasReplyToId && $hasParentId) {
            // Both columns exist — drop the old reply_to_id (parent_id was already added by a previous migration)

            // Check if foreign key exists before dropping it
            $fkExists = \Illuminate\Support\Facades\DB::select(
                "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'chat_messages'
                 AND CONSTRAINT_NAME = 'chat_messages_reply_to_id_foreign'
                 AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
            );

            if (!empty($fkExists)) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->dropForeign(['reply_to_id']);
                });
            }

            Schema::table('chat_messages', function (Blueprint $table) {
                $table->dropColumn('reply_to_id');
            });
        } elseif ($hasReplyToId && !$hasParentId) {
            // Only reply_to_id exists — rename it to parent_id
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->renameColumn('reply_to_id', 'parent_id');
            });
        } elseif (!$hasReplyToId && !$hasParentId) {
            // Neither exists — create parent_id fresh
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->uuid('parent_id')->nullable();
            });
        }
        // If only parent_id exists — nothing to do
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is a one-way fix — no safe reversal needed
    }
};
