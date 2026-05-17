<?php
class AuthMiddleware
{
    public static function check(): void
    {
        $cfg   = require __DIR__ . '/../../config/config.php';
        $token = self::extractToken();

        if ($token === null || !hash_equals($cfg['api_token'], $token)) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized – invalid or missing API token']);
            exit;
        }
    }

    private static function extractToken(): ?string
    {
        //Authorization: Bearer <token>
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            return trim($m[1]);
        }
        return $_GET['token'] ?? null;
    }
}
