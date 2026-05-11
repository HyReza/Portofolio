<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Blog;
use App\Models\Career;
use App\Models\Certificate;
use App\Models\Contact;
use App\Models\Education;
use App\Models\Organization;
use App\Models\Profile;
use App\Models\Project;
use App\Models\SiteSetting;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Testimonial;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AiAssistantService
{
    /**
     * Maximum messages per day per session.
     */
    private const DAILY_LIMIT = 50;

    /**
     * Maximum conversation history pairs sent to AI (to save tokens).
     * Each "pair" = 1 user message + 1 model response.
     * We keep 5 pairs = 10 messages of context.
     */
    private const MAX_HISTORY_PAIRS = 10;

    /**
     * Check if the user has exceeded daily limits.
     */
    public function isRateLimited(string $sessionId): bool
    {
        $key = "ai_daily:{$sessionId}:" . now()->format('Y-m-d');
        $attempts = (int) Cache::get($key, 0);
        return $attempts >= self::DAILY_LIMIT;
    }

    /**
     * Increment the daily counter.
     */
    private function incrementDaily(string $sessionId): void
    {
        $key = "ai_daily:{$sessionId}:" . now()->format('Y-m-d');
        $current = (int) Cache::get($key, 0);
        Cache::put($key, $current + 1, now()->endOfDay());
    }

    /**
     * Get or create a conversation for this session.
     */
    public function getConversation(string $sessionId, ?string $ip = null, ?string $ua = null): AiConversation
    {
        return AiConversation::firstOrCreate(
            ['session_id' => $sessionId],
            ['ip_address' => $ip, 'user_agent' => Str::limit($ua, 500)]
        );
    }

    /**
     * Send a message and get AI response.
     * Tries Gemini first, then falls back to Qwen if Gemini fails or is exhausted.
     *
     * @return array{success: bool, message: string, error?: string}
     */
    public function chat(AiConversation $conversation, string $userMessage, string $lang = 'en'): array
    {
        // 1. Rate limit check
        if ($this->isRateLimited($conversation->session_id)) {
            return [
                'success' => false,
                'message' => $lang === 'id'
                    ? 'Anda telah mencapai batas pesan harian. Silakan coba lagi besok atau hubungi langsung melalui halaman Kontak.'
                    : 'You have reached the daily message limit. Please try again tomorrow or contact directly via the Contact page.',
            ];
        }

        // 2. Sanitize input
        $userMessage = $this->sanitize($userMessage);
        if (empty($userMessage)) {
            return [
                'success' => false,
                'message' => $lang === 'id' ? 'Pesan tidak boleh kosong.' : 'Message cannot be empty.',
            ];
        }

        // 3. Save user message
        $conversation->messages()->create([
            'role' => 'user',
            'content' => $userMessage,
        ]);
        $conversation->increment('messages_count');

        // 4. Build system prompt
        $systemPrompt = $this->buildSystemPrompt($lang, $userMessage);

        // 5. Try providers in order: Gemini → Qwen
        $providers = $this->getOrderedProviders();

        foreach ($providers as $provider) {
            $result = match ($provider) {
                'gemini' => $this->callGemini($conversation, $userMessage, $systemPrompt, $lang),
                'qwen' => $this->callQwen($conversation, $userMessage, $systemPrompt, $lang),
                default => null,
            };

            if ($result && $result['success']) {
                // Save AI response
                $conversation->messages()->create([
                    'role' => 'assistant',
                    'content' => $result['message'],
                    'tokens_used' => $result['tokens'] ?? 0,
                ]);
                $conversation->increment('messages_count');
                $this->incrementDaily($conversation->session_id);

                return [
                    'success' => true,
                    'message' => $result['message'],
                ];
            }
        }

        // All providers failed
        return $this->maintenanceResponse($lang);
    }

    /**
     * Get ordered list of AI providers to try.
     * Checks which providers have API keys and are not exhausted.
     */
    private function getOrderedProviders(): array
    {
        $providers = [];

        // Check Gemini availability
        $geminiKey = SiteSetting::getValue('gemini_api_key', '');
        $geminiExhausted = SiteSetting::getValue('ai_gemini_exhausted', false);
        if (!empty($geminiKey) && !$geminiExhausted) {
            $providers[] = 'gemini';
        }

        // Check Qwen availability
        $qwenKey = SiteSetting::getValue('qwen_api_key', '');
        $qwenExhausted = SiteSetting::getValue('ai_qwen_exhausted', false);
        if (!empty($qwenKey) && !$qwenExhausted) {
            $providers[] = 'qwen';
        }

        // If both exhausted, still try (maybe quota reset)
        if (empty($providers)) {
            if (!empty($geminiKey))
                $providers[] = 'gemini';
            if (!empty($qwenKey))
                $providers[] = 'qwen';
        }

        return $providers;
    }

    /**
     * Call Google Gemini API.
     *
     * @return array{success: bool, message: string, tokens?: int}|null
     */
    private function callGemini(AiConversation $conversation, string $userMessage, string $systemPrompt, string $lang): ?array
    {
        $apiKey = SiteSetting::getValue('gemini_api_key', '');
        if (empty($apiKey))
            return null;

        $contents = $this->buildGeminiContents($conversation, $userMessage);
        $model = SiteSetting::getValue('gemini_model', 'gemini-2.0-flash');

        try {
            $response = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'system_instruction' => [
                        'parts' => [['text' => $systemPrompt]],
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'topP' => 0.9,
                        'maxOutputTokens' => 1024,
                    ],
                    'safetySettings' => [
                        ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                        ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                        ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                        ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
                    ],
                ]
            );

            if ($response->status() === 429 || $response->status() === 403) {
                SiteSetting::setValue('ai_gemini_exhausted', true, 'api');
                Log::warning('AI Assistant: Gemini quota exhausted, will try fallback', ['status' => $response->status()]);
                return null; // Trigger fallback to Qwen
            }

            if (!$response->successful()) {
                Log::error('AI Assistant: Gemini API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 1000),
                ]);
                return null; // Trigger fallback
            }

            $data = $response->json();
            $aiText = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$aiText) {
                $aiText = $lang === 'id'
                    ? 'Maaf, saya tidak bisa menjawab pertanyaan itu. Silakan tanyakan hal lain tentang pemilik portfolio ini.'
                    : 'Sorry, I cannot answer that question. Please ask something else about the portfolio owner.';
            }

            $tokensUsed = $data['usageMetadata']['totalTokenCount'] ?? 0;

            return [
                'success' => true,
                'message' => $aiText,
                'tokens' => $tokensUsed,
            ];

        } catch (\Exception $e) {
            Log::error('AI Assistant: Gemini exception', ['error' => $e->getMessage()]);
            return null; // Trigger fallback
        }
    }

    /**
     * Call Alibaba Cloud Qwen API (DashScope — OpenAI-compatible format).
     *
     * @return array{success: bool, message: string, tokens?: int}|null
     */
    private function callQwen(AiConversation $conversation, string $userMessage, string $systemPrompt, string $lang): ?array
    {
        $apiKey = SiteSetting::getValue('qwen_api_key', '');
        if (empty($apiKey))
            return null;

        $model = SiteSetting::getValue('qwen_model', 'qwen-plus');
        $endpoint = SiteSetting::getValue('qwen_endpoint', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions');

        $messages = $this->buildOpenAIMessages($conversation, $userMessage, $systemPrompt);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'top_p' => 0.9,
                    'max_tokens' => 1024,
                ]);

            if ($response->status() === 429 || $response->status() === 403) {
                SiteSetting::setValue('ai_qwen_exhausted', true, 'api');
                Log::warning('AI Assistant: Qwen quota exhausted', ['status' => $response->status()]);
                return null;
            }

            if (!$response->successful()) {
                Log::error('AI Assistant: Qwen API error', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 1000),
                ]);
                return null;
            }

            $data = $response->json();
            $aiText = $data['choices'][0]['message']['content'] ?? null;

            if (!$aiText) {
                $aiText = $lang === 'id'
                    ? 'Maaf, saya tidak bisa menjawab pertanyaan itu. Silakan tanyakan hal lain tentang pemilik portfolio ini.'
                    : 'Sorry, I cannot answer that question. Please ask something else about the portfolio owner.';
            }

            $tokensUsed = ($data['usage']['total_tokens'] ?? 0);

            return [
                'success' => true,
                'message' => $aiText,
                'tokens' => $tokensUsed,
            ];

        } catch (\Exception $e) {
            Log::error('AI Assistant: Qwen exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Build messages array in OpenAI-compatible format (for Qwen).
     */
    private function buildOpenAIMessages(AiConversation $conversation, string $latestUserMessage, string $systemPrompt): array
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Fetch recent conversation history
        $history = $conversation->messages()
            ->orderByDesc('created_at')
            ->limit(self::MAX_HISTORY_PAIRS * 2 + 1)
            ->get()
            ->reverse()
            ->values();

        // Remove the last message (the one we just saved)
        if ($history->isNotEmpty() && $history->last()->role === 'user') {
            $history = $history->slice(0, -1)->values();
        }

        foreach ($history as $msg) {
            $role = $msg->role === 'assistant' ? 'assistant' : 'user';
            $messages[] = ['role' => $role, 'content' => $msg->content];
        }

        // Add the current user message
        $messages[] = ['role' => 'user', 'content' => $latestUserMessage];

        return $messages;
    }

    /**
     * Build the system prompt with portfolio context data.
     */
    private function buildSystemPrompt(string $lang, string $userQuery = ''): string
    {
        $staticContext = $this->buildStaticContext();
        $searchResults = $this->searchRelevantData($userQuery);
        $contactInfo = $this->getContactInfo();

        $langInstruction = $lang === 'id'
            ? 'Selalu jawab dalam Bahasa Indonesia yang natural dan ramah.'
            : 'Always respond in natural, friendly English.';

        $appUrl = config('app.url');

        return <<<PROMPT
# AI PORTFOLIO ASSISTANT PERSONA
You are "AI Assistant Portofolio Reza", a smart, helpful, and professional digital representative of Reza Edi Saputra.
Your goal is to answer questions about Reza's work, projects, blogs, education, and career with accuracy and a friendly tone ("Mantaps").

## BASE URL
The website's base URL is: {$appUrl}
- For internal links, you can use absolute URLs: `{$appUrl}/blog/slug` or relative: `/blog/slug`.
- Prefer relative links for markdown: `[Text](/blog/slug)`.

{$langInstruction}

## MODE MANTAPS (Core Persona)
1. **Be Concise & Natural**: Avoid robotic "As an AI..." phrasing. Speak like a human assistant.
2. **Token Efficiency**: Get straight to the point. No fluff, no redundant pleasantries.
3. **No Unsolicited Promotion**: Do not suggest contact links or social media unless specifically asked or highly relevant to the context.
4. **Contextual Memory**: Always check the conversation history. If the user already shared their name, use it naturally. If they are continuing a topic, don't restart the greeting.
5. **Identity**: You are NOT just a bot; you are Reza's representative. Use "Reza" or "He/Him" when referring to the portfolio owner, but remain an assistant persona.

## INSTRUCTIONS
- Answer the visitor's question using the portfolio data and conversation history provided.
- Evaluation: Check history first → Check search results → Formulate response.
- If you already greeted the user in this session (check history), skip the greeting.
- Use markdown for structure (bolding, lists) but keep it sleek.

## ANSWERING RULES
1. **Data-Driven**: Use ONLY the provided Context & Search Results.
2. **Context Restriction (GUARDRAILS)**: 
   - If the request is COMPLETELY unrelated to Reza's work, blogs, projects, or his personal stories/activities mentioned in blogs (e.g., "who is the president of USA", "calculate 5*5"), politely decline: "Hmm, kalau soal itu nggak ada di dataku... Aku cuma asisten portofolionya Reza."
   - If asked for code (e.g., "buatkan fungsi python"): 
     a. Check if Reza has projects/blogs about it. If the code exists in the context, PROVIDE IT COMPLETELY.
     b. **STRICT MANDATE**: If the user asks for code in a specific language (e.g. JavaScript) but Reza's data only shows it in another language (e.g. Python), DO NOT generate the JavaScript code from your general knowledge. Say: "Wah, di portofolio Reza adanya versi [Python], untuk versi [JavaScript] belum ada datanya. Ini kodingan versi [Python]-nya..." and provide the available one.
     c. If no data exists at all for the topic, decline politely: "Wah maaf nih, aku cuma asisten portofolionya Reza. Reza belum pernah bahas atau buat project soal itu di dataku."
   - **Personal Info**: If the question is about Reza's activities, hobbies, or personal life, check the Blogs context.
3. **PROACTIVE LINKING (MANDATORY)**:
   - Jika jawabanmu merujuk pada blog atau project tertentu, kamu **WAJIB** memberikan link-nya.
   - **WAJIB GUNAKAN FORMAT MARKDOWN LINK**: Selalu bungkus URL dalam format `[Judul]({$appUrl}/slug)`.
   - **DILARANG MENULIS URL MENTAH**: Jangan pernah menuliskan `https://...` secara langsung tanpa dibungkus markdown. Contoh salah: `Linknya: https://xxx`. Contoh benar: `Silakan buka [halaman ini](https://xxx)`.
4. **STRICTLY DATA-DRIVEN**: NEVER use your general training data to "fill in the gaps" for Reza's skills, projects, or coding abilities. If it's not in the Context, Reza hasn't done it yet in this portfolio.
5. **Personalization**: Use user details if previously shared.
6. **Fallback**: If portfolio info is missing but the topic is relevant to Reza: "I don't have specific details on that yet, but you can ask Reza langsung via [halaman kontak]({$appUrl}/contact)."
7. **NO RAW HTML**: NEVER generate raw HTML tags like `<a>`, `<b>`, `<br>`. ONLY use standard Markdown syntax (`[text](url)`, `**bold**`).

---

{$staticContext}

{$searchResults}

---

## CONTACT INFORMATION
{$contactInfo}
PROMPT;
    }

    /**
     * Build STATIC context — core data that's always included (small, rarely changes).
     * Cached for 5 minutes.
     */
    private function buildStaticContext(): string
    {
        return Cache::remember('ai_static_context_v3', 300, function () {
            $parts = [];

            // Profile
            $profiles = Profile::ordered()->get();
            if ($profiles->isNotEmpty()) {
                $contactKeys = ['email', 'location', 'whatsapp', 'github', 'github_url', 'linkedin', 'linkedin_url', 'instagram', 'instagram_url', 'twitter', 'twitter_url'];
                $parts[] = "## ABOUT REZA EDI SAPUTRA";
                foreach ($profiles as $p) {
                    $val = $p->value_en ?: $p->value_id;
                    $key = strtolower($p->key);
                    if ($val && !Str::contains($key, ['photo', 'bullet', 'meta', 'typewriter']) && !in_array($key, $contactKeys)) {
                        $parts[] = "- **{$p->key}**: {$val}";
                    }
                }
            }

            // Education
            $educations = Education::orderByDesc('start_date')->get();
            if ($educations->isNotEmpty()) {
                $parts[] = "\n## EDUCATION";
                foreach ($educations as $e) {
                    $field = $e->field_en ?: $e->field ?: '';
                    $inst = $e->institution_en ?: $e->institution ?: '';
                    $degree = $e->degree_en ?: $e->degree ?: '';
                    $gpa = $e->gpa ? " (GPA: {$e->gpa})" : '';
                    $year = ($e->start_date ? $e->start_date->format('Y') : '') . '–' . ($e->end_date ? $e->end_date->format('Y') : 'Present');
                    $desc = $e->description_en ?: $e->description_id ?: '';
                    $line = "- **{$degree}** in {$field} at **{$inst}** ({$year}){$gpa}";
                    if ($desc)
                        $line .= ": {$desc}";
                    $parts[] = $line;
                }
            }

            // Careers
            $careers = Career::orderByDesc('start_date')->get();
            if ($careers->isNotEmpty()) {
                $parts[] = "\n## WORK EXPERIENCE";
                foreach ($careers as $c) {
                    $position = $c->position_en ?: $c->position_id ?: '';
                    $company = $c->company_en ?: $c->company ?: '';
                    $desc = $c->description_en ?: $c->description_id ?: '';
                    $period = ($c->start_date ? $c->start_date->format('M Y') : '') . ' – ' . ($c->end_date ? $c->end_date->format('M Y') : 'Present');
                    $line = "- **{$position}** at **{$company}** ({$period})";
                    if ($desc)
                        $line .= ": {$desc}";
                    $parts[] = $line;
                }
            }

            // Skills
            $categories = SkillCategory::with('skills')->ordered()->get();
            if ($categories->isNotEmpty()) {
                $parts[] = "\n## SKILLS & TECH STACK";
                foreach ($categories as $cat) {
                    $catName = $cat->name_en ?: $cat->name_id ?: '';
                    $skills = $cat->skills->map(fn($s) => $s->name_en ?: $s->name_id ?: '')->filter()->join(', ');
                    if ($skills)
                        $parts[] = "- **{$catName}**: {$skills}";
                }
            }

            // Organizations
            $orgs = Organization::ordered()->get();
            if ($orgs->isNotEmpty()) {
                $parts[] = "\n## ORGANIZATIONS";
                foreach ($orgs as $o) {
                    $name = $o->name_en ?: $o->name ?: '';
                    $role = $o->role_en ?: $o->role ?: '';
                    $desc = $o->description_en ?: $o->description_id ?: '';
                    $period = ($o->start_date ? $o->start_date->format('Y') : '') . '–' . ($o->end_date ? $o->end_date->format('Y') : 'Present');
                    $line = "- **{$role}** at **{$name}** ({$period})";
                    if ($desc)
                        $line .= ": {$desc}";
                    $parts[] = $line;
                }
            }

            // Testimonials
            $testimonials = Testimonial::ordered()->get();
            if ($testimonials->isNotEmpty()) {
                $parts[] = "\n## TESTIMONIALS";
                foreach ($testimonials as $t) {
                    $client = $t->client_name ?: '';
                    $position = $t->position_en ?: $t->position ?: '';
                    $company = $t->company_en ?: $t->company ?: '';
                    $content = $t->content_en ?: $t->content_id ?: '';
                    $line = "- **{$client}** ({$position} at {$company})";
                    if ($content)
                        $line .= ": \"{$content}\"";
                    $parts[] = $line;
                }
            }

            return implode("\n", $parts);
        });
    }

    /**
     * Search for data relevant to the user's question using keyword matching.
     * This allows the AI to find old blog posts, projects, certificates etc.
     */
    private function searchRelevantData(string $query): string
    {
        if (empty(trim($query)))
            return '';

        $words = preg_split('/[\s\.,\-\?!]+/', mb_strtolower(strip_tags($query)), -1, PREG_SPLIT_NO_EMPTY);
        $stopwords = [
            'reza',
            'edi',
            'saputra',
            'the',
            'and',
            'for',
            'with',
            'on',
            'at',
            'by',
            'an',
            'be',
            'as',
            'it'
        ];

        // Remove stopwords and short words
        $keywords = array_filter($words, fn($w) => mb_strlen($w) >= 3 && !in_array($w, $stopwords));

        // Indonesian Suffix Stripping
        $keywords = array_map(function ($w) {
            if (Str::endsWith($w, ['nya', 'kah', 'pun']))
                return Str::replaceLast(substr($w, -3), '', $w);
            if (Str::endsWith($w, ['ku', 'mu']))
                return Str::replaceLast(substr($w, -2), '', $w);
            return $w;
        }, $keywords);

        $keywords = array_values(array_unique(array_filter($keywords, fn($w) => mb_strlen($w) >= 3)));

        // Add the whole cleaned question as a phrase for exact matching
        $phrase = trim(preg_replace('/[^\p{L}\p{N}\s]/u', '', $query));
        if (mb_strlen($phrase) > 8) {
            array_unshift($keywords, $phrase);
        }

        if (empty($keywords))
            return '';

        $parts = [];

        // Search Projects
        $projects = $this->searchModel(Project::published(), $keywords, ['title_id', 'title_en', 'excerpt_id', 'excerpt_en', 'content_id', 'content_en', 'tech_stack'], 5);
        if ($projects->isNotEmpty()) {
            $parts[] = "\n## RELEVANT PROJECTS (Link: /projects/{slug})";
            foreach ($projects as $p) {
                $title = $p->title_en ?: $p->title_id ?: '';
                $excerpt = $p->excerpt_en ?: $p->excerpt_id ?: '';
                $contentSnippet = $p->content_en ?: $p->content_id ?: '';
                $line = "- **{$title}** (Slug: {$p->slug})";
                if ($p->repo_url)
                    $line .= "\n  GitHub: {$p->repo_url}";
                if ($p->demo_url)
                    $line .= "\n  Demo: {$p->demo_url}";
                $line .= "\n  Summary: {$excerpt}\n  Context: " . Str::limit(strip_tags($contentSnippet), 2000);
                $parts[] = $line;
            }
        }

        // Search Blogs
        $blogs = $this->searchModel(Blog::published(), $keywords, ['title_id', 'title_en', 'excerpt_id', 'excerpt_en', 'content_id', 'content_en'], 5);
        if ($blogs->isNotEmpty()) {
            $parts[] = "\n## RELEVANT BLOG POSTS (Link: /blog/{slug})";
            foreach ($blogs as $b) {
                $title = $b->title_en ?: $b->title_id ?: '';
                $excerpt = $b->excerpt_en ?: $b->excerpt_id ?: '';
                $content = $b->content_en ?: $b->content_id ?: '';

                // Increase limit to 5000 to capture code blocks and more detail
                $contentSnippet = $content ? Str::limit(strip_tags($content), 5000) : '';

                $line = "- **{$title}** (Slug: {$b->slug})";
                if ($excerpt)
                    $line .= "\n  Summary: {$excerpt}";
                if ($contentSnippet)
                    $line .= "\n  Full Content Snippet: {$contentSnippet}";
                $parts[] = $line;
            }
        }

        // Search Careers
        $careers = $this->searchModel(Career::query(), $keywords, ['position_id', 'position_en', 'company', 'company_en', 'description_id', 'description_en'], 5);
        if ($careers->isNotEmpty()) {
            $parts[] = "\n## WORK EXPERIENCE";
            foreach ($careers as $c) {
                $pos = $c->position_en ?: $c->position_id ?: '';
                $comp = $c->company_en ?: $c->company ?: '';
                $parts[] = "- **{$pos}** at **{$comp}** ({$c->start_date?->format('Y')})";
            }
        }

        // Search Education
        $educations = $this->searchModel(Education::query(), $keywords, ['degree', 'degree_en', 'institution', 'institution_en', 'field', 'field_en', 'description_id', 'description_en'], 5);
        if ($educations->isNotEmpty()) {
            $parts[] = "\n## EDUCATION";
            foreach ($educations as $e) {
                $deg = $e->degree_en ?: $e->degree ?: '';
                $inst = $e->institution_en ?: $e->institution ?: '';
                $parts[] = "- **{$deg}** at **{$inst}**";
            }
        }

        // Search Profile Bio
        $profiles = $this->searchModel(Profile::query(), $keywords, ['value_id', 'value_en'], 10);
        if ($profiles->isNotEmpty()) {
            $parts[] = "\n## OTHER REZA INFO";
            foreach ($profiles as $p) {
                $parts[] = "- **{$p->key}**: " . Str::limit($p->value_en ?: $p->value_id, 300);
            }
        }

        // Search Certificates
        $certs = $this->searchModel(Certificate::query(), $keywords, ['title', 'title_en', 'issuer', 'description_id', 'description_en', 'category', 'category_en'], 5);
        if ($certs->isNotEmpty()) {
            $parts[] = "\n## RELEVANT CERTIFICATES";
            foreach ($certs as $c) {
                $title = $c->title_en ?: $c->title ?: '';
                $issuer = $c->issuer ?: '';
                $skills = is_array($c->skills) ? implode(', ', $c->skills) : '';
                $date = $c->issued_date ? $c->issued_date->format('M Y') : '';
                $line = "- **{$title}** by {$issuer} ({$date})";
                if ($skills)
                    $line .= " [Skills: {$skills}]";
                $parts[] = $line;
            }
        }

        // Search Achievements
        $achievements = $this->searchModel(Achievement::query(), $keywords, ['title_id', 'title_en', 'description_id', 'description_en'], 5);
        if ($achievements->isNotEmpty()) {
            $parts[] = "\n## RELEVANT ACHIEVEMENTS";
            foreach ($achievements as $a) {
                $title = $a->title_en ?: $a->title_id ?: '';
                $desc = $a->description_en ?: $a->description_id ?: '';
                $date = $a->date ? $a->date->format('M Y') : '';
                $parts[] = "- **{$title}** ({$date})" . ($desc ? ": {$desc}" : '');
            }
        }

        // Search Achievements
        $achievements = $this->searchModel(Achievement::query(), $keywords, ['title_id', 'title_en', 'description_id', 'description_en'], 5);
        if ($achievements->isNotEmpty()) {
            $parts[] = "\n## RELEVANT ACHIEVEMENTS";
            foreach ($achievements as $a) {
                $title = $a->title_en ?: $a->title_id ?: '';
                $parts[] = "- **{$title}** (" . ($a->date?->format('Y') ?? '') . ")";
            }
        }

        // Search Organizations
        $organizations = $this->searchModel(Organization::query(), $keywords, ['name', 'name_en', 'role', 'role_en', 'description_id', 'description_en'], 5);
        if ($organizations->isNotEmpty()) {
            $parts[] = "\n## RELEVANT ORGANIZATIONS";
            foreach ($organizations as $o) {
                $name = $o->name_en ?: $o->name ?: '';
                $pos = $o->role_en ?: $o->role ?: '';
                $parts[] = "- **{$pos}** at **{$name}**";
            }
        }

        // ALWAYS include a few latest items as global context for proactive linking
        $parts[] = "\n## LATEST UPDATES (Global Context for Proactive Linking)";

        $latestProjects = Project::published()->orderByDesc('published_at')->limit(3)->get();
        foreach ($latestProjects as $lp) {
            $parts[] = "- Project: [{$lp->title_id}](/projects/{$lp->slug})";
        }

        $latestBlogs = Blog::published()->orderByDesc('published_at')->limit(3)->get();
        foreach ($latestBlogs as $lb) {
            $parts[] = "- Blog: [{$lb->title_id}](/blog/{$lb->slug})";
        }

        return implode("\n", $parts);
    }

    /**
     * Search a model using keyword LIKE matching across multiple columns.
     */
    private function searchModel($query, array $keywords, array $columns, int $limit)
    {
        $query->where(function ($q) use ($keywords, $columns) {
            foreach ($keywords as $kw) {
                $q->orWhere(function ($inner) use ($kw, $columns) {
                    foreach ($columns as $col) {
                        $inner->orWhere($col, 'LIKE', "%{$kw}%");
                    }
                });
            }
        });

        return $query->limit($limit)->get();
    }

    /**
     * Fallback: get recent items when no keyword match is found.
     */
    private function getRecentItems(): string
    {
        $parts = [];

        $projects = Project::published()->orderByDesc('published_at')->limit(5)->get();
        if ($projects->isNotEmpty()) {
            $parts[] = "\n## RECENT PROJECTS";
            foreach ($projects as $p) {
                $title = $p->title_en ?: $p->title_id ?: '';
                $tech = is_array($p->tech_stack) ? implode(', ', $p->tech_stack) : '';
                $parts[] = "- **{$title}**" . ($tech ? " [Tech: {$tech}]" : '');
            }
        }

        $blogs = Blog::published()->orderByDesc('published_at')->limit(3)->get();
        if ($blogs->isNotEmpty()) {
            $parts[] = "\n## RECENT BLOG POSTS";
            foreach ($blogs as $b) {
                $title = $b->title_en ?: $b->title_id ?: '';
                $excerpt = $b->excerpt_en ?: $b->excerpt_id ?: '';
                $parts[] = "- **{$title}**" . ($excerpt ? ": {$excerpt}" : '');
            }
        }

        $certs = Certificate::orderByDesc('issued_date')->limit(5)->get();
        if ($certs->isNotEmpty()) {
            $parts[] = "\n## RECENT CERTIFICATES";
            foreach ($certs as $c) {
                $title = $c->title_en ?: $c->title ?: '';
                $issuer = $c->issuer ?: '';
                $parts[] = "- **{$title}** by {$issuer}";
            }
        }

        return implode("\n", $parts);
    }

    /**
     * Get contact info for the AI to reference.
     */
    private function getContactInfo(): string
    {
        // Get contact details from Profile model (email, social links, etc.)
        $contactKeys = [
            'email',
            'location',
            'whatsapp',
            'github',
            'github_url',
            'linkedin',
            'linkedin_url',
            'instagram',
            'instagram_url',
            'twitter',
            'twitter_url'
        ];
        $profiles = Profile::whereIn('key', $contactKeys)->ordered()->get();

        if ($profiles->isEmpty()) {
            return 'Visit the Contact page on this website.';
        }

        $contactMap = [];
        foreach ($profiles as $p) {
            $val = $p->value_en ?: $p->value_id;
            if (!$val) continue;

            $cleanVal = trim(strip_tags($val));
            $label = strtolower(str_replace('_url', '', $p->key));

            // If we have multiple for same label (e.g. 'github' and 'github_url'), 
            // prioritize the one that looks like a full URL or is more specific
            if (!isset($contactMap[$label]) || Str::startsWith($cleanVal, 'http')) {
                $contactMap[$label] = $cleanVal;
            }
        }

        $lines = [];
        foreach ($contactMap as $label => $value) {
            $lines[] = "- **" . ucfirst($label) . "**: {$value}";
        }

        return implode("\n", $lines);
    }

    /**
     * Build the 'contents' array for Gemini API.
     *
     * Strategy: We fetch the last N pairs of messages from the DB as conversation history.
     * The current user message is ALREADY saved to DB before this method is called,
     * so it will be included as the last 'user' entry.
     *
     * Gemini requires strict alternation: user → model → user → model → user
     * The last entry MUST be 'user'.
     */
    private function buildGeminiContents(AiConversation $conversation, string $latestUserMessage): array
    {
        // Fetch recent messages (excluding the one we just saved — we'll add it manually)
        $messages = $conversation->messages()
            ->orderByDesc('created_at')
            ->limit(self::MAX_HISTORY_PAIRS * 2 + 1) // +1 for the message we just saved
            ->get()
            ->reverse()
            ->values();

        // Remove the last message (the one we just saved) — we'll add it cleanly at the end
        if ($messages->isNotEmpty() && $messages->last()->role === 'user') {
            $messages = $messages->slice(0, -1)->values();
        }

        $contents = [];

        foreach ($messages as $msg) {
            $role = $msg->role === 'assistant' ? 'model' : 'user';
            $text = $msg->content;

            // Enforce strict alternation — merge consecutive same-role messages
            if (!empty($contents) && end($contents)['role'] === $role) {
                $lastIdx = count($contents) - 1;
                $contents[$lastIdx]['parts'][0]['text'] .= "\n" . $text;
            } else {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $text]],
                ];
            }
        }

        // Ensure correct alternation: if history ends with 'user', we need a dummy model response
        if (!empty($contents) && end($contents)['role'] === 'user') {
            $contents[] = [
                'role' => 'model',
                'parts' => [['text' => 'Baik, saya siap menjawab pertanyaan selanjutnya.']],
            ];
        }

        // The MUST-HAVE last entry: the current user message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $latestUserMessage]],
        ];

        // Final validation: must start with 'user'
        if (!empty($contents) && $contents[0]['role'] === 'model') {
            array_shift($contents);
        }

        return $contents;
    }

    /**
     * Sanitize user input.
     */
    private function sanitize(string $text): string
    {
        $text = strip_tags($text);
        $text = trim($text);
        $text = Str::limit($text, 500, '');
        return $text;
    }

    /**
     * Generic maintenance response (hides real reason from users).
     */
    private function maintenanceResponse(string $lang): array
    {
        return [
            'success' => false,
            'message' => $lang === 'id'
                ? 'Maaf, asisten AI sedang dalam pemeliharaan sementara. Silakan coba lagi nanti atau hubungi langsung melalui halaman Kontak. 🙏'
                : 'Sorry, the AI assistant is temporarily under maintenance. Please try again later or reach out directly via the Contact page. 🙏',
        ];
    }
}
