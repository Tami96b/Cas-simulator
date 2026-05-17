<?php
class StatsController
{
    private PDO    $db;
    private int    $intervalMinutes;

    public function __construct(private array $cfg)
    {
        $this->db              = Database::get();
        $this->intervalMinutes = $cfg['stats_interval_minutes'];
    }

    public function record(string $animationType): void
    {
        $userToken = $this->getUserToken();
        $ip        = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';

        $stmt = $this->db->prepare(
            'SELECT id FROM animation_stats
             WHERE user_token = :token AND animation_type = :type
               AND created_at > DATE_SUB(NOW(), INTERVAL :mins MINUTE)
             LIMIT 1'
        );
        $stmt->execute([
            ':token' => $userToken,
            ':type'  => $animationType,
            ':mins'  => $this->intervalMinutes,
        ]);

        if ($stmt->fetch()) {
            return; // within dedup window, skip
        }

        //Geo-lookup (free)
        $geo  = $this->geoLookup($ip);

        $stmt = $this->db->prepare(
            'INSERT INTO animation_stats (created_at, animation_type, user_token, ip, city, country)
             VALUES (NOW(), :type, :token, :ip, :city, :country)'
        );
        $stmt->execute([
            ':type'    => $animationType,
            ':token'   => $userToken,
            ':ip'      => $ip,
            ':city'    => $geo['city'] ?? '',
            ':country' => $geo['country'] ?? '',
        ]);
    }

    //GET /api/stats
    public function index(): void
    {
        $counts = $this->db->query(
            "SELECT animation_type, COUNT(*) as total
             FROM animation_stats GROUP BY animation_type"
        )->fetchAll();

        $details = $this->db->query(
            "SELECT animation_type, created_at, city, country
             FROM animation_stats ORDER BY created_at DESC LIMIT 200"
        )->fetchAll();

        echo json_encode([
            'totals'  => $counts,
            'details' => $details,
        ]);
    }

    private function getUserToken(): string
    {
        if (!isset($_COOKIE['user_token'])) {
            $token = bin2hex(random_bytes(16));
            setcookie('user_token', $token, [
                'expires'  => time() + 60 * 60 * 24 * 365,
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            return $token;
        }
        return $_COOKIE['user_token'];
    }

    private function geoLookup(string $ip): array
    {
        if (empty($ip) || $ip === '127.0.0.1' || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
            return ['city' => 'localhost', 'country' => 'local'];
        }
        $raw = @file_get_contents("http://ip-api.com/json/{$ip}?fields=city,country", false,
            stream_context_create(['http' => ['timeout' => 3]])
        );
        return $raw ? (json_decode($raw, true) ?? []) : [];
    }
}
