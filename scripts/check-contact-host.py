"""Readiness checks only: never submits a deliverable message or attempts an exploit."""
import argparse
import json
import urllib.error
import urllib.parse
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('origin', help='HTTPS site origin, for example https://example.com')
args = parser.parse_args()
site = urllib.parse.urlsplit(args.origin)
if site.scheme != 'https' or not site.netloc or site.username or site.password or site.path not in ['', '/'] or site.query or site.fragment:
    parser.error('Provide only the HTTPS origin, without credentials, path, query or fragment.')
origin = urllib.parse.urlunsplit((site.scheme, site.netloc, '', '', ''))


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None


opener = urllib.request.build_opener(NoRedirects)
checks = [
    ('runtime readiness', '/contact.php', None, {}, 405),
    ('private mail configuration', '/contact-config.php', None, {}, 403),
    ('private PHP configuration', '/php.ini', None, {}, 403),
    ('private per-directory configuration', '/.user.ini', None, {}, 403),
    ('unused query string', '/contact.php?readiness=1', None, {}, 403),
    ('multipart blocked before PHP', '/contact.php', b'', {'Content-Type': 'multipart/form-data; boundary=readiness', 'X-Contact-Form': '1'}, 403),
]
failed = False
for label, path, data, headers, expected in checks:
    request = urllib.request.Request(origin + path, data=data, headers={'User-Agent': 'Contact-readiness-check', **headers})
    try:
        try:
            response = opener.open(request, timeout=15)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            status = response.status
            body = response.read(4096)
            if label == 'runtime readiness':
                try:
                    valid = status == expected and response.headers.get('X-Contact-Policy') == '2' and json.loads(body) == {'ok': False}
                except (ValueError, UnicodeError):
                    valid = False
            else:
                valid = status == expected and response.headers.get('X-Contact-Policy') is None
        print(f'{"PASS" if valid else "FAIL"}: {label} (HTTP {status}, expected {expected})')
        failed |= not valid
    except (urllib.error.URLError, TimeoutError, OSError):
        print(f'FAIL: {label} (connection or TLS error)')
        failed = True
print('These checks do not establish filesystem isolation, all runtime patches, or inbox delivery.')
raise SystemExit(1 if failed else 0)
