<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\LinkedinController;
use App\Http\Controllers\InstagramController;
use App\Http\Controllers\CvController;
use Illuminate\Support\Facades\Route;

// ── Public Pages ──
Route::get('/', HomeController::class)->name('home');
Route::get('/about', [PublicController::class, 'about'])->name('about');
Route::get('/projects', [PublicController::class, 'projects'])->name('projects');
Route::get('/blog', [PublicController::class, 'blog'])->name('blog');
Route::get('/blog/{blog}', [PublicController::class, 'blogShow'])->name('blog.show');
Route::get('/certificates', [PublicController::class, 'certificates'])->name('certificates');
Route::get('/contact', [PublicController::class, 'contact'])->name('contact');
Route::get('/projects/{project}', [PublicController::class, 'projectShow'])->name('projects.show');

// Chat Room
Route::get('/chat', [ChatController::class, 'index'])->name('chat');
Route::get('/api/chat', [ChatController::class, 'messages'])->name('chat.messages');
Route::post('/api/chat', [ChatController::class, 'store'])->name('chat.store');
Route::delete('/api/chat/{id}', [ChatController::class, 'destroy'])->name('chat.destroy')->middleware(['auth']);

// Content Pages
Route::get('/linkedin', [LinkedinController::class, 'index'])->name('linkedin');
Route::get('/instagram', [InstagramController::class, 'index'])->name('instagram');

// CV Download
Route::get('/cv/{lang}', [CvController::class, 'download'])->name('cv.download')->where('lang', 'id|en');

// Public API
Route::post('/api/contact', [\App\Http\Controllers\ContactController::class, 'store'])->name('contact.store');

