<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Career;
use App\Models\Certificate;
use App\Models\CvGeneration;
use App\Models\CvSection;
use App\Models\Education;
use App\Models\Organization;
use App\Models\Project;
use App\Services\CvGeneratorService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        // Sync ATS scores for all visible CVs dynamically to align index score and editor score
        $profileData = $this->cvGeneratorService->getProfileData();
        foreach ($generations as $cvGeneration) {
            $metrics = $this->cvGeneratorService->calculateAtsScoreAndSuggestions($cvGeneration->cv_data ?? [], $profileData, $cvGeneration->language);
            if ($cvGeneration->ats_score !== $metrics['score'] ||
                ($cvGeneration->cv_data['ats_match_score'] ?? null) !== $metrics['score']) {

                $cvData = $cvGeneration->cv_data;
                $cvData['ats_match_score'] = $metrics['score'];
                $cvData['improvement_suggestions'] = $metrics['suggestions'];
                $cvData['matched_keywords'] = $metrics['matched_keywords'];

                $cvGeneration->update([
                    'ats_score' => $metrics['score'],
                    'cv_data' => $cvData,
                ]);
            }
        }

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
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'job_title' => ['required', 'string', 'max:500'],
            'company_name' => ['nullable', 'string', 'max:500'],
            'job_description' => ['required', 'string', 'min:50'],
            'job_url' => ['nullable', 'url', 'max:2048'],
            'language' => ['required', 'in:en,id'],
            'clarification_answers' => ['nullable', 'array'],
        ]);

        $result = $this->cvGeneratorService->generateCv(
            jobTitle: $validated['job_title'],
            jobDescription: $validated['job_description'],
            language: $validated['language'],
            companyName: $validated['company_name'] ?? null,
            jobUrl: $validated['job_url'] ?? null,
            clarificationAnswers: $validated['clarification_answers'] ?? null,
        );

        if ($request->wantsJson() || $request->ajax()) {
            if (! $result['success']) {
                return response()->json(['error' => $result['error']], 500);
            }
            if (isset($result['need_clarification']) && $result['need_clarification'] === true) {
                return response()->json([
                    'need_clarification' => true,
                    'questions' => $result['questions'],
                ]);
            }

            return response()->json([
                'success' => true,
                'redirect_url' => route('admin.cv-generator.show', $result['cv_generation']->id),
            ]);
        }

        if (! $result['success']) {
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

        // Automatically sync the ATS score to the database if there's any mismatch (for older/existing CVs)
        $metrics = $this->cvGeneratorService->calculateAtsScoreAndSuggestions($cvGeneration->cv_data, $profileData, $cvGeneration->language);
        if ($cvGeneration->ats_score !== $metrics['score'] ||
            ($cvGeneration->cv_data['ats_match_score'] ?? null) !== $metrics['score']) {

            $cvData = $cvGeneration->cv_data;
            $cvData['ats_match_score'] = $metrics['score'];
            $cvData['improvement_suggestions'] = $metrics['suggestions'];
            $cvData['matched_keywords'] = $metrics['matched_keywords'];

            $cvGeneration->update([
                'ats_score' => $metrics['score'],
                'cv_data' => $cvData,
            ]);
        }

        $references = [
            'career' => Career::orderBy('sort_order')->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->position_en ?: $m->position_id,
                'subtitle' => $m->company,
                'date' => ($m->start_date?->format('M Y') ?? '').' - '.($m->is_current ? 'Present' : ($m->end_date?->format('M Y') ?? '')),
            ]),
            'project' => Project::orderBy('published_at', 'desc')->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title_en ?: $m->title_id,
                'subtitle' => is_array($m->tech_stack) ? implode(', ', $m->tech_stack) : '',
                'date' => $m->published_at?->format('Y') ?? '',
            ]),
            'education' => Education::orderBy('sort_order')->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->institution,
                'subtitle' => $m->degree_en ?: $m->degree,
                'date' => ($m->start_date?->format('Y') ?? '').' - '.($m->end_date?->format('Y') ?? ''),
            ]),
            'certificate' => Certificate::orderBy('sort_order')->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title_en ?: $m->title,
                'subtitle' => $m->issuer,
                'date' => $m->issued_date?->format('M Y') ?? '',
            ]),
            'organization' => Organization::orderBy('sort_order')->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->role_en ?: $m->role,
                'subtitle' => $m->name_en ?: $m->name,
                'date' => ($m->start_date?->format('Y') ?? '').' - '.($m->end_date?->format('Y') ?? ''),
            ]),
            'achievement' => Achievement::orderBy('sort_order')->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title_en ?: $m->title_id,
                'subtitle' => ucfirst($m->type),
                'date' => $m->date?->format('M Y') ?? '',
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
            'cv_data.summary_title' => ['nullable', 'string', 'max:255'],
            'cv_data.ats_keywords' => ['nullable', 'array'],
            'cv_data.ats_keywords.*' => ['string'],
            'cv_data.ats_match_score' => ['nullable', 'integer'],
            'cv_data.improvement_suggestions' => ['nullable', 'array'],
            'cv_data.improvement_suggestions.*' => ['string'],
            'cv_data.matched_keywords' => ['nullable', 'array'],
            'cv_data.matched_keywords.*' => ['string'],
            'cv_data.sections' => ['required', 'array'],
            'cv_data.contact_name' => ['nullable', 'string', 'max:255'],
            'cv_data.contact_title' => ['nullable', 'string', 'max:255'],
            'cv_data.contact_email' => ['nullable', 'string', 'max:255'],
            'cv_data.contact_phone' => ['nullable', 'string', 'max:255'],
            'cv_data.contact_location' => ['nullable', 'string', 'max:255'],
            'cv_data.contact_linkedin' => ['nullable', 'string', 'max:500'],
            'cv_data.contact_github' => ['nullable', 'string', 'max:500'],
            'cv_data.contact_website' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $cvData = $request->input('cv_data');
        $rawCvData = json_decode($request->getContent(), true)['cv_data'] ?? [];
        $contactFields = [
            'contact_name',
            'contact_title',
            'contact_email',
            'contact_phone',
            'contact_location',
            'contact_linkedin',
            'contact_github',
            'contact_website',
        ];
        foreach ($contactFields as $field) {
            if (array_key_exists($field, $rawCvData) && $rawCvData[$field] === '') {
                $cvData[$field] = '';
            }
        }

        // Update cv_data JSON & sync ats_score
        $cvGeneration->update([
            'cv_data' => $cvData,
            'ats_score' => $cvData['ats_match_score'] ?? $cvGeneration->ats_score,
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
        $cvGeneration->load(['sections' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order'), 'sections.items' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order')]);

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

        // Helper: use cv_data override if explicitly set (even if empty string),
        // only fall back to profileData if the key doesn't exist or is null in cv_data.
        $contactVal = function (string $field, string $fallbackKey) use ($cvData, $profileData) {
            if (array_key_exists($field, $cvData) && $cvData[$field] !== null) {
                return $cvData[$field]; // user-set value (could be "" if cleared)
            }

            return $profileData[$fallbackKey] ?? '';
        };

        $data = [
            'name' => $contactVal('contact_name', 'name'),
            'title' => $contactVal('contact_title', 'title'),
            'email' => $contactVal('contact_email', 'email'),
            'phone' => $contactVal('contact_phone', 'phone'),
            'location' => $contactVal('contact_location', 'location'),
            'linkedin' => $contactVal('contact_linkedin', 'linkedin'),
            'github' => $contactVal('contact_github', 'github'),
            'website' => $contactVal('contact_website', 'website'),
            'summary' => $cvData['professional_summary'] ?? '',
            'summary_title' => $cvData['summary_title'] ?? null,
            'sections' => $sections,
            'language' => $cvGeneration->language,
            'style_settings' => $cvData['style_settings'] ?? null,
        ];

        $displayName = $cvData['contact_name'] ?? $profileData['name'];
        $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $displayName ?: 'CV');
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

        if (! class_exists('ZipArchive')) {
            $msg = 'Ekstensi PHP ZipArchive tidak aktif pada server PHP Anda. Silakan aktifkan ekstensi "zip" (uncomment "extension=zip" di php.ini) untuk menggunakan fitur ekspor massal.';
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['error' => $msg], 400);
            }

            return back()->with('error', $msg);
        }

        $zipFileName = 'CV_Export_'.time().'.zip';
        $zipPath = storage_path('app/'.$zipFileName);

        $zip = new \ZipArchive;
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            $msg = 'Gagal membuat berkas ZIP.';
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['error' => $msg], 500);
            }

            return back()->with('error', $msg);
        }

        try {
            foreach ($ids as $id) {
                $cvGeneration = CvGeneration::findOrFail($id);
                $cvGeneration->load(['sections' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order'), 'sections.items' => fn ($q) => $q->where('is_visible', true)->orderBy('sort_order')]);

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

                $contactVal = function (string $field, string $fallbackKey) use ($cvData, $profileData) {
                    if (array_key_exists($field, $cvData) && $cvData[$field] !== null) {
                        return $cvData[$field];
                    }

                    return $profileData[$fallbackKey] ?? '';
                };

                $data = [
                    'name' => $contactVal('contact_name', 'name'),
                    'title' => $contactVal('contact_title', 'title'),
                    'email' => $contactVal('contact_email', 'email'),
                    'phone' => $contactVal('contact_phone', 'phone'),
                    'location' => $contactVal('contact_location', 'location'),
                    'linkedin' => $contactVal('contact_linkedin', 'linkedin'),
                    'github' => $contactVal('contact_github', 'github'),
                    'website' => $contactVal('contact_website', 'website'),
                    'summary' => $cvData['professional_summary'] ?? '',
                    'sections' => $sections,
                    'language' => $cvGeneration->language,
                    'style_settings' => $cvData['style_settings'] ?? null,
                ];

                $displayName = $contactVal('contact_name', 'name');
                $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $displayName ?: 'CV');
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
        } catch (\Exception $e) {
            if (file_exists($zipPath)) {
                @unlink($zipPath);
            }
            \Log::error('Bulk export failed: '.$e->getMessage());
            $msg = 'Gagal mengekspor beberapa CV: '.$e->getMessage();
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['error' => $msg], 500);
            }

            return back()->with('error', $msg);
        }

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
        if (! empty($data['title'])) {
            $md .= "### {$data['title']}\n\n";
        }

        $contacts = [];
        if (! empty($data['email'])) {
            $contacts[] = "Email: {$data['email']}";
        }
        if (! empty($data['phone'])) {
            $contacts[] = "Phone: {$data['phone']}";
        }
        if (! empty($data['location'])) {
            $contacts[] = "Location: {$data['location']}";
        }
        if (! empty($data['website'])) {
            $contacts[] = "Website: {$data['website']}";
        }
        if (! empty($data['linkedin'])) {
            $contacts[] = "LinkedIn: {$data['linkedin']}";
        }
        if (! empty($data['github'])) {
            $contacts[] = "GitHub: {$data['github']}";
        }

        $md .= implode(' | ', $contacts)."\n\n";
        $md .= "---\n\n";

        if (! empty($data['summary'])) {
            $summaryTitle = ! empty($data['summary_title']) ? $data['summary_title'] : 'Professional Summary';
            $md .= "## {$summaryTitle}\n";
            $md .= "{$data['summary']}\n\n";
            $md .= "---\n\n";
        }

        foreach ($data['sections'] as $section) {
            if (empty($section['items'])) {
                continue;
            }

            $md .= "## {$section['title']}\n\n";

            if (in_array($section['type'], ['skills', 'soft_skills'])) {
                foreach ($section['items'] as $item) {
                    if (! empty($item['title'])) {
                        if (! empty($item['subtitle'])) {
                            $md .= "**{$item['title']}:** {$item['subtitle']}\n\n";
                        } elseif (! empty($item['bullets'])) {
                            $md .= "**{$item['title']}:** ".implode(', ', $item['bullets'])."\n\n";
                        } else {
                            $md .= "- {$item['title']}\n";
                        }
                    } elseif (! empty($item['bullets'])) {
                        $md .= '- '.implode(', ', $item['bullets'])."\n\n";
                    }
                }
            } else {
                foreach ($section['items'] as $item) {
                    $md .= "### {$item['title']}\n";
                    if (! empty($item['subtitle']) || ! empty($item['location'])) {
                        $sub = [];
                        if (! empty($item['subtitle'])) {
                            $sub[] = $item['subtitle'];
                        }
                        if (! empty($item['location'])) {
                            $sub[] = $item['location'];
                        }
                        $md .= '*'.implode(' — ', $sub)."*\n";
                    }

                    if (! empty($item['bullets'])) {
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
    public function regenerate(Request $request, CvGeneration $cvGeneration)
    {
        $validated = $request->validate([
            'clarification_answers' => ['nullable', 'array'],
        ]);

        $result = $this->cvGeneratorService->generateCv(
            jobTitle: $cvGeneration->job_title,
            jobDescription: $cvGeneration->job_description,
            language: $cvGeneration->language,
            companyName: $cvGeneration->company_name,
            jobUrl: $cvGeneration->job_url,
            clarificationAnswers: $validated['clarification_answers'] ?? null,
        );

        if ($request->wantsJson() || $request->ajax()) {
            if (! $result['success']) {
                return response()->json(['error' => $result['error']], 500);
            }
            if (isset($result['need_clarification']) && $result['need_clarification'] === true) {
                return response()->json([
                    'need_clarification' => true,
                    'questions' => $result['questions'],
                ]);
            }

            return response()->json([
                'success' => true,
                'redirect_url' => route('admin.cv-generator.show', $result['cv_generation']->id),
            ]);
        }

        if (! $result['success']) {
            return back()->with('error', $result['error']);
        }

        return redirect()
            ->route('admin.cv-generator.show', $result['cv_generation']->id)
            ->with('success', 'CV baru berhasil digenerate! Versi sebelumnya tetap tersimpan di history.');
    }

    /**
     * Generate a single CV item from a reference.
     */
    public function generateItem(Request $request, CvGeneration $cvGeneration): JsonResponse
    {
        $validated = $request->validate([
            'source_type' => ['required', 'string', 'in:career,project,education,certificate,organization,achievement,skill,soft_skill'],
            'source_id' => ['required', 'integer'],
            'clarification_answers' => ['nullable', 'array'],
        ]);

        $result = $this->cvGeneratorService->generateSingleItem(
            $cvGeneration,
            $validated['source_type'],
            $validated['source_id'],
            $validated['clarification_answers'] ?? null
        );

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        if (isset($result['need_clarification']) && $result['need_clarification'] === true) {
            return response()->json([
                'need_clarification' => true,
                'questions' => $result['questions'],
            ]);
        }

        return response()->json(['item' => $result['item']]);
    }

    /**
     * Generate a new CV item using AI from custom raw input.
     */
    public function generateCustomItem(Request $request, CvGeneration $cvGeneration): JsonResponse
    {
        $validated = $request->validate([
            'section_type' => ['required', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'raw_input' => ['required', 'string', 'min:3', 'max:2000'],
            'clarification_answers' => ['nullable', 'array'],
        ]);

        $result = $this->cvGeneratorService->generateCustomItem(
            $cvGeneration,
            $validated['section_type'],
            $validated['title'] ?? null,
            $validated['subtitle'] ?? null,
            $validated['raw_input'],
            $validated['clarification_answers'] ?? null
        );

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        if (isset($result['need_clarification']) && $result['need_clarification'] === true) {
            return response()->json([
                'need_clarification' => true,
                'questions' => $result['questions'],
            ]);
        }

        return response()->json(['item' => $result['item']]);
    }

    /**
     * Solve a specific ATS suggestion.
     */
    public function solveSuggestion(Request $request, CvGeneration $cvGeneration): JsonResponse
    {
        $validated = $request->validate([
            'suggestion' => ['nullable', 'string', 'max:1000'],
            'suggestions' => ['nullable', 'array'],
            'suggestions.*' => ['string', 'max:1000'],
            'cv_data' => ['nullable', 'array'],
            'clarification_answers' => ['nullable', 'array'],
        ]);

        if ($request->has('cv_data')) {
            $cvData = $request->input('cv_data');
            $rawCvData = json_decode($request->getContent(), true)['cv_data'] ?? [];
            $contactFields = [
                'contact_name',
                'contact_title',
                'contact_email',
                'contact_phone',
                'contact_location',
                'contact_linkedin',
                'contact_github',
                'contact_website',
            ];
            foreach ($contactFields as $field) {
                if (array_key_exists($field, $rawCvData) && $rawCvData[$field] === '') {
                    $cvData[$field] = '';
                }
            }
            $cvGeneration->update([
                'cv_data' => $cvData,
            ]);
        }

        $suggestionsToSolve = [];
        if (! empty($validated['suggestion'])) {
            $suggestionsToSolve[] = $validated['suggestion'];
        }
        if (! empty($validated['suggestions'])) {
            $suggestionsToSolve = array_merge($suggestionsToSolve, $validated['suggestions']);
        }

        if (empty($suggestionsToSolve)) {
            return response()->json(['error' => 'No suggestions provided.'], 400);
        }

        $result = $this->cvGeneratorService->solveSuggestions(
            $cvGeneration,
            $suggestionsToSolve,
            $validated['clarification_answers'] ?? null
        );

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        if (isset($result['need_clarification']) && $result['need_clarification'] === true) {
            return response()->json([
                'need_clarification' => true,
                'questions' => $result['questions'],
            ]);
        }

        return response()->json([
            'success' => true,
            'cv_data' => $result['cv_data'],
        ]);
    }

    /**
     * Perform granular AI Rewrite on a bullet, item, or section.
     */
    public function aiAction(Request $request, CvGeneration $cvGeneration): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:bullet,item,section,summary'],
            'section_index' => ['required_unless:type,summary', 'nullable', 'integer'],
            'item_index' => ['nullable', 'integer'],
            'bullet_index' => ['nullable', 'integer'],
            'instruction' => ['nullable', 'string', 'max:2000'],
            'cv_data' => ['required', 'array'],
        ]);

        $result = $this->cvGeneratorService->executeAiAction(
            $cvGeneration,
            $validated['type'],
            [
                'section_index' => $validated['section_index'] ?? null,
                'item_index' => $validated['item_index'] ?? null,
                'bullet_index' => $validated['bullet_index'] ?? null,
                'cv_data' => $validated['cv_data'],
            ],
            $validated['instruction'] ?? null
        );

        if (! $result['success']) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $result['data'],
        ]);
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
            $sType = $sectionData['type'] ?? 'custom';
            $section = $cvGeneration->sections()->create([
                'type' => $sType,
                'title' => $sectionData['title'] ?? 'Untitled',
                'sort_order' => $sIndex,
                'is_visible' => $sectionData['is_visible'] ?? true,
            ]);

            foreach (($sectionData['items'] ?? []) as $iIndex => $itemData) {
                $bullets = $itemData['bullets'] ?? [];
                $subtitle = $itemData['subtitle'] ?? null;
                
                // Normalization for skills / soft_skills in backend to ensure consistency
                if (in_array($sType, ['skills', 'soft_skills'])) {
                    if (empty($subtitle) && !empty($bullets)) {
                        $subtitle = is_array($bullets) ? implode(', ', $bullets) : $bullets;
                    }
                    $bullets = [];
                }

                $section->items()->create([
                    'source_type' => $itemData['source_type'] ?? null,
                    'source_id' => $itemData['source_id'] ?? null,
                    'title' => $itemData['title'] ?? null,
                    'subtitle' => $subtitle,
                    'location' => $itemData['location'] ?? null,
                    'bullets' => $bullets,
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
