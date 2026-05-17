<?php
class OctaveController
{
    public function __construct(private array $cfg) {}

    //POST /api/eval
    public function eval(LogController $log): void
    {
        $body      = $this->parseBody();
        $sessionId = $body['session_id'] ?? session_id() ?: 'anon';
        $command   = trim($body['command'] ?? '');

        if ($command === '') {
            http_response_code(400);
            echo json_encode(['error' => 'command is required']);
            return;
        }

        $result = $this->callOctave('/eval', [
            'session_id' => $sessionId,
            'command'    => $command,
        ]);

        $log->write($command, $result['success'] ?? false, 'eval');
        echo json_encode($result);
    }

    //POST /api/simulate/pendulum
    public function simulatePendulum(LogController $log, StatsController $stats): void
    {
        $body   = $this->parseBody();
        $result = $this->callOctave('/simulate/pendulum', $body);

        $log->write(json_encode($body), $result['success'] ?? false, 'pendulum');
        $stats->record('pendulum');
        echo json_encode($result);
    }

    //POST /api/simulate/ball-beam
    public function simulateBallBeam(LogController $log, StatsController $stats): void
    {
        $body   = $this->parseBody();
        $result = $this->callOctave('/simulate/ball_beam', $body);

        $log->write(json_encode($body), $result['success'] ?? false, 'ball_beam');
        $stats->record('ball_beam');
        echo json_encode($result);
    }

    private function callOctave(string $endpoint, array $payload): array
    {
        $url = rtrim($this->cfg['octave_url'], '/') . $endpoint;
        $ctx = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\n",
                'content' => json_encode($payload),
                'timeout' => 60,
            ],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false) {
            http_response_code(502);
            return ['error' => 'Octave service unavailable', 'success' => false];
        }
        return json_decode($raw, true) ?? ['error' => 'Invalid JSON from Octave service', 'success' => false];
    }

    private function parseBody(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?? [];
    }
}
