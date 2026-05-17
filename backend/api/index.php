<?php
declare(strict_types=1);

header('Content-Type: application/json');
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

if ($path === '/health' && $method === 'GET') {
    echo json_encode(['status' => 'ok', 'time' => date('c')]);
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

    //OpenAPI docs
    $path === '/docs'               && $method === 'GET'  => (function () {
        $yaml = file_get_contents(__DIR__ . '/../docs/openapi.yaml');
        header('Content-Type: application/yaml');
        echo $yaml;
        exit;
    })(),

    default => (function () {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    })(),
};
