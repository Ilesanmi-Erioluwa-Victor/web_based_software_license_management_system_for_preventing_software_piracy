<?php

namespace App\Services;

use App\Models\License;

class ExpiryService
{
    public static function run(): array
    {
        $expiredCount = License::getExpiredCount();

        $sevenDayLicenses = License::findExpiringLicenses(7);
        $oneDayLicenses = License::findExpiringLicenses(1);

        $notificationsSent = 0;
        foreach ($sevenDayLicenses as $license) {
            $daysLeft = (int) ceil((strtotime($license['expires_at']) - time()) / 86400);
            if ($daysLeft === 7 || $daysLeft === 1) {
                EmailService::sendExpiryWarning(
                    $license['customer_email'],
                    $license['customer_name'],
                    $license['license_key'],
                    $license['product_name'],
                    $license['expires_at'],
                    $daysLeft
                );
                $notificationsSent++;
            }
        }

        return [
            'licenses_expired' => $expiredCount,
            'warning_notifications_sent' => $notificationsSent,
        ];
    }
}
