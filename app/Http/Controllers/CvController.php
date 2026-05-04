<?php

namespace App\Http\Controllers;

use App\Models\Career;
use App\Models\Education;
use App\Models\Profile;
use App\Models\Skill;
use App\Models\SkillCategory;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class CvController extends Controller
{
    public function download(string $lang): Response
    {
        $profiles  = Profile::ordered()->get()->keyBy('key');
        $educations = Education::ordered()->get();
        $careers   = Career::with('children')->roots()->chronological()->get();
        $skillCategories = SkillCategory::withOrderedSkills()->ordered()->get();

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
            'educations' => $educations,
            'careers'    => $careers,
            'skillCategories' => $skillCategories,
        ];

        $pdf = Pdf::loadView('cv.template', $data);
        $pdf->setPaper('a4', 'portrait');

        $filename = str_replace(' ', '_', $data['name'] ?: 'CV') . "_CV_{$lang}.pdf";

        return $pdf->download($filename);
    }
}
