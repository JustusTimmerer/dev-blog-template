"""Exercise the real PHP endpoint against a local mail sink; requires Docker."""
import hashlib
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
    public = Path(__file__).resolve().parents[1] / 'public'
    shutil.copy(public / 'contact.php', root / 'contact.php')
    (root / 'contact-config.php').write_text("<?php return ['recipient' => 'owner@example.invalid', 'sender' => 'sender@example.invalid'];", encoding='utf-8')
    (root / 'mail-sink').write_text('#!/bin/sh\nif [ -f /tmp/mail-fail ]; then exit 1; fi\ncat >> /tmp/outbox\n', encoding='utf-8', newline='\n')
    container = docker('run', '-d', '--rm', '-p', '127.0.0.1::8000', '-v', f'{root}:/app:ro', 'php:8.3-cli', 'php', '-d', 'sendmail_path=sh /app/mail-sink', '-S', '0.0.0.0:8000', '-t', '/app')
    try:
        port = docker('port', container, '8000/tcp').rsplit(':', 1)[1]
        endpoint = f'http://127.0.0.1:{port}/contact.php'
        valid = {'name': 'Jörg', 'email': 'visitor@example.invalid', 'message': 'Hello!\nGrüße 👋', 'website': ''}
        state_path = '/tmp/contact-' + hashlib.sha256(b'/app/contact.php').hexdigest() + '.json'

        def php(source):
            return docker('exec', container, 'php', '-r', source)

        def state_change(source):
            php(f'$p={json.dumps(state_path)}; $s=json_decode(file_get_contents($p),true); {source}; file_put_contents($p,json_encode($s));')

        def request(fields=None, headers=None, method='POST', raw=None):
            data = raw if raw is not None else urllib.parse.urlencode(fields if fields is not None else valid).encode()
            request_headers = {'Content-Type': 'application/x-www-form-urlencoded', 'X-Contact-Form': '1'} if headers is None else headers
            req = urllib.request.Request(endpoint, data=data if method != 'GET' else None, headers=request_headers, method=method)
            try:
                response = urllib.request.urlopen(req, timeout=5)
            except urllib.error.HTTPError as error:
                response = error
            return response.status, response.read(), response.headers

        def expect(status, **kwargs):
            actual, body, headers = request(**kwargs)
            assert actual == status, (status, actual, body)
            assert json.loads(body)['ok'] == (status == 200), body
            assert headers['Cache-Control'] == 'no-store'
            assert 'Set-Cookie' not in headers
            return headers

        for attempt in range(50):
            try:
                expect(405, method='GET')
                break
            except urllib.error.URLError:
                time.sleep(0.1)
        else:
            raise AssertionError('PHP server did not start')

        expect(405, method='OPTIONS')
        expect(403, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        expect(403, headers={'Content-Type': 'application/x-www-form-urlencoded', 'X-Contact-Form': '1', 'Sec-Fetch-Site': 'cross-site'})
        expect(415, headers={'Content-Type': 'application/json', 'X-Contact-Form': '1'})
        expect(413, raw=b'message=' + b'x' * 66000)
        for change in [
            {'email': 'invalid'}, {'email': 'x@example.invalid\r\nBcc: other@example.invalid'},
            {'message': '   '}, {'message': 'x' * 5001}, {'name': 'x' * 101},
            {'name': 'name\nheader'}, {'message': 'bad\x00text'},
        ]:
            expect(422, fields={**valid, **change})
        expect(422, raw=b'email[]=visitor%40example.invalid&message=hello')
        expect(422, raw=b'email=visitor%40example.invalid&message=%FF')
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
        config_response = urllib.request.urlopen(endpoint.replace('contact.php', 'contact-config.php'))
        assert config_response.read() == b''
        # Blank configuration must fail closed, before attempting mail.
        (root / 'contact-config.php').write_text("<?php return ['recipient' => '', 'sender' => ''];", encoding='utf-8')
        expect(503)
        print('PASS: validation, Unicode, browser guards, honeypot, fixed mail headers, rate limits, expiry, mail failure, storage failure, empty configuration; no real email sent.')
    except Exception:
        subprocess.run(['docker', 'logs', container], check=False)
        raise
    finally:
        docker('stop', container)
