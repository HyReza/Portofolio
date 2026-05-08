<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            if (!Schema::hasColumn('certificates', 'credential_type')) {
                $table->string('credential_type')->nullable()->after('issuer');
            }
            if (!Schema::hasColumn('certificates', 'credential_type_en')) {
                $table->string('credential_type_en')->nullable()->after('credential_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['credential_type', 'credential_type_en']);
        });
    }
};
