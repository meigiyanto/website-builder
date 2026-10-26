<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/dashboard', 'dashboard')->name('dashboard');
Route::get('/websites/{website}/editor', function (string $website) {
    return Inertia::render('editor', [
        'websiteSlug' => $website,
    ]);
})->name('websites.editor');