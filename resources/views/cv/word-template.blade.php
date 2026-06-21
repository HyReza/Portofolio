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
    <style>
        /* ── MS Word Page & Margin Setup ── */
        @page Section1 {
            size: 595.3pt 841.9pt; /* A4 dimensions */
            margin: 0.4in 0.5in 0.4in 0.5in;
            mso-header-margin: 0in;
            mso-footer-margin: 0in;
            mso-paper-source: 0;
        }
        
        div.Section1 {
            page: Section1;
        }

        /* ── Base Styling ── */
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            line-height: 1.35;
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
            line-height: 1.35;
        }

        /* ── Header / Contact ── */
        .cv-name {
            font-size: 16pt;
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
            font-size: 8pt;
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
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #222222;
            padding-bottom: 1px;
            margin: 0;
            margin-top: 10pt;
            margin-bottom: 4pt;
            mso-margin-top-alt: 10pt;
            mso-margin-bottom-alt: 4pt;
            color: #111111;
        }

        /* ── Professional Summary ── */
        .cv-summary {
            font-size: 8.5pt;
            line-height: 1.35;
            margin: 0;
            margin-bottom: 6px;
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: 6pt;
            text-align: justify;
            color: #333333;
        }

        /* ── Entry (Experience, Education, etc.) ── */
        .cv-entry-title {
            font-size: 9pt;
            font-weight: bold;
            color: #111111;
        }

        .cv-entry-date {
            font-size: 8.5pt;
            color: #444444;
            white-space: nowrap;
            font-weight: bold;
        }

        .cv-entry-subtitle {
            font-size: 8.5pt;
            font-style: italic;
            color: #444444;
        }

        .cv-entry-location {
            font-size: 8.5pt;
            color: #444444;
            white-space: nowrap;
            font-style: italic;
        }

        /* ── Skills Section ── */
        .cv-skills-row {
            font-size: 8.5pt;
            margin: 0;
            margin-bottom: 2px;
            mso-margin-top-alt: 0pt;
            mso-margin-bottom-alt: 2pt;
            line-height: 1.3;
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
                if (!empty($phone)) $parts[] = e($phone);
                if (!empty($email)) $parts[] = "<a href='mailto:{$email}'>{$email}</a>";
                if (!empty($linkedin)) {
                    $cleanLinkedin = rtrim(preg_replace('#^https?://(www\.)?#', '', $linkedin), '/');
                    $parts[] = "<a href='{$linkedin}'>{$cleanLinkedin}</a>";
                }
                if (!empty($github)) {
                    $cleanGithub = rtrim(preg_replace('#^https?://(www\.)?#', '', $github), '/');
                    $parts[] = "<a href='{$github}'>{$cleanGithub}</a>";
                }
                
                // Enforce portfolio URL
                $webUrl = 'https://www.rezaedisaputra.com/';
                if (!empty($website)) {
                    $webUrl = $website;
                    if (!preg_match('#^https?://#', $webUrl)) {
                        $webUrl = 'https://' . $webUrl;
                    }
                }
                if (str_contains($webUrl, 'rezaedisaputra.com')) {
                    $webUrl = 'https://www.rezaedisaputra.com/';
                }
                $parts[] = "<a href='{$webUrl}'>{$webUrl}</a>";
            @endphp
            {!! implode(' <span class="cv-contact-separator"> &bull; </span> ', $parts) !!}
        </p>

        {{-- ── Professional Summary ── --}}
        @if(!empty($summary))
            <h2 class="cv-section-heading">
                {{ $language === 'id' ? 'RINGKASAN PROFESIONAL' : 'PROFESSIONAL SUMMARY' }}
            </h2>
            <p class="cv-summary">{{ $summary }}</p>
        @endif

        {{-- ── Dynamic Sections ── --}}
        @foreach($sections as $section)
            @if(count($section['items']) > 0)
                <h2 class="cv-section-heading">{{ strtoupper($section['title']) }}</h2>

                @if(in_array($section['type'], ['skills', 'soft_skills']))
                    @foreach($section['items'] as $item)
                        @php
                            $isSkillsRow = empty($item['bullets']) || (count($item['bullets']) <= 1 && strlen($item['bullets'][0] ?? '') < 50);
                        @endphp
                        
                        @if($isSkillsRow)
                            @if(!empty($item['title']))
                                <p class="cv-skills-row">
                                    @if(!empty($item['subtitle']))
                                        <span class="cv-skills-category">{{ $item['title'] }}:</span> {{ $item['subtitle'] }}
                                    @elseif(!empty($item['bullets']))
                                        <span class="cv-skills-category">{{ $item['title'] }}:</span> {{ implode(', ', $item['bullets']) }}
                                    @elseif(!empty($item['metadata']['tech_stack']) && is_array($item['metadata']['tech_stack']))
                                        <span class="cv-skills-category">{{ $item['title'] }}:</span> {{ implode(', ', $item['metadata']['tech_stack']) }}
                                    @elseif(!empty($item['metadata']['skills']) && is_array($item['metadata']['skills']))
                                        <span class="cv-skills-category">{{ $item['title'] }}:</span> {{ implode(', ', $item['metadata']['skills']) }}
                                    @else
                                        {{ $item['title'] }}
                                    @endif
                                </p>
                            @elseif(!empty($item['bullets']))
                                <p class="cv-skills-row">
                                    {{ implode(', ', $item['bullets']) }}
                                </p>
                            @endif
                        @else
                            {{-- Skills section fallback item --}}
                            <table width="100%" class="cv-flex-row" cellspacing="0" cellpadding="0">
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
                                <tr>
                                    <td class="cv-left" width="70%" style="width: 70%; padding-top: 4px;">
                                        <span class="cv-entry-title">{!! $parsedTitle !!}</span>
                                        @if(empty($subtitleClean) && !empty($item['metadata']['gpa']))
                                            <span style="font-weight: normal; color: #444444;"> &bull; GPA: {{ $item['metadata']['gpa'] }}</span>
                                        @endif
                                    </td>
                                    <td class="cv-right" width="30%" style="width: 30%; text-align: right; padding-top: 4px;">
                                        @if($dateFromSubtitle)
                                            <span class="cv-entry-date">{{ $dateFromSubtitle }}</span>
                                        @endif
                                    </td>
                                </tr>
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
