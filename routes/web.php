<?php

use App\Http\Controllers\WebsiteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');
Route::get('/dashboard', [WebsiteController::class, 'index'])->name('dashboard');
Route::post('/websites', [WebsiteController::class, 'store'])->name('websites.store');
Route::patch('/websites/{website}', [WebsiteController::class, 'update'])->name('websites.update');
Route::delete('/websites/{website}', [WebsiteController::class, 'destroy'])->name('websites.destroy');
Route::get('/websites/{website}/editor', [WebsiteController::class, 'editor'])->name('websites.editor');
Route::put('/websites/{website}/draft', [WebsiteController::class, 'saveDraft'])->name('websites.save-draft');