<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Blog;
use App\Models\BlogTag;
use App\Models\Career;
use App\Models\Certificate;
use App\Models\Education;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::updateOrCreate(
            ['email' => 'admin@portfolio.test'],
            ['name' => 'Reza', 'password' => Hash::make('password')]
        );

        // Profile entries
        $profiles = [
            ['key' => 'name', 'value_id' => 'Reza', 'value_en' => 'Reza', 'type' => 'text', 'sort_order' => 0],
            ['key' => 'title', 'value_id' => 'AI Engineer & Full-Stack Developer', 'value_en' => 'AI Engineer & Full-Stack Developer', 'type' => 'text', 'sort_order' => 1],
            ['key' => 'bio', 'value_id' => 'Seorang engineer yang passionate di bidang AI dan pengembangan web modern.', 'value_en' => 'A passionate engineer specializing in AI and modern web development.', 'type' => 'html', 'sort_order' => 2],
            ['key' => 'location', 'value_id' => 'Indonesia', 'value_en' => 'Indonesia', 'type' => 'text', 'sort_order' => 3],
            ['key' => 'email', 'value_id' => 'reza@example.com', 'value_en' => 'reza@example.com', 'type' => 'text', 'sort_order' => 4],
            ['key' => 'github', 'value_id' => 'https://github.com/reza', 'value_en' => 'https://github.com/reza', 'type' => 'text', 'sort_order' => 5],
            ['key' => 'linkedin', 'value_id' => 'https://linkedin.com/in/reza', 'value_en' => 'https://linkedin.com/in/reza', 'type' => 'text', 'sort_order' => 6],
        ];
        foreach ($profiles as $p) {
            Profile::updateOrCreate(['key' => $p['key']], $p);
        }

        // Education
        Education::updateOrCreate(['institution' => 'Universitas Indonesia'], [
            'institution' => 'Universitas Indonesia',
            'degree' => 'S1',
            'field' => 'Teknik Informatika',
            'start_date' => '2019-08-01',
            'end_date' => '2023-07-01',
            'description_id' => 'Fokus pada Machine Learning dan Web Development.',
            'description_en' => 'Focused on Machine Learning and Web Development.',
            'sort_order' => 0,
        ]);

        // Career
        $mainCareer = Career::updateOrCreate(['company' => 'Tech Startup', 'position' => 'Full-Stack Developer'], [
            'start_date' => '2023-08-01',
            'is_current' => true,
            'description_id' => 'Membangun platform SaaS menggunakan Laravel dan React.',
            'description_en' => 'Building SaaS platform using Laravel and React.',
            'branch_label' => 'main',
            'branch_color' => '#10b981',
            'sort_order' => 0,
        ]);

        Career::updateOrCreate(['company' => 'AI Lab', 'position' => 'AI Engineer Intern'], [
            'start_date' => '2022-06-01',
            'end_date' => '2023-02-01',
            'description_id' => 'Riset NLP dan Computer Vision.',
            'description_en' => 'NLP and Computer Vision research.',
            'parent_id' => $mainCareer->id,
            'branch_label' => 'feature/ai-research',
            'branch_color' => '#6366f1',
            'sort_order' => 1,
        ]);

        // Skills
        $categories = [
            ['name_id' => 'Bahasa Pemrograman', 'name_en' => 'Programming Languages', 'icon' => 'Code', 'skills' => [
                ['name' => 'PHP', 'proficiency' => 90, 'icon' => 'php'],
                ['name' => 'TypeScript', 'proficiency' => 85, 'icon' => 'typescript'],
                ['name' => 'Python', 'proficiency' => 80, 'icon' => 'python'],
                ['name' => 'JavaScript', 'proficiency' => 90, 'icon' => 'javascript'],
            ]],
            ['name_id' => 'Framework', 'name_en' => 'Frameworks', 'icon' => 'Layers', 'skills' => [
                ['name' => 'Laravel', 'proficiency' => 95, 'icon' => 'laravel'],
                ['name' => 'React', 'proficiency' => 88, 'icon' => 'react'],
                ['name' => 'Next.js', 'proficiency' => 75, 'icon' => 'nextjs'],
                ['name' => 'TailwindCSS', 'proficiency' => 92, 'icon' => 'tailwind'],
            ]],
            ['name_id' => 'AI & Data', 'name_en' => 'AI & Data', 'icon' => 'Brain', 'skills' => [
                ['name' => 'TensorFlow', 'proficiency' => 70, 'icon' => 'tensorflow'],
                ['name' => 'PyTorch', 'proficiency' => 65, 'icon' => 'pytorch'],
                ['name' => 'Google Gemini API', 'proficiency' => 80, 'icon' => 'gemini'],
            ]],
        ];

        foreach ($categories as $i => $cat) {
            $skills = $cat['skills'];
            unset($cat['skills']);
            $cat['sort_order'] = $i;
            $category = SkillCategory::updateOrCreate(['name_en' => $cat['name_en']], $cat);
            foreach ($skills as $j => $skill) {
                $skill['skill_category_id'] = $category->id;
                $skill['sort_order'] = $j;
                Skill::updateOrCreate(['name' => $skill['name'], 'skill_category_id' => $category->id], $skill);
            }
        }

        // Projects
        Project::updateOrCreate(['slug' => 'ai-portfolio'], [
            'title_id' => 'Portfolio AI-Powered',
            'title_en' => 'AI-Powered Portfolio',
            'excerpt_id' => 'Website portfolio dengan fitur AI chatbot dan pengalaman interaktif.',
            'excerpt_en' => 'Portfolio website with AI chatbot and interactive experience.',
            'problem_id' => 'Portfolio tradisional hanya menampilkan daftar proyek statis tanpa interaksi.',
            'problem_en' => 'Traditional portfolios only show static project lists without interaction.',
            'solution_id' => 'Membangun portfolio dengan AI clone assistant, real-time features, dan UX premium.',
            'solution_en' => 'Building a portfolio with AI clone assistant, real-time features, and premium UX.',
            'tech_stack' => ['Laravel', 'React', 'Inertia.js', 'TailwindCSS', 'Gemini API'],
            'is_featured' => true,
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Blog Tags
        $tags = [];
        foreach (['Laravel' => 'Laravel', 'React' => 'React', 'AI' => 'AI', 'Tutorial' => 'Tutorial'] as $en => $id) {
            $tags[] = BlogTag::updateOrCreate(['slug' => strtolower($en)], [
                'name_id' => $id,
                'name_en' => $en,
            ]);
        }

        // Blog
        $blog = Blog::updateOrCreate(['slug' => 'building-ai-portfolio'], [
            'title_id' => 'Membangun Portfolio dengan AI',
            'title_en' => 'Building an AI-Powered Portfolio',
            'content_id' => '<p>Panduan lengkap membangun portfolio modern dengan fitur AI chatbot.</p>',
            'content_en' => '<p>Complete guide to building a modern portfolio with AI chatbot features.</p>',
            'excerpt_id' => 'Panduan membangun portfolio AI.',
            'excerpt_en' => 'Guide to building an AI portfolio.',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $blog->tags()->sync([$tags[0]->id, $tags[1]->id, $tags[2]->id]);

        // Achievements
        Achievement::updateOrCreate(['title_en' => 'Best Graduation Project'], [
            'title_id' => 'Proyek Akhir Terbaik',
            'title_en' => 'Best Graduation Project',
            'description_id' => 'Penghargaan untuk proyek akhir terbaik di bidang AI.',
            'description_en' => 'Award for the best graduation project in AI field.',
            'icon' => 'Trophy',
            'date' => '2023-07-15',
            'type' => 'academic',
            'sort_order' => 0,
        ]);

        // Certificates
        Certificate::updateOrCreate(['title' => 'Google TensorFlow Developer'], [
            'issuer' => 'Google',
            'credential_id' => 'GOOG-TF-12345',
            'credential_url' => 'https://www.credential.net/example',
            'issued_date' => '2023-03-01',
            'sort_order' => 0,
        ]);
    }
}
