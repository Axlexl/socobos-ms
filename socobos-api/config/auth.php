<?php
// Simple token auth — the app sends the token in the Authorization header
// Token is generated on login and stored in the app

function requireAuth(): void {
    $headers = getallheaders();
    $token   = $headers['Authorization'] ?? '';

    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Verify token matches what we stored
    require_once __DIR__ . '/db.php';
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT token FROM owner WHERE id = 1');
    $stmt->execute();
    $row = $stmt->fetch();

    if (!$row || $row['token'] !== $token) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }
}