// ── Admin Routes (Auth Required) ──
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');

    // Translation API
    Route::post('translate', [Admin\TranslationController::class, 'translate'])->name('translate');

    // URL Meta Fetcher (auto-populate LinkedIn/Instagram)
    Route::post('fetch-url-meta', [Admin\UrlMetaController::class, 'fetch'])->name('fetch-url-meta');
    Route::post('fetch-ig-profile', [Admin\UrlMetaController::class, 'fetchIgProfile'])->name('fetch-ig-profile');

    // Profile
    Route::get('profile', [Admin\ProfileController::class, 'index'])->name('profile.index');
    Route::post('profile', [Admin\ProfileController::class, 'store'])->name('profile.store');
    Route::post('profile/photo', [Admin\ProfileController::class, 'uploadPhoto'])->name('profile.photo');
    Route::delete('profile/{profile}', [Admin\ProfileController::class, 'destroy'])->name('profile.destroy');

    // Education
    Route::get('education', [Admin\EducationController::class, 'index'])->name('education.index');
    Route::post('education', [Admin\EducationController::class, 'store'])->name('education.store');
    Route::put('education/{education}', [Admin\EducationController::class, 'update'])->name('education.update');
    Route::delete('education/{education}', [Admin\EducationController::class, 'destroy'])->name('education.destroy');

    // Careers
    Route::get('careers', [Admin\CareerController::class, 'index'])->name('careers.index');
    Route::post('careers', [Admin\CareerController::class, 'store'])->name('careers.store');
    Route::put('careers/{career}', [Admin\CareerController::class, 'update'])->name('careers.update');
    Route::delete('careers/{career}', [Admin\CareerController::class, 'destroy'])->name('careers.destroy');

    // Organizations
    Route::get('organizations', [Admin\OrganizationController::class, 'index'])->name('organizations.index');
    Route::post('organizations', [Admin\OrganizationController::class, 'store'])->name('organizations.store');
    Route::put('organizations/{organization}', [Admin\OrganizationController::class, 'update'])->name('organizations.update');
    Route::delete('organizations/{organization}', [Admin\OrganizationController::class, 'destroy'])->name('organizations.destroy');

    // Skills
    Route::get('skills', [Admin\SkillController::class, 'index'])->name('skills.index');
    Route::post('skills/categories', [Admin\SkillController::class, 'storeCategory'])->name('skills.categories.store');
    Route::put('skills/categories/{category}', [Admin\SkillController::class, 'updateCategory'])->name('skills.categories.update');
    Route::delete('skills/categories/{category}', [Admin\SkillController::class, 'destroyCategory'])->name('skills.categories.destroy');
    Route::post('skills', [Admin\SkillController::class, 'storeSkill'])->name('skills.store');
    Route::put('skills/{skill}', [Admin\SkillController::class, 'updateSkill'])->name('skills.update');
    Route::delete('skills/{skill}', [Admin\SkillController::class, 'destroySkill'])->name('skills.destroy');

    // Projects
    Route::resource('projects', Admin\ProjectController::class)->except(['show']);

    // Blogs & Tags
    Route::post('blogs/tags', [Admin\BlogController::class, 'storeTag'])->name('blogs.tags.store');
    Route::resource('tags', Admin\TagController::class)->except(['show', 'create']);
    Route::resource('blogs', Admin\BlogController::class)->except(['show']);

    // Achievements
    Route::get('achievements', [Admin\AchievementController::class, 'index'])->name('achievements.index');
    Route::post('achievements', [Admin\AchievementController::class, 'store'])->name('achievements.store');
    Route::put('achievements/{achievement}', [Admin\AchievementController::class, 'update'])->name('achievements.update');
    Route::delete('achievements/{achievement}', [Admin\AchievementController::class, 'destroy'])->name('achievements.destroy');

    // Certificates
    Route::get('certificates', [Admin\CertificateController::class, 'index'])->name('certificates.index');
    Route::post('certificates', [Admin\CertificateController::class, 'store'])->name('certificates.store');
    Route::put('certificates/{certificate}', [Admin\CertificateController::class, 'update'])->name('certificates.update');
    Route::delete('certificates/{certificate}', [Admin\CertificateController::class, 'destroy'])->name('certificates.destroy');
    Route::post('certificates/reorder', [Admin\CertificateController::class, 'reorder'])->name('certificates.reorder');

    // Contacts
    Route::get('contacts', [Admin\ContactController::class, 'index'])->name('contacts.index');
    Route::get('contacts/{contact}', [Admin\ContactController::class, 'show'])->name('contacts.show');
    Route::delete('contacts/{contact}', [Admin\ContactController::class, 'destroy'])->name('contacts.destroy');

    // LinkedIn
    Route::get('linkedin', [Admin\LinkedinController::class, 'index'])->name('linkedin.index');
    Route::post('linkedin', [Admin\LinkedinController::class, 'store'])->name('linkedin.store');
    Route::put('linkedin/{linkedin}', [Admin\LinkedinController::class, 'update'])->name('linkedin.update');
    Route::delete('linkedin/{linkedin}', [Admin\LinkedinController::class, 'destroy'])->name('linkedin.destroy');

    // Instagram
    Route::get('instagram', [Admin\InstagramController::class, 'index'])->name('instagram.index');
    Route::post('instagram', [Admin\InstagramController::class, 'store'])->name('instagram.store');
    Route::put('instagram/{instagram}', [Admin\InstagramController::class, 'update'])->name('instagram.update');
    Route::delete('instagram/{instagram}', [Admin\InstagramController::class, 'destroy'])->name('instagram.destroy');

    // Settings
    Route::get('settings', [Admin\SettingController::class, 'index'])->name('settings.index');
    Route::post('settings/api-key', [Admin\SettingController::class, 'updateApiKey'])->name('settings.api-key.update');
    Route::delete('settings/api-key', [Admin\SettingController::class, 'removeApiKey'])->name('settings.api-key.destroy');

    // TipTap Editor Image Upload
    Route::post('upload-image', [Admin\ImageUploadController::class, 'store'])->name('upload-image');
});

require __DIR__.'/settings.php';
