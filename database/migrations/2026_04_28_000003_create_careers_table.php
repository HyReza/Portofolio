<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('careers', function (Blueprint $table) {
            $table->id();
            $table->string('company');
            $table->string('position');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->text('description_id')->nullable();
            $table->text('description_en')->nullable();
            $table->string('logo')->nullable();
            $table->boolean('is_current')->default(false);
            $table->foreignId('parent_id')->nullable()->constrained('careers')->nullOnDelete();
            $table->string('branch_label')->nullable();
            $table->string('branch_color')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('careers');
    }
};
