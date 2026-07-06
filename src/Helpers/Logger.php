<?php

namespace App\Helpers;

use App\Config\Database;

class Logger
{
    public static function audit(
        string $action,
        ?string $actorId = null,
        ?string $licenseId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        array $details = []
    ): void {
        Database::insertOne('audit_logs', [
            'action' => $action,
            'actor_id' => $actorId,
            'license_id' => $licenseId,
            'ip_address' => $ipAddress ?? ($_SERVER['REMOTE_ADDR'] ?? null),
            'user_agent' => $userAgent ?? ($_SERVER['HTTP_USER_AGENT'] ?? null),
            'details' => $details,
            'created_at' => date('c'),
        ]);
    }
}
