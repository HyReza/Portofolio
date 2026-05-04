<?php

namespace App\Services;

use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Database\Eloquent\Collection;

class SkillService
{
    public function getAllWithSkills(): Collection
    {
        return SkillCategory::withOrderedSkills()
            ->ordered()
            ->get();
    }

    public function createCategory(array $data): SkillCategory
    {
        return SkillCategory::create($data);
    }

    public function updateCategory(SkillCategory $category, array $data): SkillCategory
    {
        $category->update($data);
        return $category->fresh();
    }

    public function deleteCategory(SkillCategory $category): void
    {
        $category->skills()->delete();
        $category->delete();
    }

    public function createSkill(array $data): Skill
    {
        return Skill::create($data);
    }

    public function updateSkill(Skill $skill, array $data): Skill
    {
        $skill->update($data);
        return $skill->fresh();
    }

    public function deleteSkill(Skill $skill): void
    {
        $skill->delete();
    }
}
