<?php

namespace App\Services;

use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;

class ProfileService
{
    public function getAll(): Collection
    {
        return Profile::ordered()->get();
    }

    public function getByKey(string $key): ?Profile
    {
        return $this->getAll()->firstWhere('key', $key);
    }

    public function upsert(string $key, array $data): Profile
    {
        return Profile::updateOrCreate(
            ['key' => $key],
            $data
        );
    }

    public function updateSortOrder(array $orderedIds): void
    {
        foreach ($orderedIds as $index => $id) {
            Profile::where('id', $id)->update(['sort_order' => $index]);
        }
    }

    public function delete(Profile $profile): void
    {
        $profile->seoMeta?->delete();
        $profile->delete();
    }
}
