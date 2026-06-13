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
        Schema::create('certificate_credential_type', function (Blueprint $table) {
            $table->foreignId('certificate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('credential_type_id')->constrained()->cascadeOnDelete();
            $table->primary(['certificate_id', 'credential_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_credential_type');
    }
};
