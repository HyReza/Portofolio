<!DOCTYPE html>
<html lang="{{ $lang }}">
<head>
    <meta charset="UTF-8">
    <title>{{ $name }} - CV</title>
    <style>
        /* ATS-Friendly: No tables for layout, no images, clean text hierarchy */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a1a1a;
            padding: 40px 50px;
        }

        /* Header */
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; }
        .header h1 { font-size: 22pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        .header h2 { font-size: 11pt; font-weight: 400; color: #444; margin-bottom: 8px; }
        .contact-row { font-size: 9pt; color: #333; }
        .contact-row span { margin: 0 8px; }

        /* Section */
        .section { margin-top: 18px; }
        .section-title {
            font-size: 11pt; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1.5px; border-bottom: 1px solid #ccc;
            padding-bottom: 3px; margin-bottom: 10px; color: #1a1a1a;
        }

        /* Entries */
        .entry { margin-bottom: 12px; }
        .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
        .entry-title { font-weight: 700; font-size: 10.5pt; }
        .entry-subtitle { font-size: 9.5pt; color: #444; font-style: italic; }
        .entry-date { font-size: 9pt; color: #666; text-align: right; white-space: nowrap; }
        .entry-desc { font-size: 9.5pt; color: #333; margin-top: 3px; }

        /* Skills */
        .skills-grid { display: flex; flex-wrap: wrap; gap: 4px 0; }
        .skill-category { margin-bottom: 6px; }
        .skill-category-name { font-weight: 700; font-size: 9.5pt; }
        .skill-list { font-size: 9.5pt; color: #333; }

        /* Bio */
        .bio { font-size: 9.5pt; color: #333; margin-bottom: 5px; }
    </style>
</head>
<body>
    {{-- HEADER --}}
    <div class="header">
        <h1>{{ $name }}</h1>
        @if($title)
            <h2>{{ $title }}</h2>
        @endif
        <div class="contact-row">
            @if($email)<span>{{ $email }}</span>@endif
            @if($phone)<span>| {{ $phone }}</span>@endif
            @if($location)<span>| {{ $location }}</span>@endif
            @if($linkedin)<span>| LinkedIn: {{ $linkedin }}</span>@endif
            @if($github)<span>| GitHub: {{ $github }}</span>@endif
        </div>
    </div>

    {{-- SUMMARY --}}
    @if($bio)
    <div class="section">
        <div class="section-title">{{ $lang === 'id' ? 'Ringkasan Profesional' : 'Professional Summary' }}</div>
        <p class="bio">{{ $bio }}</p>
    </div>
    @endif

    {{-- WORK EXPERIENCE --}}
    @if($careers->count())
    <div class="section">
        <div class="section-title">{{ $lang === 'id' ? 'Pengalaman Kerja' : 'Work Experience' }}</div>
        @foreach($careers as $career)
        <div class="entry">
            <div class="entry-header">
                <div>
                    <span class="entry-title">{{ $lang === 'id' ? ($career->position_id ?: $career->position_en) : ($career->position_en ?: $career->position_id) }}</span>
                    <span class="entry-subtitle"> — {{ $career->company }}</span>
                </div>
                <span class="entry-date">
                    {{ \Carbon\Carbon::parse($career->start_date)->format('M Y') }} —
                    {{ $career->end_date ? \Carbon\Carbon::parse($career->end_date)->format('M Y') : ($lang === 'id' ? 'Sekarang' : 'Present') }}
                </span>
            </div>
            @php $desc = $lang === 'id' ? ($career->description_id ?: $career->description_en) : ($career->description_en ?: $career->description_id); @endphp
            @if($desc)
                <p class="entry-desc">{{ $desc }}</p>
            @endif
        </div>
        @endforeach
    </div>
    @endif

    {{-- EDUCATION --}}
    @if($educations->count())
    <div class="section">
        <div class="section-title">{{ $lang === 'id' ? 'Pendidikan' : 'Education' }}</div>
        @foreach($educations as $edu)
        <div class="entry">
            <div class="entry-header">
                <div>
                    <span class="entry-title">{{ $edu->institution }}</span>
                    @if($edu->degree || $edu->field)
                        <span class="entry-subtitle"> — {{ $edu->degree }}{{ $edu->field ? ", {$edu->field}" : '' }}</span>
                    @endif
                </div>
                <span class="entry-date">
                    {{ \Carbon\Carbon::parse($edu->start_date)->format('M Y') }} —
                    {{ $edu->end_date ? \Carbon\Carbon::parse($edu->end_date)->format('M Y') : ($lang === 'id' ? 'Sekarang' : 'Present') }}
                </span>
            </div>
        </div>
        @endforeach
    </div>
    @endif

    {{-- SKILLS --}}
    @if($skillCategories->count())
    <div class="section">
        <div class="section-title">{{ $lang === 'id' ? 'Keahlian' : 'Skills' }}</div>
        @foreach($skillCategories as $cat)
            @if($cat->skills->count())
            <div class="skill-category">
                <span class="skill-category-name">{{ $lang === 'id' ? ($cat->name_id ?: $cat->name_en) : ($cat->name_en ?: $cat->name_id) }}:</span>
                <span class="skill-list">
                    {{ $cat->skills->map(fn($s) => $lang === 'id' ? ($s->name_id ?: $s->name_en) : ($s->name_en ?: $s->name_id))->implode(', ') }}
                </span>
            </div>
            @endif
        @endforeach
    </div>
    @endif
</body>
</html>
