<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>{{ $name }} — CV</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    @php
        $font_family = $style_settings['font_family'] ?? 'Arial';
        $font_size = $style_settings['font_size'] ?? '9pt';
        $line_height = $style_settings['line_height'] ?? '1.3';
        $theme_color = $style_settings['theme_color'] ?? '#222222';
        $section_spacing = $style_settings['section_spacing'] ?? '10pt';
        $entry_spacing = $style_settings['entry_spacing'] ?? '5px';
        $bullet_spacing = $style_settings['bullet_spacing'] ?? '2px';
        $margin_top = $style_settings['margin_top'] ?? '0.4in';
        $margin_bottom = $style_settings['margin_bottom'] ?? '0.4in';
        $margin_left = $style_settings['margin_left'] ?? '0.5in';
        $margin_right = $style_settings['margin_right'] ?? '0.5in';

        $font_size_val = floatval($font_size);
        $font_size_unit = preg_replace('/[0-9\.]/', '', $font_size) ?: 'pt';
        $line_height_val = floatval($line_height);

        $fmt = function($val) {
            return rtrim(rtrim(number_format($val, 4, '.', ''), '0'), '.');
        };
    @endphp
    <style>
        /* ── MS Word Page & Margin Setup ── */
        @page Section1 {
            size: 595.3pt 841.9pt; /* A4 dimensions */
            margin: {{ $margin_top }} {{ $margin_right }} {{ $margin_bottom }} {{ $margin_left }};
            mso-header-margin: 0in;
            mso-footer-margin: 0in;
            mso-paper-source: 0;
        }
        
        div.Section1 {
            page: Section1;
        }

        /* ── Base Styling ── */
        body {
            font-family: "{{ $font_family }}", Arial, Helvetica, sans-serif;
            font-size: {{ $font_size }};
            line-height: {{ $line_height }};
            color: #222222;
        }

        /* ── CSS Margin Resets for MS Word Compatibility ── */
        h1, h2, h3, h4, h5, h6 {
            margin: 0;
            padding: 0;
        }

        p {
            margin: 0;
            padding: 0;
            margin-bottom: 2pt;
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: 2pt;
            line-height: {{ $line_height }};
        }

        /* ── Header / Contact ── */
        .cv-name {
            font-size: {{ $fmt($font_size_val * 1.7) }}{{ $font_size_unit }};
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin: 0;
            margin-bottom: 2pt;
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: 2pt;
            color: #111111;
        }

        .cv-contact {
            text-align: center;
            font-size: {{ $fmt($font_size_val * 0.88) }}{{ $font_size_unit }};
            color: #444444;
            margin: 0;
            margin-bottom: 6px;
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: 6pt;
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
            margin: 0;
            margin-top: {{ $section_spacing }};
            margin-bottom: 4pt;
            mso-margin-top-alt: {{ $section_spacing }};
            mso-margin-bottom-alt: 4pt;
            color: {{ $theme_color }};
        }

        /* ── Professional Summary ── */
        .cv-summary {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            line-height: {{ $fmt($line_height_val + 0.05) }};
            margin: 0;
            margin-bottom: 6px;
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: 6pt;
            text-align: justify;
            color: #333333;
        }

        /* ── Entry (Experience, Education, etc.) ── */
        .cv-entry-title {
            font-size: {{ $font_size }};
            font-weight: bold;
            color: #111111;
        }

        .cv-entry-date {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            color: #444444;
            white-space: nowrap;
            font-weight: bold;
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
            font-style: italic;
        }

        /* ── Skills Section ── */
        .cv-skills-row {
            font-size: {{ $fmt($font_size_val * 0.94) }}{{ $font_size_unit }};
            margin: 0;
            margin-bottom: {{ $bullet_spacing }};
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: {{ $bullet_spacing }};
            line-height: {{ $line_height }};
            color: #333333;
        }

        .cv-skills-category {
            font-weight: bold;
            color: #111111;
        }

        /* ── Table alignment overrides for MS Word ── */
        table.cv-flex-row {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            padding: 0;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            mso-table-tspace: 0pt;
            mso-table-bspace: 0pt;
            margin-bottom: 2pt;
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
    </style>
</head>
<body>
    <div class="Section1">
        {{-- ── Name ── --}}
        <h1 class="cv-name">{{ $name }}</h1>
        @if(!empty($title))
            <div style="font-size: 9pt; font-style: italic; text-align: center; color: #555555; margin-top: -1px; margin-bottom: 3px; font-weight: normal; letter-spacing: 0.5px;">{{ $title }}</div>
        @endif

        {{-- ── Contact Line ── --}}
        <p class="cv-contact">
            @php
                $parts = [];
                if (!empty($location)) $parts[] = e($location);
                if (!empty($phone)) {
                    $waNumber = preg_replace('/[\s\-\(\)]+/', '', $phone);
                    if (str_starts_with($waNumber, '+')) {
                        $waNumber = substr($waNumber, 1);
                    }
                    $parts[] = "<a href='https://wa.me/" . e($waNumber) . "'>" . e($phone) . "</a>";
                }
                if (!empty($email)) $parts[] = "<a href='mailto:{$email}'>{$email}</a>";
                if (!empty($linkedin)) {
                    $cleanLinkedin = rtrim(preg_replace('#^https?://(www\.)?#', '', $linkedin), '/');
                    $linkedinUrl = $linkedin;
                    if (!preg_match('#^https?://#', $linkedinUrl)) {
                        $linkedinUrl = 'https://' . $linkedinUrl;
                    }
                    $parts[] = "<a href='" . e($linkedinUrl) . "'>" . e($cleanLinkedin) . "</a>";
                }
                if (!empty($github)) {
                    $cleanGithub = rtrim(preg_replace('#^https?://(www\.)?#', '', $github), '/');
                    $githubUrl = $github;
                    if (!preg_match('#^https?://#', $githubUrl)) {
                        $githubUrl = 'https://' . $githubUrl;
                    }
                    $parts[] = "<a href='" . e($githubUrl) . "'>" . e($cleanGithub) . "</a>";
                }
                if (!empty($website)) {
                    $webUrl = $website;
                    if (!preg_match('#^https?://#', $webUrl)) {
                        $webUrl = 'https://' . $webUrl;
                    }
                    $cleanWeb = rtrim(preg_replace('#^https?://(www\.)?#', '', $webUrl), '/');
                    $parts[] = "<a href='" . e($webUrl) . "'>" . e($cleanWeb) . "</a>";
                }
            @endphp
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
                            </table>
                        @endif
                    @endforeach
                @else
                    {{-- Standard entries wrapped in one single table per section --}}
                    <table width="100%" class="cv-flex-row" cellspacing="0" cellpadding="0">
                        @foreach($section['items'] as $item)
                            @php
                                $dateFromSubtitle = '';
                                $subtitleClean = $item['subtitle'] ?? '';
                                if (preg_match('/(?:—|–|-)\s*(.+)$/', $subtitleClean, $dateMatch)) {
                                    $dateFromSubtitle = trim($dateMatch[1]);
                                    $subtitleClean = trim(preg_replace('/\s*(?:—|–|-)\s*.+$/', '', $subtitleClean));
                                }
                                $parsedTitle = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2">$1</a>', e($item['title']));
                                $parsedSubtitle = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2">$1</a>', e($subtitleClean));
                            @endphp
                            
                            <!-- Row 1: Title & Date -->
                            <tr>
                                <td class="cv-left" width="70%" style="width: 70%; padding-top: {{ $loop->first ? '4px' : '10px' }};">
                                    <span class="cv-entry-title">{!! $parsedTitle !!}</span>
                                    @if(empty($subtitleClean) && !empty($item['metadata']['gpa']))
                                        <span style="font-weight: normal; color: #444444;"> &bull; GPA: {{ $item['metadata']['gpa'] }}</span>
                                    @endif
                                </td>
                                <td class="cv-right" width="30%" style="width: 30%; text-align: right; padding-top: {{ $loop->first ? '4px' : '10px' }};">
                                    @if($dateFromSubtitle)
                                        <span class="cv-entry-date">{{ $dateFromSubtitle }}</span>
                                    @endif
                                </td>
                            </tr>

                            <!-- Row 2: Subtitle & Location -->
                            @if(!empty($subtitleClean) || !empty($item['location']))
                                <tr>
                                    <td class="cv-left" width="70%" style="width: 70%; font-size: 8.5pt;">
                                        @if(!empty($subtitleClean))
                                            <span class="cv-entry-subtitle">{!! $parsedSubtitle !!}</span>
                                            @if(!empty($item['metadata']['gpa']))
                                                <span style="font-weight: normal; color: #444444;"> &bull; GPA: {{ $item['metadata']['gpa'] }}</span>
                                            @endif
                                        @endif
                                    </td>
                                    <td class="cv-right" width="30%" style="width: 30%; text-align: right; font-size: 8.5pt;">
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
                                        @foreach($item['bullets'] as $bullet)
                                            @if(trim($bullet))
                                                <p class="cv-bullet-p" style="margin: 0; margin-left: 11pt; text-indent: -11pt; padding: 0; margin-bottom: 2pt; text-align: justify; font-size: 8.5pt; line-height: 1.35; color: #333333; font-family: Arial, sans-serif; mso-margin-top-alt: 0pt; mso-margin-bottom-alt: 2pt;">
                                                    <span style="font-family: Arial, sans-serif; font-size: 8.5pt; color: #222222; margin-right: 4pt;">&#8226;</span>{!! preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2">$1</a>', e($bullet)) !!}
                                                </p>
                                            @endif
                                        @endforeach
                                    </td>
                                </tr>
                            @endif

                            {{-- Metadata Rendering --}}
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
                                                <p style="font-size: 8.5pt; color: #444444; margin: 1px 0; margin-bottom: 2pt; mso-margin-bottom-alt: 2pt;">
                                                    Technologies: {{ implode(', ', $meta['tech_stack']) }}
                                                </p>
                                            @endif
                                            @if(!empty($issuer) && !$isDuplicated)
                                                <p style="font-size: 8.5pt; color: #444444; margin: 1px 0; margin-bottom: 2pt; mso-margin-bottom-alt: 2pt;">
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
                                                <p style="font-size: 8.5pt; color: #444444; margin: 1px 0; margin-bottom: 2pt; mso-margin-bottom-alt: 2pt;">
                                                    Credential URL: <a href="{{ $meta['credential_url'] }}">{{ $displayUrl }}</a>
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
    </div>
</body>
</html>
