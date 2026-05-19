<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/auth.php';
requireAuth();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET /rooms
if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM rooms ORDER BY number')->fetchAll();
    echo json_encode($rows);
    exit;
}

// POST /rooms  — add room
if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare(
        'INSERT INTO rooms (id, number, monthlyRent, status, currentTenancyId)
         VALUES (:id, :number, :monthlyRent, :status, :currentTenancyId)'
    );
    $stmt->execute([
        ':id'               => $b['id'],
        ':number'           => $b['number'],
        ':monthlyRent'      => $b['monthlyRent'],
        ':status'           => $b['status'],
        ':currentTenancyId' => $b['currentTenancyId'],
    ]);
    http_response_code(201);
    echo json_encode(['success' => true]);
    exit;
}

// PUT /rooms?id=xxx  — update room
if ($method === 'PUT') {
    $id = $_GET['id'] ?? '';
    $b  = json_decode(file_get_contents('php://input'), true);
    $sets = [];
    $params = [':id' => $id];
    foreach (['number','monthlyRent','status','currentTenancyId'] as $col) {
        if (array_key_exists($col, $b)) {
            $sets[]        = "`$col` = :$col";
            $params[":$col"] = $b[$col];
        }
    }
    if (empty($sets)) { echo json_encode(['success' => true]); exit; }
    $pdo->prepare('UPDATE rooms SET ' . implode(', ', $sets) . ' WHERE id = :id')
        ->execute($params);
    echo json_encode(['success' => true]);
    exit;
}

// DELETE /rooms?id=xxx
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $pdo->prepare('DELETE FROM rooms WHERE id = ?')->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
