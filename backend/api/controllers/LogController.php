<?php
class LogController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::get();
    }

    public function write(string $command, bool $success, string $type): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO request_logs (created_at, type, command, success)
             VALUES (NOW(), :type, :command, :success)'
        );
        $stmt->execute([
            ':type'    => $type,
            ':command' => $command,
            ':success' => $success ? 1 : 0,
        ]);
    }

    //GET /api/logs
    public function index(): void
    {
        $page  = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(200, max(1, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $rows = $this->db->query(
            "SELECT id, created_at, type, command, success
             FROM request_logs
             ORDER BY created_at DESC
             LIMIT $limit OFFSET $offset"
        )->fetchAll();

        $total = (int)$this->db->query('SELECT COUNT(*) FROM request_logs')->fetchColumn();

        echo json_encode([
            'data'       => $rows,
            'total'      => $total,
            'page'       => $page,
            'limit'      => $limit,
            'pages'      => (int)ceil($total / $limit),
        ]);
    }

    //GET /api/logs/export (CSV download)
    public function export(): void
    {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="logs_' . date('Ymd_His') . '.csv"');

        $rows = $this->db->query(
            'SELECT id, created_at, type, command, success FROM request_logs ORDER BY created_at DESC'
        )->fetchAll();

        $out = fopen('php://output', 'w');
        fputcsv($out, ['id', 'created_at', 'type', 'command', 'success']);
        foreach ($rows as $row) {
            $row['success'] = $row['success'] ? 'yes' : 'no';
            fputcsv($out, $row);
        }
        fclose($out);
    }
}
