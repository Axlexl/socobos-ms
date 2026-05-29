<?php
// ── Database connection ────────────────────────────────────────
// Edit these values to match your hosting environment

define('DB_HOST', 'sql308.infinityfree.com');
define('DB_NAME', 'if0_42024407_socobos');
define('DB_USER', 'if0_42024407');
define('DB_PASS', 'YOUR_VPANEL_PASSWORD'); // ← replace with your vPanel password

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
