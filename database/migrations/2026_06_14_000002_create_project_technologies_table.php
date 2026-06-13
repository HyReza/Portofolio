<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_technologies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('project_project_technology', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_technology_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['project_id', 'project_technology_id'], 'proj_tech_unique');
        });

        // Migrate existing tech_stack JSON data to new table
        $projects = \DB::table('projects')
            ->whereNotNull('tech_stack')
            ->where('tech_stack', '!=', '[]')
            ->where('tech_stack', '!=', '')
            ->get();

        $techMap = [];

        foreach ($projects as $project) {
            $techStack = json_decode($project->tech_stack, true);
            if (!is_array($techStack)) continue;

            foreach ($techStack as $tech) {
                $trimmed = trim($tech);
                if (empty($trimmed)) continue;

                $key = mb_strtolower($trimmed);

                if (!isset($techMap[$key])) {
                    $slug = \Illuminate\Support\Str::slug($trimmed);

                    // Ensure unique slug
                    $baseSlug = $slug;
                    $counter = 1;
                    while (\DB::table('project_technologies')->where('slug', $slug)->exists()) {
                        $slug = $baseSlug . '-' . $counter++;
                    }

                    $id = \DB::table('project_technologies')->insertGetId([
                        'name' => $trimmed,
                        'slug' => $slug,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $techMap[$key] = $id;
                }

                // Create pivot relationship (avoid duplicates)
                $exists = \DB::table('project_project_technology')
                    ->where('project_id', $project->id)
                    ->where('project_technology_id', $techMap[$key])
                    ->exists();

                if (!$exists) {
                    \DB::table('project_project_technology')->insert([
                        'project_id' => $project->id,
                        'project_technology_id' => $techMap[$key],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_project_technology');
        Schema::dropIfExists('project_technologies');
    }
};
