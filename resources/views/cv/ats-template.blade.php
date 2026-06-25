<!DOCTYPE html>
<html lang="{{ $language ?? 'en' }}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $name }} — CV</title>
    @php
        $font_family = $style_settings['font_family'] ?? 'Arial';
        $font_size = $style_settings['font_size'] ?? '9pt';
        $line_height = $style_settings['line_height'] ?? '1.3';
        $theme_color = $style_settings['theme_color'] ?? '#222222';
        $section_spacing = $style_settings['section_spacing'] ?? '8px';
        $entry_spacing = $style_settings['entry_spacing'] ?? '5px';
        $bullet_spacing = $style_settings['bullet_spacing'] ?? '1.5px';
        $margin_top = $style_settings['margin_top'] ?? '35px';
        $margin_bottom = $style_settings['margin_bottom'] ?? '35px';
        $margin_left = $style_settings['margin_left'] ?? '45px';
        $margin_right = $style_settings['margin_right'] ?? '45px';

        // Parse numeric values and units for safe PDF rendering without calc()
        $font_size_val = floatval($font_size);
        $font_size_unit = preg_replace('/[0-9\.]/', '', $font_size) ?: 'pt';
        $line_height_val = floatval($line_height);

        // Helper to format float values with dot decimal separator
        $fmt = function($val) {
            return rtrim(rtrim(number_format($val, 4, '.', ''), '0'), '.');
        };
    @endphp
    <style>
        /* ── ATS-Compliant Base Styles ── */
        @page {
            margin: 0;
            size: A4 portrait;
        }

        * {
            margin: 0;
            padding: 0;
        }

        body {
            font-family: "{{ $font_family }}", Arial, Helvetica, sans-serif;
            font-size: {{ $font_size }};
            line-height: {{ $line_height }};
            color: #222222;
            -webkit-font-smoothing: antialiased;
            padding: {{ $margin_top }} {{ $margin_right }} {{ $margin_bottom }} {{ $margin_left }};
        }

        /* ── Header / Contact ── */
        .cv-name {
            font-size: {{ $fmt($font_size_val * 1.7) }}{{ $font_size_unit }};
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 2px;
            color: #111111;
        }

        .cv-contact {
            text-align: center;
            font-size: {{ $fmt($font_size_val * 0.88) }}{{ $font_size_unit }};
            color: #444444;
            margin-bottom: 6px;
            line-height: 1.3;
        }

        .cv-contact-separator {
            margin: 0 4px;
            color: #aaaaaa;
        }

        /* ── Section Headings ── */
        .cv-section-heading {
            font-size: {{ $fmt($font_size_val + 0.5) }}{{ $font_size_unit }};
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid {{ $theme_color }};
            padding-bottom: 1px;
            margin-top: {{ $section_spacing }};
            margin-bottom: 5px;
            color: {{ $theme_color }};
        }

        /* ── Professional Summary ── */
        .cv-summary {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            line-height: {{ $fmt($line_height_val + 0.05) }}em;
            margin-bottom: 5px;
            text-align: justify;
            color: #333333;
        }

        /* ── Entry (Experience, Education, etc.) ── */
        .cv-entry {
            margin-bottom: {{ $entry_spacing }};
            page-break-inside: avoid;
        }

        .cv-entry-title {
            font-size: {{ $font_size }};
            font-weight: bold;
            color: #111111;
        }

        .cv-entry-date {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            color: #444444;
            white-space: nowrap;
        }

        .cv-entry-subtitle {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            font-style: italic;
            color: #444444;
        }

        .cv-entry-location {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            color: #444444;
            white-space: nowrap;
        }

        /* ── Bullet Points ── */
        .cv-bullets {
            list-style-type: disc;
            padding-left: 14px;
            margin-top: 1px;
            margin-bottom: 1px;
        }

        .cv-bullets li {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            line-height: {{ $fmt($line_height_val) }}em;
            margin-bottom: {{ $bullet_spacing }};
            text-align: justify;
            color: #333333;
        }

        /* ── Skills Section ── */
        .cv-skills-row {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            margin-bottom: {{ $bullet_spacing }};
            line-height: {{ $fmt($line_height_val) }}em;
            color: #333333;
        }

        .cv-skills-category {
            font-weight: bold;
            color: #111111;
        }

        /* ── Utility ── */
        .cv-separator {
            border: none;
            border-top: 0.5pt solid #cccccc;
            margin: 4px 0;
        }

        .cv-page-break {
            page-break-before: always;
        }

        /* ── Override for DomPDF table workaround (header alignment) ── */
        .cv-flex-row {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }

        .cv-flex-row td {
            vertical-align: top;
            padding: 0;
        }

        .cv-flex-row .cv-left {
            text-align: left;
        }

        .cv-flex-row .cv-right {
            text-align: right;
            white-space: nowrap;
        }

        /* ── Links ── */
        a {
            color: #1a4d8f;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    {{-- ── Name ── --}}
    <h1 class="cv-name">{{ $name }}</h1>
    @if(!empty($title))
        <div style="font-size: 9pt; font-style: italic; text-align: center; color: #555555; margin-top: -1px; margin-bottom: 3px; font-weight: normal; letter-spacing: 0.5px;">{{ $title }}</div>
    @endif

    {{-- ── Contact Line ── --}}
    <p class="cv-contact">
        @php
            $parts = [];
            if (!empty($location)) {
                $parts[] = e($location);
            }
            if (!empty($phone)) {
                // Format phone for wa.me: strip spaces, dashes, and leading + for URL
                $waNumber = preg_replace('/[\s\-\(\)]+/', '', $phone);
                if (str_starts_with($waNumber, '+')) {
                    $waNumber = substr($waNumber, 1);
                }
                $parts[] = '<a href="https://wa.me/' . e($waNumber) . '">' . e($phone) . '</a>';
            }
            if (!empty($email)) {
                $parts[] = '<a href="mailto:' . e($email) . '">' . e($email) . '</a>';
            }
            if (!empty($linkedin)) {
                $cleanLinkedin = rtrim(preg_replace('#^https?://(www\.)?#', '', $linkedin), '/');
                $linkedinUrl = $linkedin;
                if (!preg_match('#^https?://#', $linkedinUrl)) {
                    $linkedinUrl = 'https://' . $linkedinUrl;
                }
                $parts[] = '<a href="' . e($linkedinUrl) . '">' . e($cleanLinkedin) . '</a>';
            }
            if (!empty($github)) {
                $cleanGithub = rtrim(preg_replace('#^https?://(www\.)?#', '', $github), '/');
                $githubUrl = $github;
                if (!preg_match('#^https?://#', $githubUrl)) {
                    $githubUrl = 'https://' . $githubUrl;
                }
                $parts[] = '<a href="' . e($githubUrl) . '">' . e($cleanGithub) . '</a>';
            }
            if (!empty($website)) {
                $webUrl = $website;
                if (!preg_match('#^https?://#', $webUrl)) {
                    $webUrl = 'https://' . $webUrl;
                }
                $cleanWeb = rtrim(preg_replace('#^https?://(www\.)?#', '', $webUrl), '/');
                $parts[] = '<a href="' . e($webUrl) . '">' . e($cleanWeb) . '</a>';
            }
        @endphp
        {!! implode(' <span class="cv-contact-separator"> &bull; </span> ', $parts) !!}
    </p>

    {{-- ── Professional Summary ── --}}
    @if(!empty($summary))
        <h2 class="cv-section-heading">
            {{ !empty($summary_title) ? strtoupper($summary_title) : ($language === 'id' ? 'RINGKASAN PROFESIONAL' : 'PROFESSIONAL SUMMARY') }}
        </h2>
        @foreach(explode("\n", $summary) as $paragraph)
            @if(trim($paragraph))
                <p class="cv-summary">{{ trim($paragraph) }}</p>
            @endif
        @endforeach
    @endif

    {{-- ── Dynamic Sections ── --}}
    @foreach($sections as $section)
        @if(count($section['items']) > 0)
            <h2 class="cv-section-heading">{{ strtoupper($section['title']) }}</h2>

        @if(in_array($section['type'], ['skills', 'soft_skills']))
            {{-- Skills rendered as category rows --}}
            @foreach($section['items'] as $item)
                <p class="cv-skills-row">
                    @if(!empty($item['title']))
                        <span class="cv-skills-category">{{ $item['title'] }}:</span>
                    @endif
                    @if(!empty($item['subtitle']))
                        {{ $item['subtitle'] }}
                    @elseif(!empty($item['bullets']))
                        {{ implode(', ', $item['bullets']) }}
                    @elseif(!empty($item['metadata']['tech_stack']) && is_array($item['metadata']['tech_stack']))
                        @php
                            $techStackList = array_map(function($s) {
                                return is_array($s) ? ($s['name'] ?? '') : (is_object($s) ? ($s->name ?? '') : (string)$s);
                            }, $item['metadata']['tech_stack']);
                            $techStackList = array_filter(array_map('trim', $techStackList));
                        @endphp
                        {{ implode(', ', $techStackList) }}
                    @elseif(!empty($item['metadata']['skills']) && is_array($item['metadata']['skills']))
                        @php
                            $skillsList = array_map(function($s) {
                                return is_array($s) ? ($s['name'] ?? '') : (is_object($s) ? ($s->name ?? '') : (string)$s);
                            }, $item['metadata']['skills']);
                            $skillsList = array_filter(array_map('trim', $skillsList));
                        @endphp
                        {{ implode(', ', $skillsList) }}
                    @endif
                </p>
            @endforeach
        @else
            {{-- Standard entries (Experience, Education, Projects, etc.) --}}
            <table width="100%" class="cv-flex-row" cellspacing="0" cellpadding="0">
                @foreach($section['items'] as $item)
                    @php
                        // Extract date from subtitle if it contains a dash/em-dash pattern
                        $dateFromSubtitle = '';
                        $subtitleClean = $item['subtitle'] ?? '';
                        if (preg_match('/(?:—|–|-)\s*(.+)$/', $subtitleClean, $dateMatch)) {
                            $dateFromSubtitle = trim($dateMatch[1]);
                            $subtitleClean = trim(preg_replace('/\s*(?:—|–|-)\s*.+$/', '', $subtitleClean));
                        }
                        // Parse markdown links [text](url) into HTML anchors
                        $parsedTitle = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" target="_blank">$1</a>', e($item['title']));
                        $parsedSubtitle = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" target="_blank">$1</a>', e($subtitleClean));
                    @endphp

                    <!-- Row 1: Title & Date -->
                    <tr>
                        <td class="cv-left" style="width: 70%; padding-top: 4px;">
                            <span class="cv-entry-title">{!! $parsedTitle !!}</span>
                            @if(empty($subtitleClean) && !empty($item['metadata']['gpa']))
                                <span style="font-weight: normal; color: #444444;"> &bull; GPA: {{ $item['metadata']['gpa'] }}</span>
                            @endif
                        </td>
                        <td class="cv-right" style="width: 30%; text-align: right; padding-top: 4px;">
                            @if($dateFromSubtitle)
                                <span class="cv-entry-date">{{ $dateFromSubtitle }}</span>
                            @endif
                        </td>
                    </tr>

                    <!-- Row 2: Subtitle & Location -->
                    @if(!empty($subtitleClean) || !empty($item['location']))
                        <tr>
                            <td class="cv-left" style="width: 70%; font-size: 8.5pt;">
                                @if(!empty($subtitleClean))
                                    <span class="cv-entry-subtitle">{!! $parsedSubtitle !!}</span>
                                    @if(!empty($item['metadata']['gpa']))
                                        <span style="font-weight: normal; color: #444444;"> &bull; GPA: {{ $item['metadata']['gpa'] }}</span>
                                    @endif
                                @endif
                            </td>
                            <td class="cv-right" style="width: 30%; text-align: right; font-size: 8.5pt;">
                                @if(!empty($item['location']))
                                    <span class="cv-entry-location">{{ $item['location'] }}</span>
                                    @endif
                            </td>
                        </tr>
                    @endif

                    <!-- Row 3: Bullets -->
                    @if(!empty($item['bullets']))
                        <tr>
                            <td colspan="2" style="padding-top: 2px; padding-bottom: 4px;">
                                <ul class="cv-bullets">
                                    @foreach($item['bullets'] as $bullet)
                                        @if(trim($bullet))
                                            @php
                                                $parsedBullet = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" target="_blank">$1</a>', e($bullet));
                                            @endphp
                                            <li>{!! $parsedBullet !!}</li>
                                        @endif
                                    @endforeach
                                </ul>
                            </td>
                        </tr>
                    @endif

                    {{-- Metadata rendering --}}
                    @if(!empty($item['metadata']))
                        @php 
                            $meta = $item['metadata']; 
                            $issuer = $meta['issuer'] ?? '';
                            $cleanIssuer = strtolower(trim(preg_replace('/\s+/', ' ', $issuer)));
                            $cleanSubtitle = strtolower(trim(preg_replace('/\s+/', ' ', $subtitleClean)));
                            $isDuplicated = !empty($cleanIssuer) && !empty($cleanSubtitle) && 
                                            (str_contains($cleanSubtitle, $cleanIssuer) || str_contains($cleanIssuer, $cleanSubtitle));
                            
                            $hasMeta = (!empty($meta['tech_stack']) && is_array($meta['tech_stack'])) ||
                                       (!empty($issuer) && !$isDuplicated) ||
                                       (!empty($meta['credential_url']));
                        @endphp
                        @if($hasMeta)
                            <tr>
                                <td colspan="2" style="padding-bottom: 4px;">
                                    @if(!empty($meta['tech_stack']) && is_array($meta['tech_stack']))
                                        <p style="font-size: 8.5pt; color: #444444; margin: 1px 0;">
                                            Technologies: {{ implode(', ', $meta['tech_stack']) }}
                                        </p>
                                    @endif
                                    
                                    @if(!empty($issuer) && !$isDuplicated)
                                        <p style="font-size: 8.5pt; color: #444444; margin: 1px 0;">
                                            Issued by: {{ $issuer }}
                                        </p>
                                    @endif
                                    
                                    @if(!empty($meta['credential_url']))
                                        @php
                                            $displayUrl = preg_replace('#^https?://(www\.)?#', '', $meta['credential_url']);
                                            if (strlen($displayUrl) > 50) {
                                                $displayUrl = substr($displayUrl, 0, 47) . '...';
                                            }
                                        @endphp
                                        <p style="font-size: 8.5pt; color: #444444; margin: 1px 0;">
                                            Credential URL: <a href="{{ $meta['credential_url'] }}" target="_blank">{{ $displayUrl }}</a>
                                        </p>
                                    @endif
                                </td>
                            </tr>
                        @endif
                    @endif
                @endforeach
            </table>
        @endif
    @endif
    @endforeach
</body>
</html>
