"""Exercise the real PHP endpoint against a local mail sink; requires Docker."""
import hashlib
import http.client
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()


with tempfile.TemporaryDirectory(prefix='contact-handler-') as directory:
    root = Path(directory)
    source = Path(__file__).resolve().parents[1] / 'server'
    shutil.copy(source / 'contact.php', root / 'contact.php')
    (root / 'contact-config.php').write_text("<?php return ['recipient' => 'owner@example.invalid', 'sender' => 'sender@example.invalid'];", encoding='utf-8')
    (root / 'mail-sink').write_text('#!/bin/sh\nif [ -f /tmp/mail-fail ]; then exit 1; fi\ncat >> /tmp/outbox\n', encoding='utf-8', newline='\n')
    (root / 'php.ini').write_text((source / 'php.ini').read_text() + '\nsendmail_path="sh /opt/mail-sink"\nauto_prepend_file=/opt/probe.php\n', encoding='utf-8', newline='\n')
    (root / 'probe.php').write_text('<?php file_put_contents("/tmp/php-started", "1", FILE_APPEND);', encoding='utf-8')
    (root / 'apache.conf').write_text('<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>\n', encoding='utf-8', newline='\n')
    (root / '.htaccess').write_text('RewriteEngine On\n' + (source / 'contact.htaccess').read_text() + '\n' + (source / 'static.htaccess').read_text(), encoding='utf-8', newline='\n')
    (root / 'index.html').write_text('Static site', encoding='utf-8')
    (root / 'legacy.php').write_text('<?php echo "should never execute";', encoding='utf-8')
    container = docker('run', '-d', '--rm', '-p', '127.0.0.1::80',
        '-v', f'{root}:/var/www/html:ro',
        '-v', f'{root / "php.ini"}:/usr/local/etc/php/conf.d/zz-contact.ini:ro',
        '-v', f'{root / "apache.conf"}:/etc/apache2/conf-enabled/contact.conf:ro',
        '-v', f'{root / "mail-sink"}:/opt/mail-sink:ro',
        '-v', f'{root / "probe.php"}:/opt/probe.php:ro',
        'php:8.4-apache', 'bash', '-c', 'a2enmod rewrite >/dev/null && apache2-foreground')
    try:
        port = docker('port', container, '80/tcp').rsplit(':', 1)[1]
        endpoint = f'http://127.0.0.1:{port}/contact.php'
        valid = {'name': 'Jörg', 'email': 'visitor@example.invalid', 'message': 'Hello!\nGrüße 👋', 'website': ''}
        state_directory = '/tmp/contact-' + hashlib.sha256(b'/var/www/html').hexdigest()
        state_path = state_directory + '/state.json'

        def php(source):
            return docker('exec', container, 'php', '-r', source)

        def state_change(source):
            php(f'$p={json.dumps(state_path)}; $s=json_decode(file_get_contents($p),true); {source}; file_put_contents($p,json_encode($s));')

        def request(fields=None, headers=None, method='POST', raw=None, path=None):
            data = raw if raw is not None else urllib.parse.urlencode(fields if fields is not None else valid).encode()
            request_headers = {'Content-Type': 'application/x-www-form-urlencoded', 'X-Contact-Form': '1'} if headers is None else headers
            req = urllib.request.Request(endpoint if path is None else f'http://127.0.0.1:{port}' + path, data=data if method != 'GET' else None, headers=request_headers, method=method)
            try:
                response = urllib.request.urlopen(req, timeout=5)
            except urllib.error.HTTPError as error:
                response = error
            return response.status, response.read(), response.headers

        def expect(status, php_response=True, **kwargs):
            actual, body, headers = request(**kwargs)
            assert actual == status, (status, actual, body)
            if php_response:
                assert json.loads(body)['ok'] == (status == 200), body
                assert headers['Cache-Control'] == 'no-store'
            assert 'Set-Cookie' not in headers
            assert 'X-Powered-By' not in headers
            return headers

        for attempt in range(50):
            try:
                expect(405, method='GET')
                break
            except (urllib.error.URLError, ConnectionResetError):
                time.sleep(0.1)
        else:
            raise AssertionError('PHP server did not start')

        before = php('echo file_get_contents("/tmp/php-started");')
        expect(403, php_response=False, method='OPTIONS')
        expect(403, php_response=False, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        expect(403, php_response=False, headers={'Content-Type': 'multipart/form-data; boundary=test', 'X-Contact-Form': '1'})
        expect(403, php_response=False, headers={'Content-Type': 'application/json', 'X-Contact-Form': '1'})
        expect(403, php_response=False, headers={'Content-Type': 'application/x-www-form-urlencoded', 'Content-Encoding': 'gzip', 'X-Contact-Form': '1'})
        for path in ['/contact.php?unused=1', '/contact-config.php', '/php.ini', '/.user.ini', '/legacy.php', '/contact.php/extra']:
            expect(403, php_response=False, method='GET', path=path)
        assert before == php('echo file_get_contents("/tmp/php-started");'), 'Rejected requests must not start PHP'
        expect(403, headers={'Content-Type': 'application/x-www-form-urlencoded', 'X-Contact-Form': '1', 'Sec-Fetch-Site': 'cross-site'})
        expect(413, php_response=False, raw=b'message=' + b'x' * 66000)
        # Apache also limits decoded chunked bodies; no Content-Length is needed.
        connection = http.client.HTTPConnection('127.0.0.1', int(port), timeout=5)
        connection.request('POST', '/contact.php', body=iter([b'message=' + b'x' * 66000]), headers={'Content-Type': 'application/x-www-form-urlencoded', 'X-Contact-Form': '1'}, encode_chunked=True)
        chunked = connection.getresponse()
        assert chunked.status == 413, chunked.status
        chunked.read()
        connection.close()
        for change in [
            {'email': 'invalid'}, {'email': 'x@example.invalid\r\nBcc: other@example.invalid'},
            {'message': '   '}, {'message': 'x' * 5001}, {'name': 'x' * 101},
            {'name': 'name\nheader'}, {'message': 'bad\x00text'},
        ]:
            expect(422, fields={**valid, **change})
        expect(422, raw=b'email[]=visitor%40example.invalid&message=hello')
        expect(422, raw=b'email=visitor%40example.invalid&message=%FF')
        expect(422, raw=b'email=visitor%40example.invalid&message=first&message=second')
        expect(422, raw=b'email=visitor%40example.invalid&message=hello&unexpected=1')
        expect(422, raw=b'email=visitor%40example.invalid&message=%XY')
        expect(422, raw=b'email=visitor%40example.invalid&message[a][b]=hello')
        expect(422, raw=b'name=a&email=visitor%40example.invalid&message=b&website=&extra=c')
        expect(200, fields={**valid, 'website': 'https://spam.invalid'})
        assert php('echo file_exists("/tmp/outbox") ? "sent" : "empty";') == 'empty'

        expect(200)
        mail = php('echo file_get_contents("/tmp/outbox");')
        assert 'To: owner@example.invalid' in mail
        assert 'From: sender@example.invalid' in mail
        assert 'Reply-To: visitor@example.invalid' in mail
        assert 'Bcc:' not in mail
        import base64
        body = base64.b64decode(mail.replace('\r\n', '\n').split('\n\n', 1)[1]).decode()
        assert 'Grüße 👋' in body and 'Name: Jörg' in body
        stored = php(f'echo file_get_contents({json.dumps(state_path)});')
        assert 'visitor' not in stored and 'Hello' not in stored and '172.' not in stored
        assert expect(429)['Retry-After'] == '3600'
        assert php(f'echo decoct(fileperms({json.dumps(state_directory)}) & 0777);') == '700'
        assert php(f'echo decoct(fileperms({json.dumps(state_path)}) & 0777);') == '600'

        for _ in range(4):
            state_change('foreach ($s["clients"] as &$c) { $c["last"] = 0; }')
            expect(200)
        state_change('foreach ($s["clients"] as &$c) { $c["last"] = 0; }')
        expect(429)
        state_change('$s["clients"] = []; $s["total"] = 30')
        expect(429)
        state_change('$s["started"] = time() - 3601')
        expect(200, fields={**valid, 'name': '', 'message': '😀' * 5000})
        state_change('$s["started"] = time() - 3601')
        php('touch("/tmp/mail-fail");')
        expect(503)
        state_change('$s["started"] = time() - 3601')
        php('unlink("/tmp/mail-fail");')
        expect(200)
        php(f'file_put_contents({json.dumps(state_path)}, "invalid JSON");')
        expect(503)
        # Blank configuration must fail closed, before attempting mail.
        (root / 'contact-config.php').write_text("<?php return ['recipient' => '', 'sender' => ''];", encoding='utf-8')
        expect(503)
        for setting in ['enable_post_data_reading=1', 'file_uploads=1', 'session.upload_progress.enabled=1', 'variables_order=GPCS', 'post_max_size=8M']:
            output = docker('exec', container, 'php', '-d', setting, '-r', 'register_shutdown_function(function(){echo http_response_code();}); include "/var/www/html/contact.php";')
            assert output.endswith('503'), (setting, output)
        assert request(method='GET', path='/')[0] == 200
        # Disabling contact must deny old PHP files even if FTP left them behind.
        (root / '.htaccess').write_text('RewriteEngine On\n' + (source / 'static.htaccess').read_text(), encoding='utf-8', newline='\n')
        expect(403, php_response=False, method='GET')
        assert request(method='GET', path='/')[0] == 200
        print('PASS: Apache pre-PHP rejection, body limits including chunked requests, strict flat fields, Unicode, mail headers, rate limits, private storage, runtime configuration checks, and disabled-contact rules; no real email sent.')
    except Exception:
        subprocess.run(['docker', 'logs', container], check=False)
        raise
    finally:
        docker('stop', container)
