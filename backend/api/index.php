<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/controllers/OctaveController.php';
require_once __DIR__ . '/controllers/LogController.php';
require_once __DIR__ . '/controllers/StatsController.php';

$cfg    = require __DIR__ . '/../config/config.php';
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path   = preg_replace('#^/api#', '', $uri);

//Public routes with no auth(P)

if ($path === '/health' && $method === 'GET') {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok', 'time' => date('c')]);
    exit;
}

//P-OpenAPI YAML
if ($path === '/docs' && $method === 'GET') {
    header('Content-Type: text/yaml');
    header('Access-Control-Allow-Origin: *');
    readfile(__DIR__ . '/../docs/openapi.yaml');
    exit;
}

//P-OpenAPI PDF
if ($path === '/docs/pdf' && $method === 'GET') {
    $pdfPath  = __DIR__ . '/../docs/openapi_docs.pdf';
    $genScript = __DIR__ . '/../docs/generate_pdf.py';

    exec("python3 " . escapeshellarg($genScript) . " 2>&1", $out, $code);

    if ($code !== 0 || !file_exists($pdfPath)) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'PDF generation failed', 'details' => implode("\n", $out)]);
        exit;
    }

    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="api_documentation.pdf"');
    header('Content-Length: ' . filesize($pdfPath));
    readfile($pdfPath);
    exit;
}

AuthMiddleware::check();

$octave = new OctaveController($cfg);
$log    = new LogController();
$stats  = new StatsController($cfg);

match (true) {
    //Octave/CAS
    $path === '/eval'               && $method === 'POST' => $octave->eval($log),
    $path === '/simulate/pendulum'  && $method === 'POST' => $octave->simulatePendulum($log, $stats),
    $path === '/simulate/ball-beam' && $method === 'POST' => $octave->simulateBallBeam($log, $stats),

    //Logs
    $path === '/logs'               && $method === 'GET'  => $log->index(),
    $path === '/logs/export'        && $method === 'GET'  => $log->export(),

    //Stats
    $path === '/stats'              && $method === 'GET'  => $stats->index(),


    default => (function () {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    })(),
};
