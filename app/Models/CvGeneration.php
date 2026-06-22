<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CvGeneration extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_title',
        'company_name',
        'job_description',
        'job_url',
        'language',
        'status',
        'ats_score',
        'ai_provider',
        'ai_tokens_used',
        'raw_ai_response',
        'cv_data',
        'pdf_path',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'cv_data' => 'array',
            'raw_ai_response' => 'array',
            'ats_score' => 'integer',
            'ai_tokens_used' => 'integer',
        ];
    }

    // ── Relationships ──

    public function sections(): HasMany
    {
        return $this->hasMany(CvSection::class)->orderBy('sort_order');
    }

    // ── Scopes ──

    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('created_at');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDrafts($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeFinals($query)
    {
        return $query->where('status', 'final');
    }

    // ── Accessors ──

    public function getFormattedDateAttribute(): string
    {
        return $this->created_at?->format('d M Y, H:i') ?? '';
    }

    public function getShortDescriptionAttribute(): string
    {
        return Str::limit(strip_tags($this->job_description), 150);
    }
}
