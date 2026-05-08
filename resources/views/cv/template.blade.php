<!DOCTYPE html>
<html lang="{{ $lang }}">
<head>
    <meta charset="UTF-8">
    <title>{{ $name }} - CV</title>
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; }

        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.3;
            color: #222;
            padding: 35px 45px;
        }

        a { color: #222; text-decoration: none; }

        /* HEADER */
        .cv-header {
            text-align: center;
            border-bottom: 2px solid #222;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .cv-name {
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .cv-title {
            font-size: 9pt;
            font-style: italic;
            color: #555;
            margin-top: 1px;
            margin-bottom: 3px;
        }
        .cv-contacts {
            font-size: 8pt;
            color: #444;
        }
        .cv-contacts a { color: #1a4d8f; }
        .cv-sep { color: #aaa; margin: 0 3px; }

        /* SECTIONS */
        .cv-section { margin-bottom: 6px; }
        .cv-section-title {
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #333;
            padding-bottom: 1px;
            margin-bottom: 4px;
        }

        /* ENTRY BLOCK */
        .cv-entry { margin-bottom: 5px; page-break-inside: avoid; }
        .cv-entry-compact { margin-bottom: 3px; page-break-inside: avoid; }

        /* TWO-COLUMN ROW */
        .cv-row {
            width: 100%;
            border-collapse: collapse;
        }
        .cv-row td {
            vertical-align: top;
            padding: 0;
        }
        .cv-l {
            text-align: left;
            font-weight: bold;
            font-size: 9pt;
        }
        .cv-r {
            text-align: right;
            font-size: 8.5pt;
            width: 110px;
        }
        .cv-l2 {
            text-align: left;
            font-style: italic;
            font-size: 8.5pt;
            color: #444;
        }
        .cv-r2 {
            text-align: right;
            font-style: italic;
            font-size: 8.5pt;
            color: #444;
        }

        /* DESCRIPTION */
        .cv-desc { margin-top: 1px; }
        .cv-desc ul {
            list-style: disc;
            padding-left: 15px;
            margin: 0;
        }
        .cv-desc li {
            font-size: 8.5pt;
            line-height: 1.3;
            margin-bottom: 1px;
        }
        .cv-desc p {
            font-size: 8.5pt;
            margin-bottom: 1px;
        }

        /* SKILLS */
        .cv-skills {
            width: 100%;
            border-collapse: collapse;
        }
        .cv-skills td {
            vertical-align: top;
            padding: 2px 0;
            font-size: 8.5pt;
            line-height: 1.35;
        }
        .cv-sk-label {
            font-weight: bold;
            white-space: nowrap;
            padding-right: 0;
        }
        .cv-sk-colon {
            font-weight: bold;
            width: 10px;
            text-align: center;
            padding: 0 6px;
        }
        .cv-sk-value {
            color: #333;
            padding-left: 4px;
        }

        /* SUMMARY */
        .cv-summary {
            font-size: 8.5pt;
            line-height: 1.3;
            color: #333;
            text-align: justify;
        }

        /* INLINE LINK */
        .cv-link {
            font-weight: normal;
            font-size: 7.5pt;
            color: #1a4d8f;
            text-decoration: underline;
        }
    </style>
</head>
<body>

@php
    if (!function_exists('cvDesc')) {
        function cvDesc($text) {
            if (!$text) return '';
            $lines = explode("\n", str_replace("\r", "", $text));
            $html = '';
            $inList = false;
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                $isBullet = preg_match('/^[-•*]\s/', $line) || preg_match('/^\d+[\.\)]\s/', $line);
                if ($isBullet) {
                    if (!$inList) { $html .= '<ul>'; $inList = true; }
                    $clean = preg_replace('/^[-•*]\s*/', '', $line);
                    $clean = preg_replace('/^\d+[\.\)]\s*/', '', $clean);
                    $html .= '<li>' . htmlspecialchars($clean) . '</li>';
                } else {
                    if ($inList) { $html .= '</ul>'; $inList = false; }
                    $html .= '<p>' . htmlspecialchars($line) . '</p>';
                }
            }
            if ($inList) { $html .= '</ul>'; }
            return $html;
        }
    }
@endphp

{{-- HEADER --}}
<div class="cv-header">
    <div class="cv-name">{{ $name }}</div>
    @if($title)<div class="cv-title">{{ $title }}</div>@endif
    <div class="cv-contacts">
        @php
            $c = [];
            if ($location) $c[] = e($location);
            if ($phone)    $c[] = '<a href="tel:'.preg_replace('/[^0-9\+]/', '', $phone).'">'.e($phone).'</a>';
            if ($email)    $c[] = '<a href="mailto:'.e($email).'">'.e($email).'</a>';
            if ($linkedin) $c[] = '<a href="'.e($linkedin).'">'.e(rtrim(preg_replace('#^https?://(www\.)?#', '', $linkedin), '/')).'</a>';
            if ($github)   $c[] = '<a href="'.e($github).'">'.e(rtrim(preg_replace('#^https?://(www\.)?#', '', $github), '/')).'</a>';
            if ($website)  $c[] = '<a href="'.e($website).'">'.e(rtrim(preg_replace('#^https?://(www\.)?#', '', $website), '/')).'</a>';
        @endphp
        {!! implode(' <span class="cv-sep">&bull;</span> ', $c) !!}
    </div>
</div>

{{-- SUMMARY --}}
@if($bio)
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Ringkasan' : 'Summary' }}</div>
    <div class="cv-summary">{{ $bio }}</div>
</div>
@endif

{{-- SKILLS --}}
@if($skillCategories->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Keahlian' : 'Skills' }}</div>
    <table class="cv-skills">
    @foreach($skillCategories as $cat)
        @if($cat->skills->count())
        <tr>
            <td class="cv-sk-label">{{ $lang === 'id' ? ($cat->name_id ?: $cat->name_en) : ($cat->name_en ?: $cat->name_id) }}</td>
            <td class="cv-sk-colon">:</td>
            <td class="cv-sk-value">{{ $cat->skills->map(fn($s) => $lang === 'id' ? ($s->name_id ?: $s->name_en) : ($s->name_en ?: $s->name_id))->implode(', ') }}</td>
        </tr>
        @endif
    @endforeach
    </table>
</div>
@endif

{{-- EXPERIENCE --}}
@if($careers->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Pengalaman Profesional' : 'Professional Experience' }}</div>
    @foreach($careers as $career)
    <div class="cv-entry">
        <table class="cv-row"><tr>
            <td class="cv-l">{{ $career->company }}</td>
            <td class="cv-r">{{ \Carbon\Carbon::parse($career->start_date)->format('M Y') }} &ndash; {{ $career->end_date ? \Carbon\Carbon::parse($career->end_date)->format('M Y') : ($lang === 'id' ? 'Sekarang' : 'Present') }}</td>
        </tr><tr>
            <td class="cv-l2">{{ $lang === 'id' ? ($career->position_id ?: $career->position_en) : ($career->position_en ?: $career->position_id) }}</td>
            <td class="cv-r2"></td>
        </tr></table>
        @php $d = $lang === 'id' ? ($career->description_id ?: $career->description_en) : ($career->description_en ?: $career->description_id); @endphp
        @if($d)<div class="cv-desc">{!! cvDesc($d) !!}</div>@endif
    </div>
    @endforeach
</div>
@endif

{{-- PROJECTS --}}
@if($projects->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Proyek' : 'Projects' }}</div>
    @foreach($projects as $project)
    <div class="cv-entry">
        <table class="cv-row"><tr>
            <td class="cv-l">
                {{ $lang === 'id' ? ($project->title_id ?: $project->title_en) : ($project->title_en ?: $project->title_id) }}
                @if($project->demo_url)<a href="{{ $project->demo_url }}" class="cv-link">[Demo]</a>@endif
                @if($project->repo_url)<a href="{{ $project->repo_url }}" class="cv-link">[Code]</a>@endif
            </td>
            <td class="cv-r">@if($project->published_at){{ \Carbon\Carbon::parse($project->published_at)->format('M Y') }}@endif</td>
        </tr>
        @if($project->tech_stack && is_array($project->tech_stack))
        <tr>
            <td class="cv-l2">{{ implode(', ', $project->tech_stack) }}</td>
            <td class="cv-r2"></td>
        </tr>
        @endif
        </table>
        @php $d = $lang === 'id' ? ($project->excerpt_id ?: $project->excerpt_en) : ($project->excerpt_en ?: $project->excerpt_id); @endphp
        @if($d)<div class="cv-desc">{!! cvDesc($d) !!}</div>@endif
    </div>
    @endforeach
</div>
@endif

{{-- EDUCATION --}}
@if($educations->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Pendidikan' : 'Education' }}</div>
    @foreach($educations as $edu)
    <div class="cv-entry">
        <table class="cv-row"><tr>
            <td class="cv-l">{{ $edu->institution }}</td>
            <td class="cv-r">{{ \Carbon\Carbon::parse($edu->start_date)->format('M Y') }} &ndash; {{ $edu->end_date ? \Carbon\Carbon::parse($edu->end_date)->format('M Y') : ($lang === 'id' ? 'Sekarang' : 'Present') }}</td>
        </tr>
        @if($edu->degree || $edu->field || $edu->gpa)
        <tr>
            <td class="cv-l2">{{ $edu->degree }}{{ $edu->field ? ", {$edu->field}" : '' }}</td>
            <td class="cv-r2">@if($edu->gpa)GPA: {{ $edu->gpa }}@endif</td>
        </tr>
        @endif
        </table>
        @php $d = $lang === 'id' ? ($edu->description_id ?: $edu->description_en) : ($edu->description_en ?: $edu->description_id); @endphp
        @if($d)<div class="cv-desc">{!! cvDesc($d) !!}</div>@endif
    </div>
    @endforeach
</div>
@endif

{{-- CERTIFICATIONS --}}
@if($certificates->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Sertifikasi' : 'Certifications' }}</div>
    @foreach($certificates as $cert)
    <div class="cv-entry-compact">
        <table class="cv-row"><tr>
            <td class="cv-l">
                {{ $lang === 'id' ? ($cert->name_id ?: $cert->name_en) : ($cert->name_en ?: $cert->name_id) }}
                @if($cert->credential_url)<a href="{{ $cert->credential_url }}" class="cv-link">[Verify]</a>@endif
            </td>
            <td class="cv-r">{{ \Carbon\Carbon::parse($cert->issued_date)->format('M Y') }}</td>
        </tr><tr>
            <td class="cv-l2">{{ $cert->issuer }}</td>
            <td class="cv-r2"></td>
        </tr></table>
    </div>
    @endforeach
</div>
@endif

{{-- ORGANIZATIONS --}}
@if($organizations->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Kepemimpinan & Organisasi' : 'Leadership & Activities' }}</div>
    @foreach($organizations as $org)
    <div class="cv-entry">
        <table class="cv-row"><tr>
            <td class="cv-l">{{ $lang === 'id' ? ($org->name ?: $org->name_en) : ($org->name_en ?: $org->name) }}</td>
            <td class="cv-r">{{ \Carbon\Carbon::parse($org->start_date)->format('M Y') }} &ndash; {{ $org->end_date ? \Carbon\Carbon::parse($org->end_date)->format('M Y') : ($lang === 'id' ? 'Sekarang' : 'Present') }}</td>
        </tr><tr>
            <td class="cv-l2">{{ $lang === 'id' ? ($org->role ?: $org->role_en) : ($org->role_en ?: $org->role) }}</td>
            <td class="cv-r2"></td>
        </tr></table>
        @php $d = $lang === 'id' ? ($org->description_id ?: $org->description_en) : ($org->description_en ?: $org->description_id); @endphp
        @if($d)<div class="cv-desc">{!! cvDesc($d) !!}</div>@endif
    </div>
    @endforeach
</div>
@endif

{{-- AWARDS --}}
@if($achievements->count())
<div class="cv-section">
    <div class="cv-section-title">{{ $lang === 'id' ? 'Penghargaan' : 'Awards & Honors' }}</div>
    @foreach($achievements as $ach)
    <div class="cv-entry-compact">
        <table class="cv-row"><tr>
            <td class="cv-l">{{ $lang === 'id' ? ($ach->title_id ?: $ach->title_en) : ($ach->title_en ?: $ach->title_id) }}</td>
            <td class="cv-r">@if($ach->date){{ \Carbon\Carbon::parse($ach->date)->format('M Y') }}@endif</td>
        </tr></table>
        @php $d = $lang === 'id' ? ($ach->description_id ?: $ach->description_en) : ($ach->description_en ?: $ach->description_id); @endphp
        @if($d)<div class="cv-desc">{!! cvDesc($d) !!}</div>@endif
    </div>
    @endforeach
</div>
@endif

</body>
</html>
