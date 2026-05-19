<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/auth.php';
requireAuth();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $row = $pdo->query('SELECT electricityRate, waterRate FROM rates WHERE id = 1')->fetch();
    $row['electricityRate'] = (float)$row['electricityRate'];
    $row['waterRate']       = (float)$row['waterRate'];
    echo json_encode($row);
    exit;
}

if ($method === 'PUT') {
    $b = json_decode(file_get_contents('php://input'), true);
    $pdo->prepare(
        'UPDATE rates SET electricityRate = :e, waterRate = :w WHERE id = 1'
    )->execute([':e' => $b['electricityRate'], ':w' => $b['waterRate']]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
