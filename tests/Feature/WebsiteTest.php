<?php

use App\Models\Website;
use Inertia\Testing\AssertableInertia as Assert;

test('dashboard displays websites from the database', function () {
    Website::query()->create([
        'name' => 'Portfolio',
        'slug' => 'portfolio',
        'status' => 'published',
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('websites', 1)
            ->where('websites.0.name', 'Portfolio')
            ->where('stats.total', 1)
            ->where('stats.published', 1)
        );
});

test('a website can be created and opened in the editor', function () {
    $response = $this->post(route('websites.store'), [
        'name' => 'My Portfolio',
    ]);

    $website = Website::query()->where('slug', 'my-portfolio')->firstOrFail();

    $response->assertRedirect(route('websites.editor', $website));

    $this->get(route('websites.editor', $website))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('editor')
            ->where('websiteSlug', 'my-portfolio')
        );
});

test('duplicate website names receive unique slugs', function () {
    Website::query()->create([
        'name' => 'Portfolio',
        'slug' => 'portfolio',
        'status' => 'draft',
    ]);

    $this->post(route('websites.store'), [
        'name' => 'Portfolio',
    ])->assertRedirect();

    expect(Website::query()->where('slug', 'portfolio-2')->exists())->toBeTrue();
});

test('a website can be updated and deleted', function () {
    $website = Website::query()->create([
        'name' => 'Portfolio',
        'slug' => 'portfolio',
        'status' => 'draft',
    ]);

    $this->patch(route('websites.update', $website), [
        'name' => 'Portfolio Updated',
        'status' => 'published',
    ])->assertRedirect(route('dashboard'));

    expect($website->fresh()->name)->toBe('Portfolio Updated')
        ->and($website->fresh()->status)->toBe('published');

    $this->delete(route('websites.destroy', $website))
        ->assertRedirect(route('dashboard'));

    $this->assertDatabaseMissing('websites', ['id' => $website->id]);
});

test('the editor returns 404 for a website that does not exist', function () {
    $this->get('/websites/999999/editor')->assertNotFound();
});

test('website creation validates the name', function () {
    $this->from(route('dashboard'))
        ->post(route('websites.store'), ['name' => ''])
        ->assertSessionHasErrors('name');

    expect(Website::query()->count())->toBe(0);
});