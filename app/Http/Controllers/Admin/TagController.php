<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogTag;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TagController extends Controller
{
    public function index()
    {
        $tags = BlogTag::withCount('blogs')->latest()->get();
        return Inertia::render('admin/tags/index', [
            'tags' => $tags
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        BlogTag::create($validated);

        return redirect()->back()->with('success', 'Tag created successfully.');
    }

    public function update(Request $request, BlogTag $tag)
    {
        $validated = $request->validate([
            'name_id' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
        ]);

        $tag->update($validated);

        return redirect()->back()->with('success', 'Tag updated successfully.');
    }

    public function destroy(BlogTag $tag)
    {
        if ($tag->blogs()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa dihapus karena sedang digunakan di blog (Cannot delete because it is used in blogs).']);
        }

        $tag->delete();

        return redirect()->back()->with('success', 'Tag deleted successfully.');
    }
}
