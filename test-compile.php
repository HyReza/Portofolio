<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$view = view('cv.ats-template', [
    'name' => 'John Doe',
    'title' => 'Software Engineer',
    'email' => 'john@doe.com',
    'phone' => '123456789',
    'location' => 'Jakarta, Indonesia',
    'linkedin' => 'linkedin.com/in/johndoe',
    'github' => 'github.com/johndoe',
    'website' => 'johndoe.com',
    'summary' => "Highly motivated Computer Science graduate with a 3.85 GPA to order to apply strong programming fundamentals and hands-on experience\ndemonstrates practical problem-solving and AI integration skills, aligning perfectly with a Software Engineer Internship role. My portfolio",
    'sections' => [],
    'language' => 'en',
    'style_settings' => [
        'font_family' => 'Arial',
        'font_size' => '9pt',
        'line_height' => '1.3',
        'theme_color' => '#222222',
        'section_spacing' => '8px',
        'entry_spacing' => '5px',
        'bullet_spacing' => '1.5px',
        'margin_top' => '35px',
        'margin_bottom' => '35px',
        'margin_left' => '45px',
        'margin_right' => '45px',
    ]
])->render();

file_put_contents('test-output.html', $view);
echo "HTML compiled successfully!\n";
