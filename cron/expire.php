<?php
/**
 * Cron job entry point for license expiry check.
 * Triggered by Render Cron Job: GET /api/cron/expire
 *
 * Or run manually: php cron/expire.php
 */

require_once __DIR__ . '/../src/bootstrap.php';
