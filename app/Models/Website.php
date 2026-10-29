<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $status
 * @property array<string, mixed>|null $content
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'status', 'content'])]
class Website extends Model
{
    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }
}