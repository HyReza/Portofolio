<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name_id');
            $table->string('name_en')->nullable();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('certificate_certificate_category', function (Blueprint $table) {
            $table->id();
            $table->foreignId('certificate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certificate_category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['certificate_id', 'certificate_category_id'], 'cert_cat_unique');
        });

        // Migrate existing category data to new table
        $certificates = DB::table('certificates')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->get();

        $categoryMap = [];

        foreach ($certificates as $cert) {
            $categoryId = $cert->category;
            $categoryEn = $cert->category_en ?? $cert->category;

            $key = mb_strtolower(trim($categoryId));

            if (! isset($categoryMap[$key])) {
                $slug = Str::slug($categoryEn ?: $categoryId);

                // Ensure unique slug
                $baseSlug = $slug;
                $counter = 1;
                while (DB::table('certificate_categories')->where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$counter++;
                }

                $id = DB::table('certificate_categories')->insertGetId([
                    'name_id' => trim($categoryId),
                    'name_en' => trim($categoryEn),
                    'slug' => $slug,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $categoryMap[$key] = $id;
            }

            // Create pivot relationship
            DB::table('certificate_certificate_category')->insert([
                'certificate_id' => $cert->id,
                'certificate_category_id' => $categoryMap[$key],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_certificate_category');
        Schema::dropIfExists('certificate_categories');
    }
};
