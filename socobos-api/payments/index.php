<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/auth.php';
requireAuth();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM payments ORDER BY date')->fetchAll();
    foreach ($rows as &$r) {
        $r['amount'] = (float)$r['amount'];
    }
    echo json_encode($rows);
    exit;
}

if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare(
        'INSERT INTO payments (id, billId, tenancyId, roomNumber, tenantName, amount, date, note)
         VALUES (:id, :billId, :tenancyId, :roomNumber, :tenantName, :amount, :date, :note)'
    );
    $stmt->execute([
        ':id'         => $b['id'],
        ':billId'     => $b['billId'],
        ':tenancyId'  => $b['tenancyId'],
        ':roomNumber' => $b['roomNumber'],
        ':tenantName' => $b['tenantName'],
        ':amount'     => $b['amount'],
        ':date'       => $b['date'],
        ':note'       => $b['note'] ?? null,
    ]);
    http_response_code(201);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
