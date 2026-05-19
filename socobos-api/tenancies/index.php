<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/auth.php';
requireAuth();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM tenancies ORDER BY createdAt')->fetchAll();
    // Cast numeric-looking booleans
    foreach ($rows as &$r) {
        $r['initialPaymentsPaid'] = (bool)$r['initialPaymentsPaid'];
        $r['securityDeposit']     = (float)$r['securityDeposit'];
        $r['advancePayment']      = (float)$r['advancePayment'];
    }
    echo json_encode($rows);
    exit;
}

if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare(
        'INSERT INTO tenancies
         (id, roomId, roomNumber, tenantName, tenantPhone, moveInDate, moveOutDate,
          status, securityDeposit, advancePayment, initialPaymentsPaid)
         VALUES
         (:id,:roomId,:roomNumber,:tenantName,:tenantPhone,:moveInDate,:moveOutDate,
          :status,:securityDeposit,:advancePayment,:initialPaymentsPaid)'
    );
    $stmt->execute([
        ':id'                  => $b['id'],
        ':roomId'              => $b['roomId'],
        ':roomNumber'          => $b['roomNumber'],
        ':tenantName'          => $b['tenantName'],
        ':tenantPhone'         => $b['tenantPhone'],
        ':moveInDate'          => $b['moveInDate'],
        ':moveOutDate'         => $b['moveOutDate'],
        ':status'              => $b['status'],
        ':securityDeposit'     => $b['securityDeposit'],
        ':advancePayment'      => $b['advancePayment'],
        ':initialPaymentsPaid' => $b['initialPaymentsPaid'] ? 1 : 0,
    ]);
    http_response_code(201);
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? '';
    $b  = json_decode(file_get_contents('php://input'), true);
    $allowed = ['tenantName','tenantPhone','moveInDate','moveOutDate','status',
                'securityDeposit','advancePayment','initialPaymentsPaid'];
    $sets = []; $params = [':id' => $id];
    foreach ($allowed as $col) {
        if (array_key_exists($col, $b)) {
            $sets[]          = "`$col` = :$col";
            $params[":$col"] = $b[$col];
        }
    }
    if (!empty($sets)) {
        $pdo->prepare('UPDATE tenancies SET ' . implode(', ', $sets) . ' WHERE id = :id')
            ->execute($params);
    }
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
