<?php

namespace App\Http\Controllers;

use App\Models\Career;
use App\Models\Education;
use App\Models\Profile;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\SoftSkill;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class CvController extends Controller
{
    public function download(string $lang): Response
    {
        $profiles  = Profile::ordered()->get()->keyBy('key');
        
        $educations = Education::where('show_in_cv', true)->ordered()->get();
        
        $careers   = Career::where('show_in_cv', true)
            ->with(['children' => function($q) {
                $q->where('show_in_cv', true)->orderBy('sort_order')->orderBy('start_date', 'desc');
            }])
            ->roots()
            ->chronological()
            ->get();
            
        $skillCategories = SkillCategory::withOrderedSkills()->ordered()->get();
        
        $projects = \App\Models\Project::where('show_in_cv', true)->orderBy('published_at', 'desc')->get();
        $certificates = \App\Models\Certificate::where('show_in_cv', true)->orderBy('issued_date', 'desc')->get();
        $organizations = \App\Models\Organization::where('show_in_cv', true)->ordered()->get();
        $achievements = \App\Models\Achievement::where('show_in_cv', true)->ordered()->get();
        $softSkills = SoftSkill::where('show_in_cv', true)->ordered()->get();

        $pv = fn (string $key) => $lang === 'id'
            ? ($profiles[$key]->value_id ?? $profiles[$key]->value_en ?? '')
            : ($profiles[$key]->value_en ?? $profiles[$key]->value_id ?? '');

        $data = [
            'lang'       => $lang,
            'name'       => $pv('name') ?: $pv('full_name'),
            'title'      => $pv('title'),
            'email'      => $pv('email'),
            'phone'      => $pv('phone'),
            'location'   => $pv('location'),
            'bio'        => $pv('bio'),
            'github'     => $pv('github_url'),
            'linkedin'   => $pv('linkedin_url'),
            'website'    => $pv('website_url'),
            'educations' => $educations,
            'careers'    => $careers,
            'skillCategories' => $skillCategories,
            'projects' => $projects,
            'certificates' => $certificates,
            'organizations' => $organizations,
            'achievements' => $achievements,
            'softSkills' => $softSkills,
        ];

        $pdf = Pdf::loadView('cv.template', $data);
        $pdf->setPaper('a4', 'portrait');

        $filename = str_replace(' ', '_', $data['name'] ?: 'CV') . "_CV_{$lang}.pdf";

        return $pdf->download($filename);
    }
}
