<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value_id')->nullable();
            $table->text('value_en')->nullable();
            $table->enum('type', ['text', 'html', 'json'])->default('text');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
