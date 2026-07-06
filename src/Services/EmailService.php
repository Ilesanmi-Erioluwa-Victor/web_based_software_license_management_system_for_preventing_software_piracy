<?php

namespace App\Services;

class EmailService
{
    private static function sendViaBrevo(string $toEmail, string $toName, string $subject, string $htmlBody): bool
    {
        $apiKey = $_ENV['BREVO_API_KEY'] ?? '';

        if (empty($apiKey)) {
            return false;
        }

        $fromEmail = $_ENV['BREVO_FROM'] ?? 'noreply@license-manager.com';
        $fromName = $_ENV['BREVO_FROM_NAME'] ?? 'License Manager';

        $payload = json_encode([
            'sender' => ['name' => $fromName, 'email' => $fromEmail],
            'to' => [['email' => $toEmail, 'name' => $toName]],
            'subject' => $subject,
            'htmlContent' => $htmlBody,
        ]);

        $ch = curl_init('https://api.brevo.com/v3/smtp/email');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'api-key: ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode >= 200 && $httpCode < 300;
    }

    public static function sendLicenseCreated(string $toEmail, string $toName, string $licenseKey, string $productName, ?string $expiresAt): bool
    {
        $expiryText = $expiresAt ? date('F j, Y', strtotime($expiresAt)) : 'Never (Perpetual)';
        $subject = "Your License Key for {$productName}";
        $body = "
            <h2>License Key Generated</h2>
            <p>Hello {$toName},</p>
            <p>Your license key for <strong>{$productName}</strong> has been generated.</p>
            <p><strong>License Key:</strong> <code style='font-size:1.1em;padding:4px 8px;background:#f0f0f0;border-radius:4px;'>{$licenseKey}</code></p>
            <p><strong>Expires:</strong> {$expiryText}</p>
            <p>To activate your license, use the key above with your software.</p>
            <hr>
            <p style='color:#666;font-size:0.9em'>This is an automated message from License Manager.</p>
        ";
        return self::sendViaBrevo($toEmail, $toName, $subject, $body);
    }

    public static function sendExpiryWarning(string $toEmail, string $toName, string $licenseKey, string $productName, string $expiresAt, int $daysLeft): bool
    {
        $subject = "License Expiry Warning: {$productName}";
        $body = "
            <h2>License Expiring Soon</h2>
            <p>Hello {$toName},</p>
            <p>Your license for <strong>{$productName}</strong> will expire in <strong>{$daysLeft} days</strong>.</p>
            <p><strong>License Key:</strong> <code>{$licenseKey}</code></p>
            <p><strong>Expires:</strong> " . date('F j, Y', strtotime($expiresAt)) . "</p>
            <p>Please renew your license to avoid interruption.</p>
            <hr>
            <p style='color:#666;font-size:0.9em'>This is an automated message from License Manager.</p>
        ";
        return self::sendViaBrevo($toEmail, $toName, $subject, $body);
    }

    public static function sendLicenseRevoked(string $toEmail, string $toName, string $licenseKey, string $productName, ?string $reason): bool
    {
        $reasonText = $reason ? " Reason: {$reason}" : '';
        $subject = "License Revoked: {$productName}";
        $body = "
            <h2>License Revoked</h2>
            <p>Hello {$toName},</p>
            <p>Your license for <strong>{$productName}</strong> has been revoked.</p>
            <p><strong>License Key:</strong> <code>{$licenseKey}</code></p>
            <p>{$reasonText}</p>
            <p>If you believe this is an error, please contact support.</p>
            <hr>
            <p style='color:#666;font-size:0.9em'>This is an automated message from License Manager.</p>
        ";
        return self::sendViaBrevo($toEmail, $toName, $subject, $body);
    }

    public static function sendActivationAlert(string $toEmail, string $toName, string $licenseKey, string $productName, string $hardwareId, string $machineName): bool
    {
        $subject = "New Activation: {$productName}";
        $body = "
            <h2>New License Activation</h2>
            <p>Hello {$toName},</p>
            <p>Your license for <strong>{$productName}</strong> was activated on a new machine.</p>
            <p><strong>License Key:</strong> <code>{$licenseKey}</code></p>
            <p><strong>Hardware ID:</strong> <code>{$hardwareId}</code></p>
            <p><strong>Machine:</strong> {$machineName}</p>
            <p>If you did not authorize this activation, please contact support immediately.</p>
            <hr>
            <p style='color:#666;font-size:0.9em'>This is an automated message from License Manager.</p>
        ";
        return self::sendViaBrevo($toEmail, $toName, $subject, $body);
    }
}
