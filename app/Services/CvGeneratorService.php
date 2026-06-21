<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Career;
use App\Models\Certificate;
use App\Models\CvGeneration;
use App\Models\CvSection;
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
          "title": "Main title (e.g. Senior Developer)",
          "subtitle": "Context line (e.g. Company — Jan 2024 – Present)",
          "location": "City, Country (optional)",
          "bullets": [
            "XYZ bullet: Accomplished [X] as measured by [Y], by doing [Z]"
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
        );

        // 3. Call AI provider
        $aiResult = $this->callAiWithFallback($systemPrompt, $language);

        if (!$aiResult['success']) {
            return [
                'success' => false,
                'error' => $aiResult['error'] ?? 'All AI providers failed. Please check API keys in Settings.',
            ];
        }

        // 4. Parse the AI response JSON
        $parsedCv = $this->parseAiResponse($aiResult['response']);
        if (!$parsedCv) {
            return [
                'success' => false,
                'error' => 'AI returned an invalid response format. Please try again.',
            ];
        }

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
        $newCv->job_title = $source->job_title . ' (Copy)';
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
    public function generateSingleItem(CvGeneration $cv, string $sourceType, int $sourceId): array
    {
        $lang = $cv->language;
        $l = fn(string $id, string $en) => $lang === 'id' ? ($id ?: $en) : ($en ?: $id);
        
        $sourceData = "";
        
        switch ($sourceType) {
            case 'career':
                $model = Career::find($sourceId);
                if (!$model) return ['success' => false, 'error' => 'Career not found'];
                $sourceData = "Role: {$l($model->position_id ?? '', $model->position_en ?? '')}\n";
                $sourceData .= "Company: {$model->company}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'project':
                $model = Project::find($sourceId);
                if (!$model) return ['success' => false, 'error' => 'Project not found'];
                $sourceData = "Project: {$l($model->title_id ?? '', $model->title_en ?? '')}\n";
                $sourceData .= "Summary: {$l($model->excerpt_id ?? '', $model->excerpt_en ?? '')}\n";
                $sourceData .= "Details: " . \Illuminate\Support\Str::limit(strip_tags($l($model->content_id ?? '', $model->content_en ?? '')), 1000) . "\n";
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
                if (!$model) return ['success' => false, 'error' => 'Education not found'];
                $sourceData = "Institution: {$model->institution}\n";
                $sourceData .= "Degree: {$l($model->degree ?? '', $model->degree_en ?? '')}\n";
                $sourceData .= "Field: {$l($model->field ?? '', $model->field_en ?? '')}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'certificate':
                $model = Certificate::find($sourceId);
                if (!$model) return ['success' => false, 'error' => 'Certificate not found'];
                $sourceData = "Name: {$l($model->title ?? '', $model->title_en ?? '')}\n";
                $sourceData .= "Issuer: {$model->issuer}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'organization':
                $model = Organization::find($sourceId);
                if (!$model) return ['success' => false, 'error' => 'Organization not found'];
                $sourceData = "Org: {$l($model->name ?? '', $model->name_en ?? '')}\n";
                $sourceData .= "Role: {$l($model->role ?? '', $model->role_en ?? '')}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            case 'achievement':
                $model = Achievement::find($sourceId);
                if (!$model) return ['success' => false, 'error' => 'Achievement not found'];
                $sourceData = "Title: {$l($model->title_id ?? '', $model->title_en ?? '')}\n";
                $sourceData .= "Desc: {$l($model->description_id ?? '', $model->description_en ?? '')}\n";
                break;
            default:
                return ['success' => false, 'error' => 'Unsupported source type'];
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

INSTRUCTIONS:
1. Write 2-4 highly impactful bullet points using a diverse set of professional CV writing frameworks: STAR (Situation, Task, Action, Result), XYZ (Accomplished X, measured by Y, by doing Z), CAR/PAR (Challenge/Problem, Action, Result), SOAR (Situation, Obstacle, Action, Result), or WHO (What, How, Outcome). Select the best technique matching this item (e.g. XYZ for technical/performance work, STAR/CAR for general development, SOAR for leadership, WHO for integrations). Do not repeat the same style across all bullets; mix them to make it dynamic but extremely professional and consistent.
2. Naturally integrate ATS keywords from the job description context if relevant.
3. If no quantitative metrics exist in raw data, use reasonable conservative estimates prefixed with "~".
4. Ensure extreme professionalism.
5. You must return ONLY valid JSON matching exactly this schema, and nothing else. No markdown wrapping.

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

        if (!$aiResult['success']) {
            return ['success' => false, 'error' => 'AI Provider Error: ' . ($aiResult['error'] ?? 'Unknown error')];
        }

        $parsed = json_decode(trim($aiResult['response'], " \t\n\r\0\x0B`"), true);
        
        // Handle markdown block stripping if needed
        if (!$parsed && preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $aiResult['response'], $matches)) {
            $parsed = json_decode($matches[1], true);
        }

        if (!$parsed) {
            return ['success' => false, 'error' => 'AI returned invalid JSON.'];
        }

        return ['success' => true, 'item' => $parsed];
    }

    /**
     * Get profile data for PDF header.
     */
    public function getProfileData(): array
    {
        $profiles = Profile::ordered()->get()->keyBy('key');

        $getValue = fn(string $key) => $profiles[$key]->value_en ?? $profiles[$key]->value_id ?? '';

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
        $l = fn(string $id, string $en) => $lang === 'id' ? ($id ?: $en) : ($en ?: $id);

        // Profile
        $profiles = Profile::ordered()->get();
        if ($profiles->isNotEmpty()) {
            $parts[] = "## CANDIDATE PROFILE";
            foreach ($profiles as $p) {
                $val = $l($p->value_id ?? '', $p->value_en ?? '');
                $key = strtolower($p->key);
                if ($val && !Str::contains($key, ['photo', 'bullet', 'meta', 'typewriter'])) {
                    $parts[] = "- **{$p->key}**: {$val}";
                }
            }
        }

        // Careers
        $careers = Career::where('show_in_cv', true)
            ->with(['children' => fn($q) => $q->where('show_in_cv', true)->orderBy('sort_order')])
            ->roots()
            ->chronological()
            ->get();

        if ($careers->isNotEmpty()) {
            $parts[] = "\n## WORK EXPERIENCE (Raw Data)";
            foreach ($careers as $c) {
                $position = $l($c->position_id ?? '', $c->position_en ?? '');
                $company = $l($c->company ?? '', $c->company_en ?? '');
                $desc = $l($c->description_id ?? '', $c->description_en ?? '');
                $period = ($c->start_date?->format('M Y') ?? '') . ' – ' . ($c->end_date?->format('M Y') ?? 'Present');
                $parts[] = "### [ID:{$c->id}] {$position} at {$company} ({$period})";
                if ($desc) {
                    $parts[] = "Description: " . Str::limit(strip_tags($desc), 2000);
                }
                if ($c->is_current) {
                    $parts[] = "Status: Currently employed here";
                }

                foreach ($c->children as $child) {
                    $cpos = $l($child->position_id ?? '', $child->position_en ?? '');
                    $cdesc = $l($child->description_id ?? '', $child->description_en ?? '');
                    $cperiod = ($child->start_date?->format('M Y') ?? '') . ' – ' . ($child->end_date?->format('M Y') ?? 'Present');
                    $parts[] = "  - Sub-role [ID:{$child->id}]: {$cpos} ({$cperiod})";
                    if ($cdesc) {
                        $parts[] = "    Description: " . Str::limit(strip_tags($cdesc), 1000);
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
                    $parts[] = "Details: " . Str::limit(strip_tags($content), 1500);
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
                $period = ($e->start_date?->format('Y') ?? '') . ' – ' . ($e->end_date?->format('Y') ?? 'Present');
                $parts[] = "### [ID:{$e->id}] {$degree} in {$field} at {$institution} ({$period}) {$gpa}";
                if ($desc) {
                    $parts[] = "Description: " . Str::limit(strip_tags($desc), 800);
                }
                if ($activities) {
                    $parts[] = "Activities: " . Str::limit(strip_tags($activities), 500);
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
            $list = $softSkills->map(fn($s) => $l($s->name_id ?? '', $s->name_en ?? ''))->filter()->join(', ');
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
                    $parts[] = "Description: " . Str::limit(strip_tags($desc), 500);
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
                $period = ($o->start_date?->format('Y') ?? '') . ' – ' . ($o->end_date?->format('Y') ?? 'Present');
                $parts[] = "- [ID:{$o->id}] **{$role}** at {$name} ({$period})";
                if ($desc) {
                    $parts[] = "  Description: " . Str::limit(strip_tags($desc), 500);
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
                $parts[] = "- [ID:{$a->id}] {$title} ({$date})" . ($desc ? ": {$desc}" : '');
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
    ): string {
        $langInstruction = $language === 'id'
            ? 'Generate ALL content (summary, bullets, section titles) in Bahasa Indonesia. Use professional Indonesian language. Translate section titles to Indonesian (e.g., "Ringkasan Profesional", "Pengalaman Kerja", "Pendidikan", "Keahlian Teknis", "Proyek", "Sertifikat", "Organisasi", "Pencapaian").'
            : 'Generate ALL content in professional English.';

        $companyLine = $companyName ? "Company: {$companyName}" : 'Company: Not specified';

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
        if (!empty($geminiKey)) {
            $providers[] = 'gemini';
        }

        $qwenKey = SiteSetting::getValue('qwen_api_key', '');
        if (!empty($qwenKey)) {
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

            if (!$response->successful()) {
                Log::error('CV Generator: Gemini API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 1000),
                ]);
                return null;
            }

            $data = $response->json();
            $aiText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            $tokensUsed = $data['usageMetadata']['totalTokenCount'] ?? 0;

            if (!$aiText) {
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

            if (!$response->successful()) {
                Log::error('CV Generator: Qwen API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 1000),
                ]);
                return null;
            }

            $data = $response->json();
            $aiText = $data['choices'][0]['message']['content'] ?? null;
            $tokensUsed = $data['usage']['total_tokens'] ?? 0;

            if (!$aiText) {
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

        // Validate minimum required fields
        if (!isset($parsed['sections']) || !is_array($parsed['sections'])) {
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
            $section = $cvGeneration->sections()->create([
                'type' => $sectionData['type'] ?? 'custom',
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
}
