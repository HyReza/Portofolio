<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Career;
use App\Models\Certificate;
use App\Models\CvGeneration;
use App\Models\Education;
use App\Models\Organization;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SiteSetting;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\SoftSkill;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CvGeneratorService
{
    /**
     * JSON schema description injected into the AI prompt.
     */
    private const CV_JSON_SCHEMA = <<<'SCHEMA'
{
  "professional_summary": "2-3 sentence summary mirroring JD language",
  "ats_keywords": ["keyword1", "keyword2", "...up to 20 keywords extracted from JD"],
  "ats_match_score": 75,
  "improvement_suggestions": [
    "Saran konkret 1 (misal: Tambahkan keahlian React.js di proyek X)",
    "Saran konkret 2 (misal: Gunakan STAR method di pengalaman Y)",
    "Saran konkret 3..."
  ],
  "sections": [
    {
      "type": "experience|education|skills|projects|certificates|organizations|achievements|soft_skills",
      "title": "Section Heading (e.g. Professional Experience)",
      "items": [
        {
          "source_type": "career|project|education|certificate|organization|achievement|skill|soft_skill",
          "source_id": 1,
          "title": "Main title (e.g. Senior Developer, or Skills Category like 'Programming Languages')",
          "subtitle": "Context line (e.g. Company name, or comma-separated list of skills like 'PHP, Python, JavaScript' for skills sections. Note: for skills/soft_skills sections, always list the skills here and leave bullets as an empty array [])",
          "location": "City, Country (optional)",
          "bullets": [
            "XYZ bullet (leave empty [] for skills and soft_skills sections)"
          ],
          "metadata": {
            "gpa": "3.85",
            "tech_stack": ["Laravel", "React"],
            "issuer": "Google",
            "proficiency": 90
          }
        }
      ]
    }
  ]
}
SCHEMA;

    // ── Public API ──

    /**
     * Generate a new ATS-optimized CV.
     *
     * @return array{success: bool, cv_generation?: CvGeneration, error?: string}
     */
    public function generateCv(
        string $jobTitle,
        string $jobDescription,
        string $language = 'en',
        ?string $companyName = null,
        ?string $jobUrl = null,
        ?array $clarificationAnswers = null,
    ): array {
        // 1. Gather all portfolio data
        $portfolioData = $this->gatherPortfolioData($language);

        // 2. Build the system prompt
        $systemPrompt = $this->buildSystemPrompt(
            $jobTitle,
            $jobDescription,
            $companyName,
            $language,
            $portfolioData,
            $clarificationAnswers,
        );

        // 3. Call AI provider
        $aiResult = $this->callAiWithFallback($systemPrompt, $language);

        if (! $aiResult['success']) {
            return [
                'success' => false,
                'error' => $aiResult['error'] ?? 'All AI providers failed. Please check API keys in Settings.',
            ];
        }

        // 4. Parse the AI response JSON
        $parsedCv = $this->parseAiResponse($aiResult['response']);
        if (! $parsedCv) {
            return [
                'success' => false,
                'error' => 'AI returned an invalid response format. Please try again.',
            ];
        }

        // Check if clarification is needed
        if (isset($parsedCv['need_clarification']) && $parsedCv['need_clarification'] === true) {
            return [
                'success' => true,
                'need_clarification' => true,
                'questions' => $parsedCv['questions'] ?? [],
            ];
        }

        // Calculate real-time ATS metrics to guarantee consistency
        $profileData = $this->getProfileData();
        $metrics = $this->calculateAtsScoreAndSuggestions($parsedCv, $profileData, $language);
        $parsedCv['ats_match_score'] = $metrics['score'];
        $parsedCv['improvement_suggestions'] = $metrics['suggestions'];
        $parsedCv['matched_keywords'] = $metrics['matched_keywords'];

        // 5. Save to database
        $cvGeneration = $this->saveCvGeneration(
            jobTitle: $jobTitle,
            companyName: $companyName,
            jobDescription: $jobDescription,
            jobUrl: $jobUrl,
            language: $language,
            parsedCv: $parsedCv,
            aiProvider: $aiResult['provider'],
            tokensUsed: $aiResult['tokens'] ?? 0,
            rawResponse: $aiResult['raw'] ?? null,
        );

        return [
            'success' => true,
            'cv_generation' => $cvGeneration,
        ];
    }

    /**
     * Duplicate an existing CV generation.
     */
    public function duplicateCv(CvGeneration $source): CvGeneration
    {
        $newCv = $source->replicate(['pdf_path']);
        $newCv->status = 'draft';
        $newCv->job_title = $source->job_title.' (Copy)';
        $newCv->notes = null;
        $newCv->save();

        foreach ($source->sections()->with('items')->get() as $section) {
            $newSection = $section->replicate();
            $newSection->cv_generation_id = $newCv->id;
            $newSection->save();

            foreach ($section->items as $item) {
                $newItem = $item->replicate();
                $newItem->cv_section_id = $newSection->id;
                $newItem->save();
            }
        }

        return $newCv->load('sections.items');
    }

    /**
     * Generate a single CV item from a reference.
     */
    public function generateSingleItem(CvGeneration $cv, string $sourceType, int $sourceId, ?array $clarificationAnswers = null): array
    {
        $lang = $cv->language;
        $l = fn (string $id, string $en) => $lang === 'id' ? ($id ?: $en) : ($en ?: $id);

        $sourceData = '';

        switch ($sourceType) {
            case 'career':
                $model = Career::find($sourceId);
                if (! $model) {
                    return ['success' => false, 'error' => 'Career not found'];
                }
                $sourceData = "Role: {$l($model->position_id ?? '', $model->position_en ?? '')}\n";
                $sourceData .= "Company: {$model->company}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'project':
                $model = Project::find($sourceId);
                if (! $model) {
                    return ['success' => false, 'error' => 'Project not found'];
                }
                $sourceData = "Project: {$l($model->title_id ?? '', $model->title_en ?? '')}\n";
                $sourceData .= "Summary: {$l($model->excerpt_id ?? '', $model->excerpt_en ?? '')}\n";
                $sourceData .= 'Details: '.Str::limit(strip_tags($l($model->content_id ?? '', $model->content_en ?? '')), 1000)."\n";
                $tech = is_array($model->tech_stack) ? implode(', ', $model->tech_stack) : '';
                if ($model->technologies && $model->technologies->isNotEmpty()) {
                    $relTech = $model->technologies->pluck('name')->implode(', ');
                    $tech = $tech ? "{$tech}, {$relTech}" : $relTech;
                }
                if ($tech) {
                    $sourceData .= "Tech: {$tech}\n";
                }
                break;
            case 'education':
                $model = Education::find($sourceId);
                if (! $model) {
                    return ['success' => false, 'error' => 'Education not found'];
                }
                $sourceData = "Institution: {$model->institution}\n";
                $sourceData .= "Degree: {$l($model->degree ?? '', $model->degree_en ?? '')}\n";
                $sourceData .= "Field: {$l($model->field ?? '', $model->field_en ?? '')}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'certificate':
                $model = Certificate::find($sourceId);
                if (! $model) {
                    return ['success' => false, 'error' => 'Certificate not found'];
                }
                $sourceData = "Name: {$l($model->title ?? '', $model->title_en ?? '')}\n";
                $sourceData .= "Issuer: {$model->issuer}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'organization':
                $model = Organization::find($sourceId);
                if (! $model) {
                    return ['success' => false, 'error' => 'Organization not found'];
                }
                $sourceData = "Org: {$l($model->name ?? '', $model->name_en ?? '')}\n";
                $sourceData .= "Role: {$l($model->role ?? '', $model->role_en ?? '')}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'achievement':
                $model = Achievement::find($sourceId);
                if (! $model) {
                    return ['success' => false, 'error' => 'Achievement not found'];
                }
                $sourceData = "Title: {$l($model->title_id ?? '', $model->title_en ?? '')}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            default:
                return ['success' => false, 'error' => 'Unsupported source type'];
        }

        $clarificationPrompt = '';
        if (! empty($clarificationAnswers)) {
            $clarificationPrompt = "\n# PREVIOUS CLARIFICATION Q&A HISTORY\n";
            $clarificationPrompt .= "The user has provided the following answers to your previous validation questions. You MUST use these answers to resolve ambiguities, and DO NOT ask these same questions again:\n";
            foreach ($clarificationAnswers as $item) {
                if (isset($item['question'], $item['answer'])) {
                    $clarificationPrompt .= "- Question: {$item['question']}\n  Answer: {$item['answer']}\n";
                }
            }
            $clarificationPrompt .= "\n";
        }

        $systemPrompt = <<<PROMPT
You are an expert ATS CV writer. The user wants to add/regenerate a single item for their CV based on the following raw portfolio data.

JOB DESCRIPTION CONTEXT:
Job Title: {$cv->job_title}
Company: {$cv->company_name}
JD: {$cv->job_description}

RAW PORTFOLIO DATA (Source Type: {$sourceType}):
{$sourceData}

LANGUAGE: {$lang}
{$clarificationPrompt}
INSTRUCTIONS:
1. Write 2-4 highly impactful bullet points using a diverse set of professional CV writing frameworks: STAR (Situation, Task, Action, Result), XYZ (Accomplished [X] as measured by [Y], by doing [Z]), CAR/PAR (Challenge/Problem, Action, Result), SOAR (Situation, Obstacle, Action, Result), or WHO (What, How, Outcome). Select the best technique matching this item (e.g. XYZ for technical/performance work, STAR/CAR for general development, SOAR for leadership, WHO for integrations). Do not repeat the same style across all bullets; mix them to make it dynamic but extremely professional and consistent.
2. Naturally integrate ATS keywords from the job description context if relevant.
3. If no quantitative metrics exist in raw data, use reasonable conservative estimates prefixed with "~".
4. Ensure extreme professionalism.
5. You must return ONLY valid JSON matching exactly this schema, and nothing else. No markdown wrapping.
6. CLARIFICATION & VALIDATION PROTOCOL:
   - Before generating, evaluate if there are key missing details in the raw portfolio data that are crucial for the target Job Description (e.g., missing specific dates, technologies used, or quantitative results/metrics).
   - If key details are missing or highly ambiguous, and you need to ask questions to clarify or validate the data, you MUST halt generation and ask the user for clarification.
   - To ask for clarification, return a JSON response matching exactly this schema (and nothing else):
     {
       "need_clarification": true,
       "questions": [
         "Short question 1 to validate or fill in missing info...",
         "Short question 2..."
       ]
     }
   - Limit to a maximum of 3 highly relevant, specific, and clear questions.
   - Write all clarification questions based on the target language constraints:
     * If CV language is 'id' (Bahasa Indonesia): Write questions strictly in Bahasa Indonesia.
     * If CV language is 'en' (English): Write questions in professional English, followed by their Indonesian translation in parentheses (e.g., "What was the budget for the project? (Berapa anggaran untuk proyek tersebut?)").
   - If previous Q&A history is present under "PREVIOUS CLARIFICATION Q&A HISTORY" and all your questions have been resolved, proceed with generating the item JSON. If you STILL have new critical questions, you may ask them, but DO NOT repeat any questions already present in the history.

{
  "source_type": "{$sourceType}",
  "source_id": {$sourceId},
  "title": "Main title derived from data",
  "subtitle": "Subtitle/context line",
  "location": "Location (if any)",
  "bullets": [
    "XYZ bullet 1",
    "XYZ bullet 2"
  ],
  "metadata": {}
}
PROMPT;

        $aiResult = $this->callAiWithFallback($systemPrompt, $lang);

        if (! $aiResult['success']) {
            return ['success' => false, 'error' => 'AI Provider Error: '.($aiResult['error'] ?? 'Unknown error')];
        }

        $parsed = json_decode(trim($aiResult['response'], " \t\n\r\0\x0B`"), true);

        // Handle markdown block stripping if needed
        if (! $parsed && preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $aiResult['response'], $matches)) {
            $parsed = json_decode($matches[1], true);
        }

        if (! $parsed) {
            return ['success' => false, 'error' => 'AI returned invalid JSON.'];
        }

        if (isset($parsed['need_clarification']) && $parsed['need_clarification'] === true) {
            return [
                'success' => true,
                'need_clarification' => true,
                'questions' => $parsed['questions'] ?? [],
            ];
        }

        return ['success' => true, 'item' => $parsed];
    }

    /**
     * Get profile data for PDF header.
     */
    public function getProfileData(): array
    {
        $profiles = Profile::ordered()->get()->keyBy('key');

        $getValue = fn (string $key) => $profiles[$key]->value_en ?? $profiles[$key]->value_id ?? '';

        return [
            'name' => $getValue('name') ?: $getValue('full_name'),
            'title' => $getValue('title'),
            'email' => $getValue('email'),
            'phone' => $getValue('phone'),
            'location' => $getValue('location'),
            'github' => $getValue('github_url'),
            'linkedin' => $getValue('linkedin_url'),
            'website' => $getValue('website_url'),
        ];
    }

    // ── Private: Data Gathering ──

    /**
     * Gather all portfolio data from database for AI context.
     */
    private function gatherPortfolioData(string $lang): string
    {
        $parts = [];
        $l = fn (string $id, string $en) => $lang === 'id' ? ($id ?: $en) : ($en ?: $id);

        // Profile
        $profiles = Profile::ordered()->get();
        if ($profiles->isNotEmpty()) {
            $parts[] = '## CANDIDATE PROFILE';
            foreach ($profiles as $p) {
                $val = $l($p->value_id ?? '', $p->value_en ?? '');
                $key = strtolower($p->key);
                if ($val && ! Str::contains($key, ['photo', 'bullet', 'meta', 'typewriter'])) {
                    $parts[] = "- **{$p->key}**: {$val}";
                }
            }
        }

        // Careers
        $careers = Career::where('show_in_cv', true)
            ->with(['children' => fn ($q) => $q->where('show_in_cv', true)->orderBy('sort_order')])
            ->roots()
            ->chronological()
            ->get();

        if ($careers->isNotEmpty()) {
            $parts[] = "\n## WORK EXPERIENCE (Raw Data)";
            foreach ($careers as $c) {
                $position = $l($c->position_id ?? '', $c->position_en ?? '');
                $company = $l($c->company ?? '', $c->company_en ?? '');
                $desc = $l($c->description_id ?? '', $c->description_en ?? '');
                $period = ($c->start_date?->format('M Y') ?? '').' – '.($c->end_date?->format('M Y') ?? 'Present');
                $parts[] = "### [ID:{$c->id}] {$position} at {$company} ({$period})";
                if ($desc) {
                    $parts[] = 'Description: '.Str::limit(strip_tags($desc), 2000);
                }
                if ($c->is_current) {
                    $parts[] = 'Status: Currently employed here';
                }

                foreach ($c->children as $child) {
                    $cpos = $l($child->position_id ?? '', $child->position_en ?? '');
                    $cdesc = $l($child->description_id ?? '', $child->description_en ?? '');
                    $cperiod = ($child->start_date?->format('M Y') ?? '').' – '.($child->end_date?->format('M Y') ?? 'Present');
                    $parts[] = "  - Sub-role [ID:{$child->id}]: {$cpos} ({$cperiod})";
                    if ($cdesc) {
                        $parts[] = '    Description: '.Str::limit(strip_tags($cdesc), 1000);
                    }
                }
            }
        }

        // Projects
        $projects = Project::where('show_in_cv', true)->orderByDesc('published_at')->get();
        if ($projects->isNotEmpty()) {
            $parts[] = "\n## PROJECTS (Raw Data)";
            foreach ($projects as $p) {
                $title = $l($p->title_id ?? '', $p->title_en ?? '');
                $excerpt = $l($p->excerpt_id ?? '', $p->excerpt_en ?? '');
                $content = $l($p->content_id ?? '', $p->content_en ?? '');
                $tech = is_array($p->tech_stack) ? implode(', ', $p->tech_stack) : '';
                $parts[] = "### [ID:{$p->id}] {$title}";
                if ($tech) {
                    $parts[] = "Tech Stack: {$tech}";
                }
                if ($excerpt) {
                    $parts[] = "Summary: {$excerpt}";
                }
                if ($content) {
                    $parts[] = 'Details: '.Str::limit(strip_tags($content), 1500);
                }
                if ($p->demo_url) {
                    $parts[] = "Demo: {$p->demo_url}";
                }
                if ($p->repo_url) {
                    $parts[] = "Repository: {$p->repo_url}";
                }
            }
        }

        // Education
        $educations = Education::where('show_in_cv', true)->chronological()->get();
        if ($educations->isNotEmpty()) {
            $parts[] = "\n## EDUCATION (Raw Data)";
            foreach ($educations as $e) {
                $institution = $l($e->institution ?? '', $e->institution_en ?? '');
                $degree = $l($e->degree ?? '', $e->degree_en ?? '');
                $field = $l($e->field ?? '', $e->field_en ?? '');
                $desc = $l($e->description_id ?? '', $e->description_en ?? '');
                $activities = $l($e->activities_id ?? '', $e->activities_en ?? '');
                $gpa = $e->gpa ? "GPA: {$e->gpa}" : '';
                $period = ($e->start_date?->format('Y') ?? '').' – '.($e->end_date?->format('Y') ?? 'Present');
                $parts[] = "### [ID:{$e->id}] {$degree} in {$field} at {$institution} ({$period}) {$gpa}";
                if ($desc) {
                    $parts[] = 'Description: '.Str::limit(strip_tags($desc), 800);
                }
                if ($activities) {
                    $parts[] = 'Activities: '.Str::limit(strip_tags($activities), 500);
                }
            }
        }

        // Skills
        $skillCategories = SkillCategory::withOrderedSkills()->ordered()->get();
        if ($skillCategories->isNotEmpty()) {
            $parts[] = "\n## TECHNICAL SKILLS (Raw Data)";
            foreach ($skillCategories as $cat) {
                $catName = $l($cat->name_id ?? '', $cat->name_en ?? '');
                $skills = $cat->skills->map(function (Skill $s) use ($l) {
                    $name = $l($s->name_id ?? '', $s->name_en ?? '');

                    return $s->proficiency ? "{$name} (Proficiency: {$s->proficiency}%)" : $name;
                })->filter()->join(', ');
                if ($skills) {
                    $parts[] = "- **{$catName}**: {$skills}";
                }
            }
        }

        // Soft Skills
        $softSkills = SoftSkill::where('show_in_cv', true)->ordered()->get();
        if ($softSkills->isNotEmpty()) {
            $parts[] = "\n## SOFT SKILLS (Raw Data)";
            $list = $softSkills->map(fn ($s) => $l($s->name_id ?? '', $s->name_en ?? ''))->filter()->join(', ');
            $parts[] = $list;
        }

        // Certificates
        $certificates = Certificate::where('show_in_cv', true)->ordered()->get();
        if ($certificates->isNotEmpty()) {
            $parts[] = "\n## CERTIFICATES (Raw Data)";
            foreach ($certificates as $c) {
                $title = $l($c->title ?? '', $c->title_en ?? '');
                $desc = $l($c->description_id ?? '', $c->description_en ?? '');
                $skills = is_array($c->skills) ? implode(', ', $c->skills) : '';
                $date = $c->issued_date?->format('M Y') ?? '';
                $parts[] = "### [ID:{$c->id}] {$title} — issued by {$c->issuer} ({$date})";
                if ($skills) {
                    $parts[] = "Skills: {$skills}";
                }
                if ($desc) {
                    $parts[] = 'Description: '.Str::limit(strip_tags($desc), 500);
                }
                if ($c->credential_url) {
                    $parts[] = "Credential: {$c->credential_url}";
                }
            }
        }

        // Organizations
        $organizations = Organization::where('show_in_cv', true)->ordered()->get();
        if ($organizations->isNotEmpty()) {
            $parts[] = "\n## ORGANIZATIONS (Raw Data)";
            foreach ($organizations as $o) {
                $name = $l($o->name ?? '', $o->name_en ?? '');
                $role = $l($o->role ?? '', $o->role_en ?? '');
                $desc = $l($o->description_id ?? '', $o->description_en ?? '');
                $period = ($o->start_date?->format('Y') ?? '').' – '.($o->end_date?->format('Y') ?? 'Present');
                $parts[] = "- [ID:{$o->id}] **{$role}** at {$name} ({$period})";
                if ($desc) {
                    $parts[] = '  Description: '.Str::limit(strip_tags($desc), 500);
                }
            }
        }

        // Achievements
        $achievements = Achievement::where('show_in_cv', true)->ordered()->get();
        if ($achievements->isNotEmpty()) {
            $parts[] = "\n## ACHIEVEMENTS (Raw Data)";
            foreach ($achievements as $a) {
                $title = $l($a->title_id ?? '', $a->title_en ?? '');
                $desc = $l($a->description_id ?? '', $a->description_en ?? '');
                $date = $a->date?->format('M Y') ?? '';
                $parts[] = "- [ID:{$a->id}] {$title} ({$date})".($desc ? ": {$desc}" : '');
            }
        }

        return implode("\n", $parts);
    }

    // ── Private: Prompt Engineering ──

    /**
     * Build the specialized ATS system prompt.
     */
    private function buildSystemPrompt(
        string $jobTitle,
        string $jobDescription,
        ?string $companyName,
        string $language,
        string $portfolioData,
        ?array $clarificationAnswers = null,
    ): string {
        $langInstruction = $language === 'id'
            ? 'Generate ALL content (summary, bullets, section titles) in Bahasa Indonesia. Use professional Indonesian language. Translate section titles to Indonesian (e.g., "Ringkasan Profesional", "Pengalaman Kerja", "Pendidikan", "Keahlian Teknis", "Proyek", "Sertifikat", "Organisasi", "Pencapaian").'
            : 'Generate ALL content in professional English.';

        $companyLine = $companyName ? "Company: {$companyName}" : 'Company: Not specified';

        $clarificationPrompt = '';
        if (! empty($clarificationAnswers)) {
            $clarificationPrompt = "\n# PREVIOUS CLARIFICATION Q&A HISTORY\n";
            $clarificationPrompt .= "The user has provided the following answers to your previous validation questions. You MUST use these answers to enrich the data, fill in gaps, or avoid guessing, and DO NOT ask these same questions again:\n";
            foreach ($clarificationAnswers as $item) {
                if (isset($item['question'], $item['answer'])) {
                    $clarificationPrompt .= "- Question: {$item['question']}\n  Answer: {$item['answer']}\n";
                }
            }
            $clarificationPrompt .= "\n";
        }

        return <<<PROMPT
# ROLE & MISSION
You are an elite ATS Resume Optimization Engine. Your sole purpose is to transform raw candidate data into a perfectly ATS-optimized, keyword-rich CV that will score maximum points on Applicant Tracking Systems for the specific job posting below.

# TARGET JOB POSTING
Position: {$jobTitle}
{$companyLine}
Job Description:
---
{$jobDescription}
---

# LANGUAGE INSTRUCTION
{$langInstruction}

# PREVIOUS CLARIFICATION Q&A HISTORY
{$clarificationPrompt}

# CANDIDATE RAW DATA (Portfolio Database)
The following is the candidate's complete professional data extracted from their portfolio database. Each entry has an [ID:X] reference. You MUST preserve these IDs in your output as source_id.

{$portfolioData}

# CRITICAL INSTRUCTIONS

## 1. COMPREHENSIVE DATA ANALYSIS & STRICT 1-PAGE LIMIT (CRITICAL)
- You have been provided with the candidate's ENTIRE portfolio database (thousands of data points potentially).
- You MUST deeply analyze ALL provided data, but your output MUST strictly fit on 1 SINGLE PAGE (Maximum 2 pages ONLY if absolutely forced by the sheer volume of highly critical JD requirements).
- To achieve this: ONLY select the top 3-4 most impactful work experiences, 2-3 most relevant projects, and consolidate skills.
- Completely omit older, weaker, or irrelevant data. Quality over quantity is paramount.
- **Strict Length Constraints**: 
  - Keep each bullet point strictly between 10 to 22 words. Longer bullets will fail the 1-page requirement.
  - Write exactly 2-3 bullet points for each work experience, and exactly 1-2 bullet points for each project.
  - Consolidate similar skills to prevent the skills section from pushing the CV to the next page.

## 2. ATS KEYWORD EXTRACTION & INTEGRATION
- Extract the top 15-20 ATS-critical keywords from the job description
- Include: required skills, tools, frameworks, certifications, methodologies, action verbs, and domain-specific terminology
- These keywords MUST be naturally woven into bullet points, summary, and skills section

## 3. DIVERSE CV WRITING TECHNIQUES (STAR, XYZ, CAR, PAR, SOAR, WHO, hybrid)
Every single bullet point MUST be highly impactful and utilize a diverse set of professional CV writing frameworks. Do not repeat the same style. Adapt the technique to the type of accomplishment:
- **XYZ Formula (Google-style)**: "Accomplished [X] as measured by [Y], by doing [Z]" — Best for technical accomplishments, performance optimizations, speedups, and backend engineering achievements.
- **STAR Method**: (Situation, Task, Action, Result) — Best for complex workflows, feature development, migration projects, and showing end-to-end responsibility.
- **CAR/PAR Method**: (Challenge/Problem, Action, Result) — Best for debugging, resolving database bottlenecks, security hardening, and refactoring.
- **SOAR Method**: (Situation, Obstacle, Action, Result) — Best for leadership achievements, leading small teams, managing tight deadlines, or overcoming system limitations.
- **WHO Formula**: (What was done, How it was done, Outcomes achieved) — Best for integrations, collaborative accomplishments, and frontend/full-stack feature delivery.
- **Action-Verb Direct Hybrid**: A clean combination of a strong action verb + business impact + technology stack.

Writing Guidelines:
- Start each bullet point with a STRONG, ACTIVE, VARIED ACTION VERB (e.g., *Spearheaded, Engineered, Architected, Optimized, Overhauled, Accelerated, Streamlined, Decentralized, Pioneered*). NEVER use weak verbs like "Worked on", "Helped with", "Responsible for", or repeat the same verb across the section.
- MUST contain a QUANTITATIVE METRIC (percentage, dollar amount, hours saved, response time decreased, page load speedup, server cost reduction, user base count). If raw data lacks metrics, generate a PLAUSIBLE CONSERVATIVE ESTIMATE prefixed with "~".
- Keep bullets punchy, professional, and naturally integrated with JD keywords.

Example 1 (XYZ): "Spearheaded migration of 3 legacy monolithic applications to microservices, reducing deployment time by ~40% and achieving 99.9% uptime."
Example 2 (CAR): "Resolved database bottlenecks by implementing Redis caching, decreasing average query response time by ~60% across 5 core APIs."
Example 3 (WHO): "Integrated Stripe payment gateway using Laravel webhooks, securing transaction processing flow for ~12k monthly active users."
Example 4 (SOAR): "Led development of emergency feature release under a tight 2-week deadline, delivering the product ~3 days early with 0 critical bugs."

## 4. SECTION SELECTION & ORDERING
- ONLY include sections that are RELEVANT to the job posting
- Order sections by RELEVANCE to the JD (most relevant first)
- Suggested order for most tech roles: Summary → Experience → Skills → Projects → Education → Certificates
- If the JD emphasizes education/certifications, move them higher
- Omit sections with no relevant data

## 5. KEYWORD INTEGRATION RULES
- Each experience/project entry: minimum 3-5 JD keywords naturally embedded
- Professional Summary: must contain top 5 most critical JD keywords
- Skills section: JD-mentioned skills listed FIRST, then supplementary skills
- DO NOT keyword-stuff — every keyword must read naturally in context and sound like it was written by a human expert.
- DO NOT repeat the same keyword-phrase more than 3 times across the entire CV

## 6. PROFESSIONAL SUMMARY
- Write a highly professional, punchy summary of exactly 2-3 sentences matching the JD's tone.
- Include years of experience, core competence, and key accomplishments.
- Should read like a senior recruiter wrote it.

## 7. QUANTIFICATION MANDATE
- EVERY bullet must contain at least ONE number/metric
- Prefer: percentages, dollar amounts, user counts, time savings, team sizes
- If raw data lacks metrics, generate PLAUSIBLE CONSERVATIVE estimates
- Mark estimates conceptually (the user can edit them later)

## 8. SKILLS CLUSTERING
- Group into categories: "Languages & Frameworks", "Tools & Platforms", "Databases", "Methodologies", etc.
- JD-matching skills appear first in each category
- Include proficiency context where available
- For each skills/soft_skills category, put the category name in 'title', the list of skills as a comma-separated string in 'subtitle', and keep the 'bullets' array completely empty []. Do NOT output any bullet points for skills sections.

## 9. DYNAMIC ATS SCORING & IMPROVEMENT SUGGESTIONS
- **ats_match_score**: You MUST calculate a realistic match score from 0 to 100 based on the percentage of JD keywords covered in the CV, matching technical stack, and required experience. Do NOT default to 85. The score must reflect the actual candidate fit (e.g., lower if missing critical components, higher only if matching almost all criteria).
- **improvement_suggestions**: Provide 3-5 concrete, actionable suggestions in the target language explaining how the user can edit or enhance this CV to achieve a 100% ATS score. Each suggestion should reference specific keywords, projects, or experiences to add or rewrite (e.g. "Tambahkan sertifikasi Kubernetes", "Quantify accomplishments for Senior Developer role", "Include keywords like Node.js").

## 10. OUTPUT FORMAT
Respond with ONLY valid JSON matching this exact schema. No markdown, no explanation, no code fences.

{$this->getJsonSchemaDescription()}

IMPORTANT:
- source_id must match the [ID:X] from the raw data
- source_type must match the data category (career, project, education, certificate, organization, achievement)
- For skills section, use source_type "skill" and set source_id to null
- For soft_skills section, use source_type "soft_skill" and set source_id to null
- Each section type must be one of: experience, education, skills, projects, certificates, organizations, achievements, soft_skills, summary
- Bullets array should have 2-3 bullets per experience entry, 1-2 per project entry

## 11. CLARIFICATION & VALIDATION PROTOCOL (CRITICAL)
- You MUST be highly proactive in asking clarification questions. If the raw portfolio data is missing any key context, specific technologies, project scopes, role responsibilities, or quantitative achievements/metrics that are relevant to the target Job Description, DO NOT guess or hallucinate.
- You MUST halt execution and ask the user validation questions to gather this information first.
- To ask for clarification, return a JSON response matching exactly this schema (and nothing else):
  {
    "need_clarification": true,
    "questions": [
      "Pertanyaan spesifik tentang info yang kurang...",
      "Pertanyaan lain..."
    ]
  }
- Limit to a maximum of 5 highly specific, clear, and action-oriented questions.
- Write all clarification questions based on the target language constraints:
  * If CV language is 'id' (Bahasa Indonesia): Write questions strictly in Bahasa Indonesia.
  * If CV language is 'en' (English): Write questions in professional English, followed by their Indonesian translation in parentheses (e.g., "What was your main role in this project? (Apa peran utama Anda dalam proyek ini?)").
- If previous Q&A history is present under "PREVIOUS CLARIFICATION Q&A HISTORY", evaluate the user's answers. If they successfully resolve your questions, proceed with generating the CV JSON. If you STILL need further details or have new questions, you may ask them (up to 5), but NEVER repeat the same questions that are already in the Q&A history.
PROMPT;
    }

    /**
     * Get the JSON schema description for the AI prompt.
     */
    private function getJsonSchemaDescription(): string
    {
        return self::CV_JSON_SCHEMA;
    }

    // ── Private: AI Calling ──

    /**
     * Call AI providers with automatic fallback (Gemini → Qwen).
     *
     * @return array{success: bool, response?: string, provider?: string, tokens?: int, raw?: array, error?: string}
     */
    private function callAiWithFallback(string $systemPrompt, string $language): array
    {
        $providers = $this->getOrderedProviders();

        if (empty($providers)) {
            return [
                'success' => false,
                'error' => 'No AI provider configured. Please add a Gemini or Qwen API key in Settings.',
            ];
        }

        foreach ($providers as $provider) {
            $result = match ($provider) {
                'gemini' => $this->callGemini($systemPrompt),
                'qwen' => $this->callQwen($systemPrompt),
                default => null,
            };

            if ($result && $result['success']) {
                return $result;
            }
        }

        return [
            'success' => false,
            'error' => 'All AI providers failed to generate a response. Please try again.',
        ];
    }

    /**
     * Get ordered list of available AI providers.
     */
    private function getOrderedProviders(): array
    {
        $providers = [];

        $geminiKey = SiteSetting::getValue('gemini_api_key', '');
        if (! empty($geminiKey)) {
            $providers[] = 'gemini';
        }

        $qwenKey = SiteSetting::getValue('qwen_api_key', '');
        if (! empty($qwenKey)) {
            $providers[] = 'qwen';
        }

        return $providers;
    }

    /**
     * Call Google Gemini API with JSON mode.
     */
    private function callGemini(string $systemPrompt): ?array
    {
        $apiKey = SiteSetting::getValue('gemini_api_key', '');
        if (empty($apiKey)) {
            return null;
        }

        $model = SiteSetting::getValue('gemini_model', 'gemini-2.0-flash');

        try {
            $response = Http::timeout(120)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]],
                    ],
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [['text' => 'Generate the ATS-optimized CV now based on the job description and candidate data provided. Return ONLY valid JSON.']],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'topP' => 0.85,
                        'maxOutputTokens' => 8192,
                        'responseMimeType' => 'application/json',
                    ],
                ]
            );

            if ($response->status() === 429 || $response->status() === 403) {
                Log::warning('CV Generator: Gemini quota exhausted', ['status' => $response->status()]);

                return null;
            }

            if (! $response->successful()) {
                Log::error('CV Generator: Gemini API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 1000),
                ]);

                return null;
            }

            $data = $response->json();
            $aiText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            $tokensUsed = $data['usageMetadata']['totalTokenCount'] ?? 0;

            if (! $aiText) {
                Log::error('CV Generator: Gemini returned empty text');

                return null;
            }

            return [
                'success' => true,
                'response' => $aiText,
                'provider' => 'gemini',
                'tokens' => $tokensUsed,
                'raw' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('CV Generator: Gemini exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Call Qwen API (OpenAI-compatible) with JSON mode.
     */
    private function callQwen(string $systemPrompt): ?array
    {
        $apiKey = SiteSetting::getValue('qwen_api_key', '');
        if (empty($apiKey)) {
            return null;
        }

        $model = SiteSetting::getValue('qwen_model', 'qwen-plus');
        $endpoint = SiteSetting::getValue(
            'qwen_endpoint',
            'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'
        );

        try {
            $response = Http::timeout(120)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => 'Generate the ATS-optimized CV now based on the job description and candidate data provided. Return ONLY valid JSON.'],
                    ],
                    'temperature' => 0.4,
                    'top_p' => 0.85,
                    'max_tokens' => 8192,
                    'response_format' => ['type' => 'json_object'],
                ]);

            if ($response->status() === 429 || $response->status() === 403) {
                Log::warning('CV Generator: Qwen quota exhausted', ['status' => $response->status()]);

                return null;
            }

            if (! $response->successful()) {
                Log::error('CV Generator: Qwen API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 1000),
                ]);

                return null;
            }

            $data = $response->json();
            $aiText = $data['choices'][0]['message']['content'] ?? null;
            $tokensUsed = $data['usage']['total_tokens'] ?? 0;

            if (! $aiText) {
                Log::error('CV Generator: Qwen returned empty text');

                return null;
            }

            return [
                'success' => true,
                'response' => $aiText,
                'provider' => 'qwen',
                'tokens' => $tokensUsed,
                'raw' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('CV Generator: Qwen exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    // ── Private: Response Parsing & Saving ──

    /**
     * Parse AI JSON response into structured data.
     */
    private function parseAiResponse(string $responseText): ?array
    {
        // Clean potential markdown code fences
        $cleaned = $responseText;
        if (str_contains($cleaned, '```')) {
            $cleaned = preg_replace('/```(?:json)?\s*/i', '', $cleaned);
            $cleaned = preg_replace('/```\s*$/', '', $cleaned);
        }

        $parsed = json_decode(trim($cleaned), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('CV Generator: JSON parse failed', [
                'error' => json_last_error_msg(),
                'response' => Str::limit($responseText, 500),
            ]);

            return null;
        }

        // Allow clarification structure
        if (isset($parsed['need_clarification']) && $parsed['need_clarification'] === true) {
            return $parsed;
        }

        // Validate minimum required fields
        if (! isset($parsed['sections']) || ! is_array($parsed['sections'])) {
            Log::error('CV Generator: Missing sections in AI response');

            return null;
        }

        return $parsed;
    }

    /**
     * Save parsed CV data to the database.
     */
    private function saveCvGeneration(
        string $jobTitle,
        ?string $companyName,
        string $jobDescription,
        ?string $jobUrl,
        string $language,
        array $parsedCv,
        string $aiProvider,
        int $tokensUsed,
        ?array $rawResponse,
    ): CvGeneration {
        // Get default profile details to store as local copy in this CV
        $profile = $this->getProfileData();
        $parsedCv['contact_name'] = $profile['name'] ?? null;
        $parsedCv['contact_title'] = $profile['title'] ?? null;
        $parsedCv['contact_email'] = $profile['email'] ?? null;
        $parsedCv['contact_phone'] = $profile['phone'] ?? null;
        $parsedCv['contact_location'] = $profile['location'] ?? null;
        $parsedCv['contact_linkedin'] = $profile['linkedin'] ?? null;
        $parsedCv['contact_github'] = $profile['github'] ?? null;
        $parsedCv['contact_website'] = $profile['website'] ?? null;

        // Normalize skills/soft_skills sections in parsed CV data to prevent database corruption
        if (isset($parsedCv['sections']) && is_array($parsedCv['sections'])) {
            foreach ($parsedCv['sections'] as $sIndex => &$sectionData) {
                $sType = $sectionData['type'] ?? 'custom';
                if (in_array($sType, ['skills', 'soft_skills']) && isset($sectionData['items']) && is_array($sectionData['items'])) {
                    foreach ($sectionData['items'] as $iIndex => &$itemData) {
                        $bullets = $itemData['bullets'] ?? [];
                        $subtitle = $itemData['subtitle'] ?? null;
                        if (empty($subtitle) && !empty($bullets)) {
                            $itemData['subtitle'] = is_array($bullets) ? implode(', ', $bullets) : $bullets;
                        }
                        $itemData['bullets'] = [];
                    }
                }
            }
            unset($sectionData);
        }

        // Create the generation record
        $cvGeneration = CvGeneration::create([
            'job_title' => $jobTitle,
            'company_name' => $companyName,
            'job_description' => $jobDescription,
            'job_url' => $jobUrl,
            'language' => $language,
            'status' => 'draft',
            'ats_score' => $parsedCv['ats_match_score'] ?? null,
            'ai_provider' => $aiProvider,
            'ai_tokens_used' => $tokensUsed,
            'raw_ai_response' => $rawResponse,
            'cv_data' => $parsedCv,
        ]);

        // Create sections and items
        foreach ($parsedCv['sections'] as $sIndex => $sectionData) {
            $sType = $sectionData['type'] ?? 'custom';
            $section = $cvGeneration->sections()->create([
                'type' => $sType,
                'title' => $sectionData['title'] ?? 'Untitled Section',
                'sort_order' => $sIndex,
                'is_visible' => true,
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
                    'is_visible' => true,
                ]);
            }
        }

        return $cvGeneration->load('sections.items');
    }

    /**
     * Generate a single CV item from custom user input.
     */
    public function generateCustomItem(CvGeneration $cv, string $sectionType, ?string $title, ?string $subtitle, string $rawInput, ?array $clarificationAnswers = null): array
    {
        $lang = $cv->language;

        $clarificationPrompt = '';
        if (! empty($clarificationAnswers)) {
            $clarificationPrompt = "\n# PREVIOUS CLARIFICATION Q&A HISTORY\n";
            $clarificationPrompt .= "The user has provided the following answers to your previous validation questions. You MUST use these answers to resolve ambiguities, and DO NOT ask these same questions again:\n";
            foreach ($clarificationAnswers as $item) {
                if (isset($item['question'], $item['answer'])) {
                    $clarificationPrompt .= "- Question: {$item['question']}\n  Answer: {$item['answer']}\n";
                }
            }
            $clarificationPrompt .= "\n";
        }

        $systemPrompt = <<<PROMPT
You are an elite ATS CV writer. The user wants to add a new custom item to their CV under the section type "{$sectionType}".
They provided the following draft details or brief description of what they did:
---
Draft Title: {$title}
Draft Subtitle/Organization: {$subtitle}
User Description of Accomplishments/Role: {$rawInput}
---

JOB DESCRIPTION CONTEXT:
Job Title: {$cv->job_title}
Company: {$cv->company_name}
JD: {$cv->job_description}

LANGUAGE: {$lang}
{$clarificationPrompt}
INSTRUCTIONS:
1. Write 2-4 highly impactful bullet points using a diverse set of professional CV writing frameworks: STAR, XYZ (Accomplished [X] as measured by [Y], by doing [Z]), CAR/PAR, SOAR, or WHO.
2. Naturally integrate ATS keywords from the job description context if relevant.
3. If no quantitative metrics exist in raw data, use reasonable conservative estimates prefixed with "~".
4. Ensure extreme professionalism.
5. If the section type is 'skills' or 'soft_skills', put the skills category name in 'title', the comma-separated list of skills in 'subtitle', and make 'bullets' completely empty []. Do NOT generate bullet points.
6. You must return ONLY valid JSON matching exactly this schema, and nothing else. No markdown wrapping.
7. CLARIFICATION & VALIDATION PROTOCOL:
   - Before generating the custom item, evaluate if the user's description is too vague or lacks key results/metrics/tools.
   - If key details are missing or highly ambiguous, and you need to ask questions to clarify or validate the data, you MUST halt generation and ask the user for clarification.
   - To ask for clarification, return a JSON response matching exactly this schema (and nothing else):
     {
       "need_clarification": true,
       "questions": [
         "Short question 1 to validate or fill in missing info...",
         "Short question 2..."
       ]
     }
   - Limit to a maximum of 3 highly relevant, specific, and clear questions.
   - Write all clarification questions based on the target language constraints:
     * If CV language is 'id' (Bahasa Indonesia): Write questions strictly in Bahasa Indonesia.
     * If CV language is 'en' (English): Write questions in professional English, followed by their Indonesian translation in parentheses (e.g., "What was the budget for the project? (Berapa anggaran untuk proyek tersebut?)").
   - If previous Q&A history is present under "PREVIOUS CLARIFICATION Q&A HISTORY" and all your questions have been resolved, proceed with generating the custom item JSON. If you STILL have new critical questions, you may ask them, but DO NOT repeat any questions already present in the history.

{
  "source_type": "custom",
  "source_id": null,
  "title": "Optimized Title",
  "subtitle": "Optimized Subtitle",
  "location": "Location",
  "bullets": [
    "Optimized bullet point 1",
    "Optimized bullet point 2"
  ],
  "metadata": {}
}
PROMPT;

        $aiResult = $this->callAiWithFallback($systemPrompt, $lang);

        if (! $aiResult['success']) {
            return ['success' => false, 'error' => 'AI Provider Error: '.($aiResult['error'] ?? 'Unknown error')];
        }

        $parsed = json_decode(trim($aiResult['response'], " \t\n\r\0\x0B`"), true);

        // Handle markdown block stripping if needed
        if (! $parsed && preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $aiResult['response'], $matches)) {
            $parsed = json_decode($matches[1], true);
        }

        if (! $parsed) {
            return ['success' => false, 'error' => 'AI returned invalid JSON.'];
        }

        if (isset($parsed['need_clarification']) && $parsed['need_clarification'] === true) {
            return [
                'success' => true,
                'need_clarification' => true,
                'questions' => $parsed['questions'] ?? [],
            ];
        }

        return ['success' => true, 'item' => $parsed];
    }

    /**
     * Mirror of the client-side ATS score and suggestions calculator.
     */
    public function calculateAtsScoreAndSuggestions(array $cvData, array $profileData, string $language): array
    {
        $suggestions = [];
        $score = 0;
        $isId = $language === 'id';

        $contactVal = function (string $field, string $fallbackKey) use ($cvData, $profileData) {
            return array_key_exists($field, $cvData) && $cvData[$field] !== null
                ? $cvData[$field]
                : ($profileData[$fallbackKey] ?? '');
        };

        $email = $contactVal('contact_email', 'email');
        $phone = $contactVal('contact_phone', 'phone');
        $linkedin = $contactVal('contact_linkedin', 'linkedin');
        $github = $contactVal('contact_github', 'github');
        $website = $contactVal('contact_website', 'website');

        // 1. Contact line check (Weight: 10)
        $contactScore = 0;
        if (! empty($email)) {
            $contactScore += 2;
        } else {
            $suggestions[] = $isId ? 'Tambahkan alamat email profesional di bagian kontak.' : 'Add a professional email address in the contact section.';
        }

        if (! empty($phone)) {
            $contactScore += 2;
        } else {
            $suggestions[] = $isId ? 'Tambahkan nomor telepon aktif di bagian kontak.' : 'Add an active phone number in the contact section.';
        }

        if (! empty($linkedin)) {
            $contactScore += 2;
        } else {
            $suggestions[] = $isId ? 'Tambahkan tautan profil LinkedIn.' : 'Add a LinkedIn profile link.';
        }

        if (! empty($github)) {
            $contactScore += 2;
        } else {
            $suggestions[] = $isId ? 'Tambahkan tautan repositori GitHub.' : 'Add a GitHub repository link.';
        }

        $hasPortfolio = ! empty($website) && str_contains($website, 'rezaedisaputra.com');
        if ($hasPortfolio) {
            $contactScore += 2;
        } else {
            $suggestions[] = $isId ? 'Pastikan website portofolio resmi https://www.rezaedisaputra.com/ tercantum di bagian kontak.' : 'Ensure your official portfolio website https://www.rezaedisaputra.com/ is listed in the contact section.';
        }
        $score += $contactScore;

        // Gather all text from CV to check keywords
        $allText = strtolower($cvData['professional_summary'] ?? '');

        $totalBullets = 0;
        $quantifiedBullets = 0;
        $actionVerbBullets = 0;
        $bulletLengthViolations = 0;
        $experienceBulletViolations = 0;
        $projectBulletViolations = 0;

        // Strong action verbs list
        $actionVerbs = [
            // Indonesian
            'memimpin', 'mengembangkan', 'mengoptimalkan', 'merancang', 'mengintegrasikan',
            'mengelola', 'meningkatkan', 'membangun', 'membuat', 'mengimplementasikan',
            'mempercepat', 'menghemat', 'meminimalkan', 'menyelesaikan', 'mempelopori',
            'merekayasa', 'menyederhanakan', 'mengotomatiskan', 'mengarahkan',
            // English
            'spearheaded', 'engineered', 'architected', 'optimized', 'overhauled',
            'accelerated', 'streamlined', 'decentralized', 'pioneered', 'led',
            'developed', 'managed', 'created', 'implemented', 'designed', 'resolved',
            'boosted', 'reduced', 'saved', 'automated', 'delivered', 'integrated',
        ];
        $actionVerbsSet = array_flip($actionVerbs);

        $sections = $cvData['sections'] ?? [];
        foreach ($sections as $section) {
            $sectionVisible = $section['is_visible'] ?? true;
            if (! $sectionVisible) {
                continue;
            }

            $allText .= ' '.strtolower($section['title'] ?? '');

            $items = $section['items'] ?? [];
            foreach ($items as $item) {
                $itemVisible = $item['is_visible'] ?? true;
                if (! $itemVisible) {
                    continue;
                }

                $allText .= ' '.strtolower($item['title'] ?? '');
                $allText .= ' '.strtolower($item['subtitle'] ?? '');
                $allText .= ' '.strtolower($item['location'] ?? '');

                $bullets = $item['bullets'] ?? [];

                $sectionType = $section['type'] ?? '';
                $sectionTitle = strtolower($section['title'] ?? '');
                $isExperience = $sectionType === 'experience' || str_contains($sectionTitle, 'experience') || str_contains($sectionTitle, 'pengalaman');
                $isProject = $sectionType === 'projects' || str_contains($sectionTitle, 'project') || str_contains($sectionTitle, 'proyek');

                if ($isExperience && count($bullets) > 3) {
                    $experienceBulletViolations++;
                }
                if ($isProject && count($bullets) > 2) {
                    $projectBulletViolations++;
                }

                foreach ($bullets as $bullet) {
                    $bulletTrimmed = trim($bullet);
                    if (empty($bulletTrimmed)) {
                        continue;
                    }
                    $totalBullets++;
                    $allText .= ' '.strtolower($bulletTrimmed);

                    // Quantification check
                    $hasMetric = preg_match('/\b\d+(?:%|\s*percent|\s*juta|\s*miliar|\s*ribu|\s*jt|\s*rb|\s*k|\b)/i', $bulletTrimmed) ||
                                 preg_match('/\b(?:Rp|USD|\$)\s*\d+/i', $bulletTrimmed) ||
                                 preg_match('/\b(?:~)?\d+\b/', $bulletTrimmed);
                    if ($hasMetric) {
                        $quantifiedBullets++;
                    }

                    // Action verb check
                    $words = preg_split('/\s+/', $bulletTrimmed);
                    $firstWord = ! empty($words[0]) ? strtolower(preg_replace('/[.,;:()]/', '', $words[0])) : '';
                    if ($firstWord) {
                        $isExplicit = isset($actionVerbsSet[$firstWord]);
                        $isIndonesianVerb = $isId && str_starts_with($firstWord, 'me') && strlen($firstWord) >= 5 && ! in_array($firstWord, ['media', 'metode', 'meja', 'menit', 'merek', 'mesin', 'mewah', 'merah', 'mental', 'menu', 'mereka', 'merdeka', 'melalui', 'menurut', 'menuju', 'mengapa', 'melainkan', 'meskipun']);
                        $isEnglishVerb = ! $isId && ((str_ends_with($firstWord, 'ed') && strlen($firstWord) > 4 && ! in_array($firstWord, ['speed', 'bleed', 'indeed', 'breed'])) || in_array($firstWord, ['led', 'built', 'wrote', 'ran', 'held', 'made', 'kept', 'won', 'drew', 'cut', 'set', 'sent', 'spent']));
                        if ($isExplicit || $isIndonesianVerb || $isEnglishVerb) {
                            $actionVerbBullets++;
                        }
                    }

                    // Bullet length check
                    $wordCount = count($words);
                    if ($wordCount > 25) {
                        $bulletLengthViolations++;
                    }
                }
            }
        }

        // 2. Keyword Match (Weight: 40)
        $keywords = $cvData['ats_keywords'] ?? [];
        $matchedKeywords = [];
        $missingKeywords = [];

        if (count($keywords) > 0) {
            foreach ($keywords as $kw) {
                $kwClean = strtolower(trim($kw));
                if (str_contains($allText, $kwClean)) {
                    $matchedKeywords[] = $kw;
                } else {
                    $missingKeywords[] = $kw;
                }
            }

            $matchRatio = count($matchedKeywords) / count($keywords);
            if ($matchRatio >= 0.8) {
                $score += 40;
            } else {
                $score += round(($matchRatio / 0.8) * 40);
                if (count($missingKeywords) > 0) {
                    $displayKws = implode(', ', array_slice($missingKeywords, 0, 5));
                    $suggestions[] = $isId
                        ? "Integrasikan keyword penting berikut ke dalam deskripsi Anda: [{$displayKws}]."
                        : "Integrate the following key keywords into your descriptions: [{$displayKws}].";
                }
            }
        } else {
            $score += 40;
        }

        // 3. Metrics (Weight: 20)
        if ($totalBullets > 0) {
            $metricRatio = $quantifiedBullets / $totalBullets;
            $targetMetricRatio = 0.5;
            if ($metricRatio >= $targetMetricRatio) {
                $score += 20;
            } else {
                $score += round(($metricRatio / $targetMetricRatio) * 20);
                if ($metricRatio < $targetMetricRatio) {
                    $suggestions[] = $isId
                        ? 'Tambahkan metrik kuantitatif (seperti % kenaikan, jumlah user, atau waktu yang dihemat) pada bullet points Anda.'
                        : 'Add quantitative metrics (such as % increase, number of users, or time saved) to your bullet points.';
                }
            }
        } else {
            $score += 20;
        }

        // 4. Action Verbs (Weight: 15)
        if ($totalBullets > 0) {
            $verbRatio = $actionVerbBullets / $totalBullets;
            $targetVerbRatio = 0.7;
            if ($verbRatio >= $targetVerbRatio) {
                $score += 15;
            } else {
                $score += round(($verbRatio / $targetVerbRatio) * 15);
                if ($verbRatio < $targetVerbRatio) {
                    $suggestions[] = $isId
                        ? 'Gunakan kata kerja aksi yang kuat (e.g. Spearheaded, Mengoptimalkan, Merancang) di awal setiap baris.'
                        : 'Use strong action verbs (e.g., Spearheaded, Optimize, Design) at the start of each line.';
                }
            }
        } else {
            $score += 15;
        }

        // 5. Length & Constraints violations (Weight: 15)
        $layoutPoints = 15;
        if ($experienceBulletViolations > 0) {
            $layoutPoints -= 5;
            $suggestions[] = $isId
                ? 'Batasi setiap pekerjaan maksimal 3 bullet point penting agar CV padat dan muat 1 halaman.'
                : 'Limit each job experience to a maximum of 3 key bullet points to keep the CV concise and on 1 page.';
        }
        if ($projectBulletViolations > 0) {
            $layoutPoints -= 5;
            $suggestions[] = $isId
                ? 'Batasi setiap proyek maksimal 2 bullet point penting.'
                : 'Limit each project to a maximum of 2 key bullet points.';
        }
        if ($bulletLengthViolations > 0) {
            $layoutPoints -= 5;
            $suggestions[] = $isId
                ? 'Persingkat bullet point yang terlalu panjang (> 25 kata) agar mudah dibaca oleh HRD.'
                : 'Shorten bullet points that are too long (> 25 words) for better readability.';
        }
        $score += max(0, $layoutPoints);

        $score = max(0, min(100, $score));

        return [
            'score' => (int) $score,
            'suggestions' => $suggestions,
            'matched_keywords' => $matchedKeywords,
        ];
    }

    /**
     * Solve a specific ATS suggestion.
     *
     * @return array{success: bool, cv_data?: array, error?: string}
     */
    public function solveSuggestion(CvGeneration $cvGeneration, string $suggestion): array
    {
        return $this->solveSuggestions($cvGeneration, [$suggestion]);
    }

    /**
     * Solve a list of ATS suggestions.
     *
     * @param  array<string>  $suggestions
     * @return array{success: bool, cv_data?: array, error?: string}
     */
    public function solveSuggestions(CvGeneration $cvGeneration, array $suggestions, ?array $clarificationAnswers = null): array
    {
        $language = $cvGeneration->language;
        $profileData = $this->getProfileData();
        $isId = $language === 'id';

        $phoneKeywords = ['telepon', 'phone number'];
        $emailKeywords = ['email'];
        $linkedinKeywords = ['linkedin'];
        $githubKeywords = ['github'];
        $websiteKeywords = ['website', 'portofolio resmi'];

        $aiSuggestions = [];
        $profileUpdated = false;
        $cvData = $cvGeneration->cv_data;

        foreach ($suggestions as $suggestion) {
            $suggestionLower = strtolower($suggestion);
            $matchedKey = null;
            $newValue = null;

            if ($this->stringContainsAny($suggestionLower, $phoneKeywords)) {
                $matchedKey = 'phone';
                $newValue = '+62 812-3456-7890';
            } elseif ($this->stringContainsAny($suggestionLower, $websiteKeywords)) {
                $matchedKey = 'website_url';
                $newValue = 'https://www.rezaedisaputra.com/';
            } elseif ($this->stringContainsAny($suggestionLower, $linkedinKeywords)) {
                $matchedKey = 'linkedin_url';
                $newValue = 'https://linkedin.com/in/rezaedisaputra';
            } elseif ($this->stringContainsAny($suggestionLower, $githubKeywords)) {
                $matchedKey = 'github_url';
                $newValue = 'https://github.com/HyReza';
            } elseif ($this->stringContainsAny($suggestionLower, $emailKeywords)) {
                $matchedKey = 'email';
                $newValue = 'rezaedisaputra@example.com';
            }

            if ($matchedKey) {
                // Update profile
                $profile = Profile::where('key', $matchedKey)->first();
                if ($profile) {
                    if ($language === 'id') {
                        $profile->update(['value_id' => $newValue]);
                    } else {
                        $profile->update(['value_en' => $newValue]);
                    }
                } else {
                    Profile::create([
                        'key' => $matchedKey,
                        'value_id' => $newValue,
                        'value_en' => $newValue,
                        'type' => 'text',
                    ]);
                }
                $profileUpdated = true;

                // Sync to CV overrides as well
                $cvKeyMap = [
                    'phone' => 'contact_phone',
                    'website_url' => 'contact_website',
                    'linkedin_url' => 'contact_linkedin',
                    'github_url' => 'contact_github',
                    'email' => 'contact_email',
                ];
                if (isset($cvKeyMap[$matchedKey])) {
                    $cvData[$cvKeyMap[$matchedKey]] = $newValue;
                }
            } else {
                $aiSuggestions[] = $suggestion;
            }
        }

        // If profile was updated, refresh the profile data
        if ($profileUpdated) {
            $profileData = $this->getProfileData();
        }

        // If there are AI suggestions, run them through the AI in a single call
        if (! empty($aiSuggestions)) {
            $suggestionsList = '';
            foreach ($aiSuggestions as $idx => $aiSug) {
                $suggestionsList .= ($idx + 1).'. "'.$aiSug."\"\n";
            }

            $clarificationPrompt = '';
            if (! empty($clarificationAnswers)) {
                $clarificationPrompt = "\n# PREVIOUS CLARIFICATION Q&A HISTORY\n";
                $clarificationPrompt .= "The user has provided the following answers to your previous validation questions. You MUST use these answers to resolve ambiguities, and DO NOT ask these same questions again:\n";
                foreach ($clarificationAnswers as $item) {
                    if (isset($item['question'], $item['answer'])) {
                        $clarificationPrompt .= "- Question: {$item['question']}\n  Answer: {$item['answer']}\n";
                    }
                }
                $clarificationPrompt .= "\n";
            }

            $systemPrompt = <<<PROMPT
You are an elite ATS CV Optimizer. The user has a CV and wants to solve the following improvement suggestions.

JOB DESCRIPTION CONTEXT:
Job Title: {$cvGeneration->job_title}
Company: {$cvGeneration->company_name}
JD: {$cvGeneration->job_description}

CURRENT CV DATA (JSON format):
---
PROMPT;
            $systemPrompt .= json_encode($cvData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            $systemPrompt .= <<<PROMPT

---

IMPROVEMENT SUGGESTIONS TO SOLVE:
{$suggestionsList}
LANGUAGE: {$language}
{$clarificationPrompt}
INSTRUCTIONS:
1. Revise the CURRENT CV DATA (specifically summary, sections, or item bullets) to completely solve the IMPROVEMENT SUGGESTIONS listed above.
2. If suggestions say "Gunakan kata kerja aksi yang kuat" (Use strong action verbs) or "Tambahkan metrik kuantitatif" (Add quantitative metrics), inspect the experience or projects bullets and rewrite them.
3. If suggestions say "Integrasikan keyword...", naturally weave the specified keywords into the summary or bullets.
4. If suggestions say "Batasi setiap pekerjaan maksimal 3 bullet point..." or "Batasi setiap proyek maksimal 2...", trim the least relevant bullets.
5. If suggestions say "Persingkat bullet point...", rewrite longer bullets to be shorter (< 25 words).
6. Return the updated CV JSON following the exact same schema. Keep all other sections/items identical, only modify what is necessary to solve the suggestions.
7. Return ONLY valid JSON matching the schema. No explanations, no markdown wrapping.
8. CLARIFICATION & VALIDATION PROTOCOL:
   - Before editing the CV data, evaluate if you cannot solve the suggestions without more information (e.g. you don't know key metrics to add, or the technologies to add to solve the suggestions).
   - If key details are missing or highly ambiguous, and you need to ask questions to clarify or validate the data, you MUST halt generation and ask the user for clarification.
   - To ask for clarification, return a JSON response matching exactly this schema (and nothing else):
     {
       "need_clarification": true,
       "questions": [
         "Short question 1 to validate or fill in missing info...",
         "Short question 2..."
       ]
     }
   - Limit to a maximum of 3 highly relevant, specific, and clear questions.
   - Write all clarification questions based on the target language constraints:
     * If CV language is 'id' (Bahasa Indonesia): Write questions strictly in Bahasa Indonesia.
     * If CV language is 'en' (English): Write questions in professional English, followed by their Indonesian translation in parentheses (e.g., "What was the budget for the project? (Berapa anggaran untuk proyek tersebut?)").
   - If previous Q&A history is present under "PREVIOUS CLARIFICATION Q&A HISTORY" and all your questions have been resolved, proceed with generating the updated CV JSON. If you STILL have new critical questions, you may ask them, but DO NOT repeat any questions already present in the history.
PROMPT;

            $aiResult = $this->callAiWithFallback($systemPrompt, $language);

            if (! $aiResult['success']) {
                return [
                    'success' => false,
                    'error' => 'AI Provider Error: '.($aiResult['error'] ?? 'Unknown error'),
                ];
            }

            $parsedCv = $this->parseAiResponse($aiResult['response']);
            if (! $parsedCv) {
                return [
                    'success' => false,
                    'error' => 'AI returned an invalid response format.',
                ];
            }

            if (isset($parsedCv['need_clarification']) && $parsedCv['need_clarification'] === true) {
                return [
                    'success' => true,
                    'need_clarification' => true,
                    'questions' => $parsedCv['questions'] ?? [],
                ];
            }

            $cvData = $parsedCv;
        }

        // Recalculate real-time metrics
        $metrics = $this->calculateAtsScoreAndSuggestions($cvData, $profileData, $language);
        $cvData['ats_match_score'] = $metrics['score'];
        $cvData['improvement_suggestions'] = $metrics['suggestions'];
        $cvData['matched_keywords'] = $metrics['matched_keywords'];

        // Save updated data to CV Generation and sync to DB tables (sections & items)
        $cvGeneration->update([
            'cv_data' => $cvData,
            'ats_score' => $metrics['score'],
        ]);

        // Sync to sections and items DB tables
        $cvGeneration->sections()->delete();
        foreach ($cvData['sections'] as $sIndex => $sectionData) {
            $section = $cvGeneration->sections()->create([
                'type' => $sectionData['type'] ?? 'custom',
                'title' => $sectionData['title'] ?? 'Untitled Section',
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

        return [
            'success' => true,
            'cv_data' => $cvData,
        ];
    }

    /**
     * Execute granular AI action (rewrite bullet, item, or section).
     */
    public function executeAiAction(\App\Models\CvGeneration $cv, string $type, array $params, ?string $instruction = null): array
    {
        $cvData = $params['cv_data'];
        $sectionIndex = $params['section_index'];
        $itemIndex = $params['item_index'] ?? null;
        $bulletIndex = $params['bullet_index'] ?? null;
        $language = $cv->language;

        $section = $cvData['sections'][$sectionIndex] ?? null;
        if (!$section) {
            return ['success' => false, 'error' => 'Section not found'];
        }

        $skillsInstruction = "";
        if (in_array($section['type'] ?? '', ['skills', 'soft_skills'])) {
            $skillsInstruction = "\nCRITICAL NOTE FOR SKILLS/SOFT_SKILLS SECTION ITEMS:\n" .
                "- Since this item belongs to a skills or soft_skills section, you MUST format it as a skills category: put the category name in 'title', the comma-separated list of skills in 'subtitle', and keep the 'bullets' array completely empty []. Do NOT generate bullet points.\n";
        }

        $item = null;
        if ($itemIndex !== null) {
            $item = $section['items'][$itemIndex] ?? null;
            if (!$item) {
                return ['success' => false, 'error' => 'Item not found'];
            }
        }

        $bullet = null;
        if ($bulletIndex !== null && $item) {
            $bullet = $item['bullets'][$bulletIndex] ?? null;
            if ($bullet === null) {
                return ['success' => false, 'error' => 'Bullet not found'];
            }
        }

        $systemPrompt = "";
        $langInstruction = $language === 'id'
            ? 'Generate output strictly in professional Indonesian (Bahasa Indonesia).'
            : 'Generate output strictly in professional English.';

        if ($type === 'bullet') {
            $escapedBullet = addslashes($bullet);
            $itemTitle = $item['title'] ?? '';
            $itemSubtitle = $item['subtitle'] ?? '';
            $systemPrompt = <<<PROMPT
You are an elite ATS CV writer. The user wants to rewrite a single bullet point in their CV.

CONTEXT:
Job Title: {$cv->job_title}
Company: {$cv->company_name}
JD: {$cv->job_description}

CURRENT ITEM CONTEXT:
Item Title: {$itemTitle}
Item Subtitle: {$itemSubtitle}

CURRENT BULLET POINT:
"{$escapedBullet}"

USER INSTRUCTION / CHANGE NOTE (Optional):
"{$instruction}"

LANGUAGE INSTRUCTION:
{$langInstruction}

INSTRUCTIONS:
1. Rewrite the bullet point to be highly professional, impactful, and ATS-optimized for the target JD.
2. Use professional CV writing frameworks (STAR, XYZ, CAR, SOAR, or WHO). Make sure it starts with a strong action verb and includes a quantitative metric (use a conservative estimate prefixed with "~" if none is present).
3. If the user provided a custom instruction, prioritize and follow that instruction exactly.
4. Keep the bullet point strictly between 10 to 25 words.
5. Return ONLY a valid JSON object matching exactly this schema, and nothing else. No markdown wrapping.
{
  "bullet": "The rewritten bullet point text"
}
PROMPT;
        } elseif ($type === 'item') {
            $currentBullets = implode("\n", array_map(fn($b) => "- $b", $item['bullets'] ?? []));
            $currentMeta = json_encode($item['metadata'] ?? []);
            $itemTitle = $item['title'] ?? '';
            $itemSubtitle = $item['subtitle'] ?? '';
            $itemLocation = $item['location'] ?? '';
            $systemPrompt = <<<PROMPT
You are an elite ATS CV writer. The user wants to rewrite a single item (experience/project/education/certificate entry) in their CV.

CONTEXT:
Job Title: {$cv->job_title}
Company: {$cv->company_name}
JD: {$cv->job_description}

CURRENT ITEM DETAILS:
Title: {$itemTitle}
Subtitle: {$itemSubtitle}
Location: {$itemLocation}
Bullets:
{$currentBullets}
Metadata: {$currentMeta}

USER INSTRUCTION / CHANGE NOTE (Optional):
"{$instruction}"

LANGUAGE INSTRUCTION:
{$langInstruction}
{$skillsInstruction}

INSTRUCTIONS:
1. Rewrite the item (including title, subtitle, location, bullets, and metadata) to be highly optimized for the target JD.
2. Keep the bullets count reasonable (2-3 for experience, 1-2 for projects). Use professional frameworks (STAR, XYZ, CAR, etc.) and include quantitative metrics (with "~" for estimates).
3. If the user provided a custom instruction, prioritize and follow that instruction exactly.
4. For metadata, preserve, update or suggest relevant keys like:
   - "tech_stack": array of technologies (e.g. ["Laravel", "React", "Python"])
   - "issuer": string issuer (for certificates/education, e.g. "UMPP" or "Google")
   - "credential_url": string url
   - "gpa": string gpa
5. Return ONLY a valid JSON object matching exactly this schema, and nothing else. No markdown wrapping.
{
  "title": "Optimized main title",
  "subtitle": "Optimized subtitle",
  "location": "Optimized location",
  "bullets": [
    "Optimized bullet point 1",
    "Optimized bullet point 2"
  ],
  "metadata": {
    "tech_stack": ["React", "Laravel"],
    "issuer": "Issuer name if applicable",
    "credential_url": "URL if applicable",
    "gpa": "GPA if applicable"
  }
}
PROMPT;
        } elseif ($type === 'section') {
            $sectionItemsJson = json_encode($section['items'] ?? [], JSON_PRETTY_PRINT);
            $sectionTitle = $section['title'] ?? '';
            $sectionType = $section['type'] ?? '';
            $systemPrompt = <<<PROMPT
You are an elite ATS CV writer. The user wants to rewrite an entire section of their CV.

CONTEXT:
Job Title: {$cv->job_title}
Company: {$cv->company_name}
JD: {$cv->job_description}

CURRENT SECTION DETAILS:
Section Title: {$sectionTitle}
Section Type: {$sectionType}
Items in Section:
---
{$sectionItemsJson}
---

USER INSTRUCTION / CHANGE NOTE (Optional):
"{$instruction}"

LANGUAGE INSTRUCTION:
{$langInstruction}
{$skillsInstruction}

INSTRUCTIONS:
1. Rewrite the items in the section to align with the target JD.
2. Apply ATS optimization (STAR/XYZ formulas, strong verbs, quantitative metrics) to all items in this section.
3. If the user provided a custom instruction (e.g. "Translate everything in this section to English", "Reduce items to only the top 3 and combine them", "Make all experience bullets focus on cloud architecture"), prioritize and follow that instruction exactly.
4. Preserve the structure of the section type. Ensure the items array format matches the expected schema.
5. Return ONLY a valid JSON object matching exactly this schema, and nothing else. No markdown wrapping.
{
  "title": "Optimized Section Title",
  "type": "{$sectionType}",
  "items": [
    {
      "title": "Item 1 title",
      "subtitle": "Item 1 subtitle",
      "location": "Item 1 location",
      "bullets": [
        "Bullet 1",
        "Bullet 2"
      ],
      "metadata": {
        "tech_stack": [],
        "issuer": "",
        "gpa": ""
      }
    }
  ]
}
PROMPT;
        }

        $aiResult = $this->callAiWithFallback($systemPrompt, $language);
        if (!$aiResult['success']) {
            return ['success' => false, 'error' => 'AI Provider Error: ' . ($aiResult['error'] ?? 'Unknown error')];
        }

        $parsed = json_decode(trim($aiResult['response'], " \t\n\r\0\x0B`"), true);

        // Handle markdown block stripping
        if (!$parsed && preg_match('/```(?:json)?\s*(\{.*?\})\s*-->\s*```/s', $aiResult['response'] . '-->', $matches)) {
            $parsed = json_decode($matches[1], true);
        }
        if (!$parsed && preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $aiResult['response'], $matches)) {
            $parsed = json_decode($matches[1], true);
        }

        if (!$parsed) {
            \Log::error('aiAction: Invalid JSON returned by AI', ['response' => $aiResult['response']]);
            return ['success' => false, 'error' => 'AI returned an invalid JSON response. Please try again.'];
        }

        return ['success' => true, 'data' => $parsed];
    }

    private function stringContainsAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }
}
