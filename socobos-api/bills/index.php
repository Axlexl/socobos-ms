<?php
require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/auth.php';
requireAuth();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM bills ORDER BY generatedAt')->fetchAll();
    foreach ($rows as &$r) {
        foreach (['prevElectricity','currElectricity','prevWater','currWater',
                  'electricityRate','waterRate','rentAmount','electricityCost',
                  'waterCost','totalAmount','amountPaid','balance'] as $f) {
            $r[$f] = (float)$r[$f];
        }
    }
    echo json_encode($rows);
    exit;
}

if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare(
        'INSERT INTO bills
         (id,tenancyId,roomId,roomNumber,month,prevElectricity,currElectricity,
          prevWater,currWater,electricityRate,waterRate,rentAmount,electricityCost,
          waterCost,totalAmount,amountPaid,balance,status,dueDate,generatedAt)
         VALUES
         (:id,:tenancyId,:roomId,:roomNumber,:month,:prevElectricity,:currElectricity,
          :prevWater,:currWater,:electricityRate,:waterRate,:rentAmount,:electricityCost,
          :waterCost,:totalAmount,:amountPaid,:balance,:status,:dueDate,:generatedAt)'
    );
    $stmt->execute([
        ':id'              => $b['id'],
        ':tenancyId'       => $b['tenancyId'],
        ':roomId'          => $b['roomId'],
        ':roomNumber'      => $b['roomNumber'],
        ':month'           => $b['month'],
        ':prevElectricity' => $b['prevElectricity'],
        ':currElectricity' => $b['currElectricity'],
        ':prevWater'       => $b['prevWater'],
        ':currWater'       => $b['currWater'],
        ':electricityRate' => $b['electricityRate'],
        ':waterRate'       => $b['waterRate'],
        ':rentAmount'      => $b['rentAmount'],
        ':electricityCost' => $b['electricityCost'],
        ':waterCost'       => $b['waterCost'],
        ':totalAmount'     => $b['totalAmount'],
        ':amountPaid'      => $b['amountPaid'],
        ':balance'         => $b['balance'],
        ':status'          => $b['status'],
        ':dueDate'         => $b['dueDate'],
        ':generatedAt'     => $b['generatedAt'],
    ]);
    http_response_code(201);
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'PUT') {
    $id = $_GET['id'] ?? '';
    $b  = json_decode(file_get_contents('php://input'), true);
    $allowed = ['amountPaid','balance','status'];
    $sets = []; $params = [':id' => $id];
    foreach ($allowed as $col) {
        if (array_key_exists($col, $b)) {
            $sets[]          = "`$col` = :$col";
            $params[":$col"] = $b[$col];
        }
    }
    if (!empty($sets)) {
        $pdo->prepare('UPDATE bills SET ' . implode(', ', $sets) . ' WHERE id = :id')
            ->execute($params);
    }
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
