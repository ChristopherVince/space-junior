import json
import os
import subprocess
import urllib.error
import urllib.request

env = dict(os.environ, GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never')
credenciales = subprocess.run(['git', 'credential', 'fill'], input='protocol=https\nhost=github.com\n\n',
                              text=True, capture_output=True, env=env, timeout=15)
if credenciales.returncode:
    print('No hay credenciales GitHub disponibles sin interacción')
    raise SystemExit(1)
cred = dict(line.split('=', 1) for line in credenciales.stdout.splitlines() if '=' in line)
clave = cred.get('password')
if not clave:
    print('No hay credenciales GitHub disponibles sin interacción')
    raise SystemExit(1)
for numero in (9, 16, 17, 19):
    solicitud = urllib.request.Request(f'https://api.github.com/repos/ChristopherVince/space-junior/issues/{numero}',
                                     headers={'User-Agent': 'SpaceJunior', 'Authorization': 'Bearer ' + clave,
                                              'Accept': 'application/vnd.github+json'})
    try:
        with urllib.request.urlopen(solicitud, timeout=15) as respuesta:
            issue = json.load(respuesta)
        print(numero, issue['title'], 'autor:', issue['user']['login'], 'responsables:', ','.join(a['login'] for a in issue['assignees']))
    except urllib.error.HTTPError as exc:
        print(numero, 'HTTP', exc.code)
