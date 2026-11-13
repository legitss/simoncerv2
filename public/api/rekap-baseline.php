<?php
/**
 * SIMONCER — Penyimpanan baseline Rekap Pemeriksaan (dipakai bersama semua pengguna).
 *
 * GET  rekap-baseline.php              → ringkasan semua tab {tabs: {key: {version, updatedAt, updatedBy, recordCount}}}
 * GET  rekap-baseline.php?tab=KEY      → isi lengkap satu tab (version 0 bila belum ada)
 * POST rekap-baseline.php?tab=KEY      → simpan satu tab. Body JSON: {baseVersion, by, note, data:{columns, records, source}}
 *                                        Ditolak (409) bila baseVersion ≠ versi di server (sudah diubah orang lain).
 *
 * Data disimpan DI LUAR folder web agar tidak tertimpa saat update dist/ dan tidak bisa diunduh langsung:
 *   <induk htdocs/www>/simoncer-data/rekap-baseline/   (mis. C:\xampp\simoncer-data\rekap-baseline\)
 * Bisa diganti lewat environment variable SIMONCER_DATA_DIR.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function data_dir(): string {
    $env = getenv('SIMONCER_DATA_DIR');
    if ($env) return rtrim($env, '/\\') . DIRECTORY_SEPARATOR . 'rekap-baseline';
    // Cari folder web root (htdocs / www) di atas file ini, lalu pakai induknya.
    // Dengan begitu salinan di htdocs\ maupun htdocs\simoncerv2\ memakai data yang SAMA.
    $dir = __DIR__;
    while (true) {
        $parent = dirname($dir);
        if ($parent === $dir) break;
        $name = strtolower(basename($dir));
        if ($name === 'htdocs' || $name === 'www') {
            return $parent . DIRECTORY_SEPARATOR . 'simoncer-data' . DIRECTORY_SEPARATOR . 'rekap-baseline';
        }
        $dir = $parent;
    }
    return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'simoncer-data' . DIRECTORY_SEPARATOR . 'rekap-baseline';
}

function tab_file(string $dir, string $tab): string {
    return $dir . DIRECTORY_SEPARATOR . 'tab-' . $tab . '.json';
}

function read_tab(string $file): ?array {
    if (!is_file($file)) return null;
    $raw = file_get_contents($file);
    $doc = $raw === false ? null : json_decode($raw, true);
    return is_array($doc) ? $doc : null;
}

$dir = data_dir();
if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
    respond(500, ['error' => 'Folder penyimpanan tidak dapat dibuat: ' . $dir]);
}

$tab = $_GET['tab'] ?? '';
if ($tab !== '' && !preg_match('/^[a-z0-9-]{1,40}$/', $tab)) {
    respond(400, ['error' => 'Nama tab tidak valid.']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    if ($tab === '') {
        $tabs = [];
        foreach (glob($dir . DIRECTORY_SEPARATOR . 'tab-*.json') ?: [] as $file) {
            $doc = read_tab($file);
            if (!$doc) continue;
            $key = substr(basename($file, '.json'), 4);
            $tabs[$key] = [
                'version' => $doc['version'] ?? 0,
                'updatedAt' => $doc['updatedAt'] ?? null,
                'updatedBy' => $doc['updatedBy'] ?? null,
                'recordCount' => is_array($doc['records'] ?? null) ? count($doc['records']) : 0,
            ];
        }
        respond(200, ['tabs' => (object) $tabs]);
    }
    $doc = read_tab(tab_file($dir, $tab));
    respond(200, $doc ?? ['tab' => $tab, 'version' => 0, 'columns' => [], 'records' => [], 'history' => []]);
}

if ($method !== 'POST') {
    respond(405, ['error' => 'Metode tidak didukung.']);
}
if ($tab === '') {
    respond(400, ['error' => 'Parameter tab wajib diisi.']);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body) || !is_array($body['data'] ?? null)) {
    respond(400, ['error' => 'Data yang dikirim tidak valid.']);
}
$data = $body['data'];
if (!is_array($data['columns'] ?? null) || !is_array($data['records'] ?? null)) {
    respond(400, ['error' => 'Data harus berisi columns dan records.']);
}

$file = tab_file($dir, $tab);
$lock = fopen($file . '.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) {
    respond(500, ['error' => 'Gagal mengunci file penyimpanan.']);
}

$current = read_tab($file);
$currentVersion = (int) ($current['version'] ?? 0);
$baseVersion = (int) ($body['baseVersion'] ?? -1);
if ($baseVersion !== $currentVersion) {
    flock($lock, LOCK_UN);
    respond(409, [
        'error' => 'Data sudah diubah oleh pengguna lain. Muat ulang lalu ulangi perubahan Anda.',
        'version' => $currentVersion,
        'updatedBy' => $current['updatedBy'] ?? null,
        'updatedAt' => $current['updatedAt'] ?? null,
    ]);
}

// Cadangkan versi sebelumnya (simpan 30 terakhir per tab)
if ($current) {
    $backupDir = $dir . DIRECTORY_SEPARATOR . 'backup';
    if (!is_dir($backupDir)) @mkdir($backupDir, 0775, true);
    @copy($file, $backupDir . DIRECTORY_SEPARATOR . 'tab-' . $tab . '_v' . $currentVersion . '_' . date('Ymd-His') . '.json');
    $old = glob($backupDir . DIRECTORY_SEPARATOR . 'tab-' . $tab . '_v*.json') ?: [];
    usort($old, fn($a, $b) => filemtime($b) <=> filemtime($a));
    foreach (array_slice($old, 30) as $f) @unlink($f);
}

$by = mb_substr(trim((string) ($body['by'] ?? '')), 0, 120) ?: 'Tidak diketahui';
$note = mb_substr(trim((string) ($body['note'] ?? '')), 0, 500);
$now = date('c');
$history = is_array($current['history'] ?? null) ? $current['history'] : [];
array_unshift($history, ['at' => $now, 'by' => $by, 'note' => $note, 'version' => $currentVersion + 1]);

$doc = [
    'tab' => $tab,
    'version' => $currentVersion + 1,
    'updatedAt' => $now,
    'updatedBy' => $by,
    'source' => mb_substr((string) ($data['source'] ?? ''), 0, 200),
    'columns' => $data['columns'],
    'records' => $data['records'],
    'history' => array_slice($history, 0, 50),
];

$json = json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$tmp = $file . '.tmp';
if ($json === false || file_put_contents($tmp, $json) === false || !rename($tmp, $file)) {
    flock($lock, LOCK_UN);
    respond(500, ['error' => 'Gagal menyimpan data ke server.']);
}
flock($lock, LOCK_UN);

respond(200, ['ok' => true, 'version' => $doc['version'], 'updatedAt' => $now, 'updatedBy' => $by]);
