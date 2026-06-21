<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CvGeneration;
use App\Models\CvSection;
use App\Services\CvGeneratorService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CvGeneratorController extends Controller
{
    public function __construct(
        private readonly CvGeneratorService $cvGeneratorService,
    ) {}

    /**
     * History + Generator landing page.
     */
    public function index(Request $request): InertiaResponse
    {
        $query = CvGeneration::query()->latestFirst();

        // Filter by status
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->byStatus($request->input('status'));
        }

        // Search by job title or company
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        $generations = $query->paginate(12)->withQueryString();

        return Inertia::render('admin/cv-generator/index', [
            'generations' => $generations,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
            ],
        ]);
    }

    /**
     * AI generate a new CV.
     */
    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'job_title' => ['required', 'string', 'max:500'],
            'company_name' => ['nullable', 'string', 'max:500'],
            'job_description' => ['required', 'string', 'min:50'],
            'job_url' => ['nullable', 'url', 'max:2048'],
            'language' => ['required', 'in:en,id'],
        ]);

        $result = $this->cvGeneratorService->generateCv(
            jobTitle: $validated['job_title'],
            jobDescription: $validated['job_description'],
            language: $validated['language'],
            companyName: $validated['company_name'] ?? null,
            jobUrl: $validated['job_url'] ?? null,
        );

        if (!$result['success']) {
            return back()->with('error', $result['error'])->withInput();
        }

        return redirect()
            ->route('admin.cv-generator.show', $result['cv_generation']->id)
            ->with('success', 'CV berhasil digenerate! Silakan review dan edit sesuai kebutuhan.');
    }

    /**
     * Editor page — show/edit a generated CV.
     */
    public function show(CvGeneration $cvGeneration): InertiaResponse
    {
        $cvGeneration->load('sections.items');

        $profileData = $this->cvGeneratorService->getProfileData();

        $references = [
            'career' => \App\Models\Career::orderBy('sort_order')->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->position_en ?: $m->position_id,
                'subtitle' => $m->company,
                'date' => ($m->start_date?->format('M Y') ?? '') . ' - ' . ($m->is_current ? 'Present' : ($m->end_date?->format('M Y') ?? ''))
            ]),
            'project' => \App\Models\Project::orderBy('published_at', 'desc')->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title_en ?: $m->title_id,
                'subtitle' => is_array($m->tech_stack) ? implode(', ', $m->tech_stack) : '',
                'date' => $m->published_at?->format('Y') ?? ''
            ]),
            'education' => \App\Models\Education::orderBy('sort_order')->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->institution,
                'subtitle' => $m->degree_en ?: $m->degree,
                'date' => ($m->start_date?->format('Y') ?? '') . ' - ' . ($m->end_date?->format('Y') ?? '')
            ]),
            'certificate' => \App\Models\Certificate::orderBy('sort_order')->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title_en ?: $m->title,
                'subtitle' => $m->issuer,
                'date' => $m->issued_date?->format('M Y') ?? ''
            ]),
            'organization' => \App\Models\Organization::orderBy('sort_order')->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->role_en ?: $m->role,
                'subtitle' => $m->name_en ?: $m->name,
                'date' => ($m->start_date?->format('Y') ?? '') . ' - ' . ($m->end_date?->format('Y') ?? '')
            ]),
            'achievement' => \App\Models\Achievement::orderBy('sort_order')->get()->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title_en ?: $m->title_id,
                'subtitle' => ucfirst($m->type),
                'date' => $m->date?->format('M Y') ?? ''
            ]),
        ];

        return Inertia::render('admin/cv-generator/editor', [
            'cvGeneration' => $cvGeneration,
            'profileData' => $profileData,
            'references' => $references,
        ]);
    }

    /**
     * Save edits from the interactive editor.
     */
    public function update(Request $request, CvGeneration $cvGeneration): RedirectResponse
    {
        $validated = $request->validate([
            'cv_data' => ['required', 'array'],
            'cv_data.professional_summary' => ['nullable', 'string'],
            'cv_data.sections' => ['required', 'array'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        // Update cv_data JSON & sync ats_score
        $cvGeneration->update([
            'cv_data' => $validated['cv_data'],
            'ats_score' => $validated['cv_data']['ats_match_score'] ?? $cvGeneration->ats_score,
            'notes' => $validated['notes'] ?? $cvGeneration->notes,
        ]);

        // Sync sections and items from cv_data
        $this->syncSectionsFromCvData($cvGeneration, $validated['cv_data']['sections'] ?? []);

        return back()->with('success', 'CV draft berhasil disimpan.');
    }

    /**
     * Reorder sections via drag-and-drop.
     */
    public function reorderSections(Request $request, CvGeneration $cvGeneration): RedirectResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['required', 'integer', 'exists:cv_sections,id'],
        ]);

        foreach ($validated['order'] as $index => $sectionId) {
            CvSection::where('id', $sectionId)
                ->where('cv_generation_id', $cvGeneration->id)
                ->update(['sort_order' => $index]);
        }

        // Also update cv_data to match
        $this->rebuildCvDataFromSections($cvGeneration);

        return back()->with('success', 'Urutan section berhasil diubah.');
    }

    /**
     * Change CV status.
     */
    public function updateStatus(Request $request, CvGeneration $cvGeneration): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:draft,final,archived'],
        ]);

        $cvGeneration->update(['status' => $validated['status']]);

        $statusLabels = ['draft' => 'Draft', 'final' => 'Final', 'archived' => 'Archived'];

        return back()->with('success', "Status diubah ke {$statusLabels[$validated['status']]}.");
    }

    /**
     * Delete a CV generation.
     */
    public function destroy(CvGeneration $cvGeneration): RedirectResponse
    {
        // Clean up PDF file if exists
        if ($cvGeneration->pdf_path && \Storage::disk('public')->exists($cvGeneration->pdf_path)) {
            \Storage::disk('public')->delete($cvGeneration->pdf_path);
        }

        $cvGeneration->delete();

        return redirect()
            ->route('admin.cv-generator.index')
            ->with('success', 'CV berhasil dihapus.');
    }

    /**
     * Duplicate a CV generation.
     */
    public function duplicate(CvGeneration $cvGeneration): RedirectResponse
    {
        $newCv = $this->cvGeneratorService->duplicateCv($cvGeneration);

        return redirect()
            ->route('admin.cv-generator.show', $newCv->id)
            ->with('success', 'CV berhasil diduplikasi. Silakan edit sesuai kebutuhan.');
    }

    /**
     * Generate and download CV in multiple formats (PDF, Word, JSON, Markdown).
     */
    public function download(Request $request, CvGeneration $cvGeneration)
    {
        $cvGeneration->load(['sections' => fn($q) => $q->where('is_visible', true)->orderBy('sort_order'), 'sections.items' => fn($q) => $q->where('is_visible', true)->orderBy('sort_order')]);

        $profileData = $this->cvGeneratorService->getProfileData();
        $cvData = $cvGeneration->cv_data;

        // Build sections array for template
        $sections = [];
        foreach ($cvGeneration->sections as $section) {
            $items = [];
            foreach ($section->items as $item) {
                $items[] = [
                    'title' => $item->title,
                    'subtitle' => $item->subtitle,
                    'location' => $item->location,
                    'bullets' => $item->bullets ?? [],
                    'metadata' => $item->metadata ?? [],
                ];
            }
            $sections[] = [
                'type' => $section->type,
                'title' => $section->title,
                'items' => $items,
            ];
        }

        $data = [
            'name' => $profileData['name'],
            'title' => $profileData['title'] ?? null,
            'email' => $profileData['email'],
            'phone' => $profileData['phone'],
            'location' => $profileData['location'],
            'linkedin' => $profileData['linkedin'],
            'github' => $profileData['github'],
            'website' => $profileData['website'],
            'summary' => $cvData['professional_summary'] ?? '',
            'sections' => $sections,
            'language' => $cvGeneration->language,
        ];

        $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $profileData['name'] ?: 'CV');
        $safeJob = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $cvGeneration->job_title);

        $format = $request->input('format', 'pdf');

        if ($format === 'json') {
            $filename = "{$safeName}_CV_{$safeJob}_{$cvGeneration->language}.json";
            return response()->json($data, 200, [
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        if ($format === 'markdown' || $format === 'md') {
            $filename = "{$safeName}_CV_{$safeJob}_{$cvGeneration->language}.md";
            $markdown = $this->generateMarkdownContent($data);
            return response($markdown, 200, [
                'Content-Type' => 'text/markdown',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        if ($format === 'word' || $format === 'doc' || $format === 'docx') {
            $filename = "{$safeName}_CV_{$safeJob}_{$cvGeneration->language}.doc";
            $html = view('cv.word-template', $data)->render();
            return response($html, 200, [
                'Content-Type' => 'application/msword',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        // Default: PDF
        $pdf = Pdf::loadView('cv.ats-template', $data);
        $pdf->setPaper('a4', 'portrait');
        $filename = "{$safeName}_CV_{$safeJob}_{$cvGeneration->language}.pdf";

        if ($request->has('preview')) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }

    /**
     * Export multiple selected CVs as a ZIP archive.
     */
    public function bulkExport(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:cv_generations,id'],
            'format' => ['required', 'string', 'in:pdf,all'],
        ]);

        $ids = $validated['ids'];
        $format = $validated['format'];

        $zipFileName = 'CV_Export_' . time() . '.zip';
        $zipPath = storage_path('app/' . $zipFileName);

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return back()->with('error', 'Gagal membuat berkas ZIP.');
        }

        foreach ($ids as $id) {
            $cvGeneration = CvGeneration::findOrFail($id);
            $cvGeneration->load(['sections' => fn($q) => $q->where('is_visible', true)->orderBy('sort_order'), 'sections.items' => fn($q) => $q->where('is_visible', true)->orderBy('sort_order')]);

            $profileData = $this->cvGeneratorService->getProfileData();
            $cvData = $cvGeneration->cv_data;

            $sections = [];
            foreach ($cvGeneration->sections as $section) {
                $items = [];
                foreach ($section->items as $item) {
                    $items[] = [
                        'title' => $item->title,
                        'subtitle' => $item->subtitle,
                        'location' => $item->location,
                        'bullets' => $item->bullets ?? [],
                        'metadata' => $item->metadata ?? [],
                    ];
                }
                $sections[] = [
                    'type' => $section->type,
                    'title' => $section->title,
                    'items' => $items,
                ];
            }

            $data = [
                'name' => $profileData['name'],
                'title' => $profileData['title'] ?? null,
                'email' => $profileData['email'],
                'phone' => $profileData['phone'],
                'location' => $profileData['location'],
                'linkedin' => $profileData['linkedin'],
                'github' => $profileData['github'],
                'website' => $profileData['website'],
                'summary' => $cvData['professional_summary'] ?? '',
                'sections' => $sections,
                'language' => $cvGeneration->language,
            ];

            $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $profileData['name'] ?: 'CV');
            $safeJob = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $cvGeneration->job_title);
            $baseFilename = "{$safeName}_CV_{$safeJob}_{$cvGeneration->language}_{$cvGeneration->id}";

            // PDF (Always included)
            $pdf = Pdf::loadView('cv.ats-template', $data);
            $pdf->setPaper('a4', 'portrait');
            $zip->addFromString("{$baseFilename}.pdf", $pdf->output());

            if ($format === 'all') {
                // Word
                $html = view('cv.word-template', $data)->render();
                $zip->addFromString("{$baseFilename}.doc", $html);

                // JSON
                $zip->addFromString("{$baseFilename}.json", json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

                // Markdown
                $markdown = $this->generateMarkdownContent($data);
                $zip->addFromString("{$baseFilename}.md", $markdown);
            }
        }

        $zip->close();

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }

    /**
     * Delete multiple selected CVs.
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:cv_generations,id'],
        ]);

        $count = 0;
        foreach ($validated['ids'] as $id) {
            $cv = CvGeneration::find($id);
            if ($cv) {
                if ($cv->pdf_path && \Storage::disk('public')->exists($cv->pdf_path)) {
                    \Storage::disk('public')->delete($cv->pdf_path);
                }
                $cv->delete();
                $count++;
            }
        }

        return back()->with('success', "{$count} CV berhasil dihapus.");
    }

    /**
     * Helper to generate Markdown content for CV.
     */
    private function generateMarkdownContent(array $data): string
    {
        $md = "# {$data['name']}\n";
        if (!empty($data['title'])) {
            $md .= "### {$data['title']}\n\n";
        }

        $contacts = [];
        if (!empty($data['email'])) $contacts[] = "Email: {$data['email']}";
        if (!empty($data['phone'])) $contacts[] = "Phone: {$data['phone']}";
        if (!empty($data['location'])) $contacts[] = "Location: {$data['location']}";
        if (!empty($data['website'])) $contacts[] = "Website: {$data['website']}";
        if (!empty($data['linkedin'])) $contacts[] = "LinkedIn: {$data['linkedin']}";
        if (!empty($data['github'])) $contacts[] = "GitHub: {$data['github']}";

        $md .= implode(" | ", $contacts) . "\n\n";
        $md .= "---\n\n";

        if (!empty($data['summary'])) {
            $md .= "## Professional Summary\n";
            $md .= "{$data['summary']}\n\n";
            $md .= "---\n\n";
        }

        foreach ($data['sections'] as $section) {
            if (empty($section['items'])) continue;
            
            $md .= "## {$section['title']}\n\n";
            
            if (in_array($section['type'], ['skills', 'soft_skills'])) {
                foreach ($section['items'] as $item) {
                    if (!empty($item['title'])) {
                        if (!empty($item['subtitle'])) {
                            $md .= "**{$item['title']}:** {$item['subtitle']}\n\n";
                        } elseif (!empty($item['bullets'])) {
                            $md .= "**{$item['title']}:** " . implode(', ', $item['bullets']) . "\n\n";
                        } else {
                            $md .= "- {$item['title']}\n";
                        }
                    } elseif (!empty($item['bullets'])) {
                        $md .= "- " . implode(', ', $item['bullets']) . "\n\n";
                    }
                }
            } else {
                foreach ($section['items'] as $item) {
                    $md .= "### {$item['title']}\n";
                    if (!empty($item['subtitle']) || !empty($item['location'])) {
                        $sub = [];
                        if (!empty($item['subtitle'])) $sub[] = $item['subtitle'];
                        if (!empty($item['location'])) $sub[] = $item['location'];
                        $md .= "*" . implode(" — ", $sub) . "*\n";
                    }
                    
                    if (!empty($item['bullets'])) {
                        foreach ($item['bullets'] as $bullet) {
                            $md .= "- {$bullet}\n";
                        }
                    }
                    $md .= "\n";
                }
            }
            $md .= "---\n\n";
        }

        return $md;
    }

    /**
     * Regenerate CV with same JD (creates new version).
     */
    public function regenerate(CvGeneration $cvGeneration): RedirectResponse
    {
        $result = $this->cvGeneratorService->generateCv(
            jobTitle: $cvGeneration->job_title,
            jobDescription: $cvGeneration->job_description,
            language: $cvGeneration->language,
            companyName: $cvGeneration->company_name,
            jobUrl: $cvGeneration->job_url,
        );

        if (!$result['success']) {
            return back()->with('error', $result['error']);
        }

        return redirect()
            ->route('admin.cv-generator.show', $result['cv_generation']->id)
            ->with('success', 'CV baru berhasil digenerate! Versi sebelumnya tetap tersimpan di history.');
    }

    /**
     * Generate a single CV item from a reference.
     */
    public function generateItem(Request $request, CvGeneration $cvGeneration): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'source_type' => ['required', 'string', 'in:career,project,education,certificate,organization,achievement,skill,soft_skill'],
            'source_id' => ['required', 'integer'],
        ]);

        $result = $this->cvGeneratorService->generateSingleItem(
            $cvGeneration,
            $validated['source_type'],
            $validated['source_id']
        );

        if (!$result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json(['item' => $result['item']]);
    }

    // ── Private Helpers ──

    /**
     * Sync DB sections/items from edited cv_data JSON.
     */
    private function syncSectionsFromCvData(CvGeneration $cvGeneration, array $sections): void
    {
        // Delete existing and recreate (simplest approach for full JSON sync)
        $cvGeneration->sections()->delete();

        foreach ($sections as $sIndex => $sectionData) {
            $section = $cvGeneration->sections()->create([
                'type' => $sectionData['type'] ?? 'custom',
                'title' => $sectionData['title'] ?? 'Untitled',
                'sort_order' => $sIndex,
                'is_visible' => $sectionData['is_visible'] ?? true,
            ]);

            foreach (($sectionData['items'] ?? []) as $iIndex => $itemData) {
                $section->items()->create([
                    'source_type' => $itemData['source_type'] ?? null,
                    'source_id' => $itemData['source_id'] ?? null,
                    'title' => $itemData['title'] ?? null,
                    'subtitle' => $itemData['subtitle'] ?? null,
                    'location' => $itemData['location'] ?? null,
                    'bullets' => $itemData['bullets'] ?? [],
                    'metadata' => $itemData['metadata'] ?? [],
                    'sort_order' => $iIndex,
                    'is_visible' => $itemData['is_visible'] ?? true,
                ]);
            }
        }
    }

    /**
     * Rebuild the cv_data JSON from current DB sections/items.
     */
    private function rebuildCvDataFromSections(CvGeneration $cvGeneration): void
    {
        $cvGeneration->load('sections.items');
        $cvData = $cvGeneration->cv_data;

        $sections = [];
        foreach ($cvGeneration->sections as $section) {
            $items = [];
            foreach ($section->items as $item) {
                $items[] = [
                    'source_type' => $item->source_type,
                    'source_id' => $item->source_id,
                    'title' => $item->title,
                    'subtitle' => $item->subtitle,
                    'location' => $item->location,
                    'bullets' => $item->bullets ?? [],
                    'metadata' => $item->metadata ?? [],
                    'is_visible' => $item->is_visible,
                ];
            }
            $sections[] = [
                'type' => $section->type,
                'title' => $section->title,
                'items' => $items,
                'is_visible' => $section->is_visible,
            ];
        }

        $cvData['sections'] = $sections;
        $cvGeneration->update(['cv_data' => $cvData]);
    }
}
