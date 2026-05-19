<?php
require_once '../config/cors.php';
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

$body     = json_decode(file_get_contents('php://input'), true);
$password = trim($body['password'] ?? '');

if (empty($password)) {
    http_response_code(400); echo json_encode(['error' => 'Password required']); exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT passwordHash FROM owner WHERE id = 1');
$stmt->execute();
$row  = $stmt->fetch();

if (!$row || !password_verify($password, $row['passwordHash'])) {
    http_response_code(401); echo json_encode(['error' => 'Incorrect password']); exit;
}

// Generate a simple token
$token = bin2hex(random_bytes(32));
$pdo->prepare('UPDATE owner SET token = ? WHERE id = 1')->execute([$token]);

echo json_encode(['token' => $token]);
