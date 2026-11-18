<?php
declare(strict_types=1);

// Use the latest patched PHP 8.4 or 8.5. No application sessions or file uploads.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $ok = false): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok]);
    exit;
}

// These checks fail closed if deployment settings were missed. They cannot undo
// work done during PHP startup and are NOT a replacement for runtime patches.
$supportedRuntime = (PHP_VERSION_ID >= 80427 && PHP_VERSION_ID < 80500)
    || (PHP_VERSION_ID >= 80512 && PHP_VERSION_ID < 80600);
if (!$supportedRuntime || preg_match('/(?:dev|alpha|beta|RC)/i', PHP_VERSION)
    || strtoupper((string) ini_get('variables_order')) !== 'S'
    || ini_parse_quantity((string) ini_get('post_max_size')) <= 0
    || ini_parse_quantity((string) ini_get('post_max_size')) > 65536) {
    respond(503);
}
foreach (['enable_post_data_reading', 'file_uploads', 'session.upload_progress.enabled',
    'session.auto_start', 'allow_url_fopen', 'allow_url_include', 'display_errors',
    'display_startup_errors', 'expose_php'] as $setting) {
    if (filter_var(ini_get($setting), FILTER_VALIDATE_BOOLEAN)) {
        respond(503);
    }
}
// A non-sensitive readiness marker: the startup-setting checks above passed.
header('X-Contact-Policy: 2');
if (($_SERVER['QUERY_STRING'] ?? '') !== '' || ($_SERVER['PATH_INFO'] ?? '') !== '') {
    respond(400);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405);
}
// Cross-origin browsers cannot supply this header without a successful preflight.
// No CORS headers are granted. This is a browser guard, not bot authentication.
if (($_SERVER['HTTP_X_CONTACT_FORM'] ?? '') !== '1'
    || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
    respond(403);
}
if (!preg_match('/\Aapplication\/x-www-form-urlencoded(?:\s*;\s*charset=UTF-8)?\s*\z/i', $_SERVER['CONTENT_TYPE'] ?? '')
    || ($_SERVER['HTTP_CONTENT_ENCODING'] ?? '') !== '') {
    respond(415);
}
// URL encoding can use up to twelve bytes per Unicode character.
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 65536) {
    respond(413);
}
$raw = file_get_contents('php://input', false, null, 0, 65537);
if ($raw === false || strlen($raw) > 65536) {
    respond(413);
}
// Decode exactly four flat fields; never allocate nested arrays from field names.
$pairs = explode('&', $raw);
if (count($pairs) > 4 || preg_match('/%(?![0-9a-f]{2})/i', $raw)) {
    respond(422);
}
$fields = [];
foreach ($pairs as $pair) {
    $parts = explode('=', $pair, 2);
    $key = urldecode($parts[0]);
    if (count($parts) !== 2 || !in_array($key, ['name', 'email', 'message', 'website'], true)
        || array_key_exists($key, $fields)) {
        respond(422);
    }
    $fields[$key] = urldecode($parts[1]);
}
$name = trim($fields['name'] ?? '');
$email = trim($fields['email'] ?? '');
$message = trim($fields['message'] ?? '');

if (trim($fields['website'] ?? '') !== '') {
    // Silently discard the honeypot, without consuming mail capacity.
    respond(200, true);
}
function validText(string $text, int $maximum): bool
{
    return preg_match('//u', $text) === 1
        && preg_match_all('/./us', $text) <= $maximum
        && !preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', $text);
}
if (!validText($name, 100) || preg_match('/[\r\n]/', $name)
    || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || preg_match('/[\r\n\x00]/', $email)
    || $message === '' || !validText($message, 5000)) {
    respond(422);
}

try {
    $config = require __DIR__ . '/contact-config.php';
    foreach (['recipient', 'sender'] as $key) {
        if (!is_string($config[$key] ?? null)
            || !filter_var($config[$key], FILTER_VALIDATE_EMAIL)
            || preg_match('/[\r\n\x00]/', $config[$key])) {
            respond(503);
        }
    }
    // Only a strictly limited, operator-configured address reaches sendmail's arguments.
    if (!preg_match('/\A[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\z/D', $config['sender'])) {
        respond(503);
    }

    // One bounded state file in a private directory outside the document root.
    // Only keyed IP hashes and timestamps are stored; never messages or email addresses.
    $stateDirectory = sys_get_temp_dir() . '/contact-' . hash('sha256', __DIR__);
    $previousMask = umask(0077);
    if (!is_dir($stateDirectory)) {
        @mkdir($stateDirectory, 0700);
    }
    umask($previousMask);
    if (is_link($stateDirectory) || !is_dir($stateDirectory)
        || (fileperms($stateDirectory) & 0077) !== 0
        || (function_exists('posix_geteuid') && fileowner($stateDirectory) !== posix_geteuid())) {
        respond(503);
    }
    $statePath = $stateDirectory . '/state.json';
    if (is_link($statePath)) {
        respond(503);
    }
    $previousMask = umask(0077);
    $handle = fopen($statePath, 'c+');
    umask($previousMask);
    if ($handle === false || !flock($handle, LOCK_EX | LOCK_NB)) {
        respond(503);
    }
    $stored = stream_get_contents($handle, 16385);
    if ($stored === false || strlen($stored) > 16384) {
        respond(503);
    }
    $now = time();
    $state = $stored === '' ? null : json_decode($stored, true, 512, JSON_THROW_ON_ERROR);
    if ($state === null || ($state['started'] ?? 0) + 3600 <= $now) {
        $state = ['started' => $now, 'key' => bin2hex(random_bytes(32)), 'total' => 0, 'clients' => []];
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        respond(503);
    }
    // Do not trust client-supplied X-Forwarded-For headers.
    $clientKey = hash_hmac('sha256', $ip, $state['key']);
    $client = $state['clients'][$clientKey] ?? ['count' => 0, 'last' => 0];
    if ($state['total'] >= 30 || $client['count'] >= 5 || $client['last'] + 60 > $now) {
        flock($handle, LOCK_UN);
        fclose($handle);
        header('Retry-After: 3600');
        respond(429);
    }
    $state['total']++;
    $state['clients'][$clientKey] = ['count' => $client['count'] + 1, 'last' => $now];
    $encoded = json_encode($state, JSON_THROW_ON_ERROR);
    if (!rewind($handle) || !ftruncate($handle, 0)
        || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
        respond(503);
    }
    flock($handle, LOCK_UN);
    fclose($handle);

    $body = "Name: " . ($name === '' ? '(not provided)' : $name)
        . "\r\nReply email: " . $email . "\r\n\r\n"
        . str_replace(["\r\n", "\r"], "\n", $message);
    $body = chunk_split(base64_encode($body), 76, "\r\n");
    $sent = mail($config['recipient'], 'Website contact message', $body, [
        'From' => $config['sender'],
        'Reply-To' => $email,
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64',
    ], '-f' . $config['sender']);
    respond($sent ? 200 : 503, $sent);
} catch (Throwable $error) {
    // Do not expose configuration, paths or submitted content to the browser.
    respond(503);
}
