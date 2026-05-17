<?php
return [

    // API authentication token(change this before deployment!)
    'api_token' => getenv('API_TOKEN') ?: 'SECRET',

    'octave_slowdown' => (float)(getenv('OCTAVE_SLOWDOWN') ?: 0),

    'stats_interval_minutes' => (int)(getenv('STATS_INTERVAL') ?: 10),

    // Database
    'db' => [
        'host'     => getenv('DB_HOST')     ?: 'mysql',
        'port'     => getenv('DB_PORT')     ?: '3306',
        'name'     => getenv('DB_NAME')     ?: 'casapp',
        'user'     => getenv('DB_USER')     ?: 'casuser',
        'password' => getenv('DB_PASSWORD') ?: 'caspass',
        'charset'  => 'utf8mb4',
    ],

    //Internal Octave microservice URL
    'octave_url' => getenv('OCTAVE_URL') ?: 'http://octave:5000',

    //Supported languages
    'languages' => ['sk', 'en'],
    'default_language' => 'sk',
];
