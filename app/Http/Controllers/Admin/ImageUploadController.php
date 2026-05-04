<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageUploadController extends Controller
{
    /**
     * Handle image upload from TipTap Editor.
     */
    public function store(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'], // Max 5MB
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('tiptap', 'public');
            return response()->json([
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['error' => 'No image provided'], 400);
    }
}
