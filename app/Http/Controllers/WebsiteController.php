<?php

namespace App\Http\Controllers;

use App\Models\Website;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\Rule;

class WebsiteController extends Controller
{
    public function index(): Response
    {
        $websites = Website::query()
            ->latest()
            ->get(['id', 'name', 'slug', 'status', 'created_at', 'updated_at']);

        return Inertia::render('dashboard', [
            'websites' => $websites,
            'stats' => [
                'total' => $websites->count(),
                'published' => $websites->where('status', 'published')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]);

        $baseSlug = Str::slug($validated['name']);

        if ($baseSlug === '') {
            $baseSlug = 'website';
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (Website::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        $website = Website::query()->create([
            'name' => $validated['name'],
            'slug' => $slug,
            'status' => 'draft',
        ]);

        return redirect()->route('websites.editor', $website)->with('success', 'Website berhasil dibuat.');
    }
    
    public function saveDraft(Request $request, Website $website): RedirectResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'array'],
        ]);
    
        $website->update([
            'content' => $validated['content'],
            'status' => 'draft',
        ]);
    
        return back()->with('success', 'Draft berhasil disimpan.');
    }

    public function update(Request $request, Website $website): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);

        $website->update($validated);

        return to_route('dashboard')
            ->with('success', 'Website berhasil diperbarui.');
    }

    public function destroy(Website $website): RedirectResponse
    {
        $website->delete();

        return to_route('dashboard')
            ->with('success', 'Website berhasil dihapus.');
    }

    public function editor(Website $website): Response
    {
        return Inertia::render('editor', [
            'websiteId' => $website->id,
            'websiteSlug' => $website->slug,
            'websiteContent' => $website->content,
        ]);
    }
}