from pathlib import Path
s=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx').read_text()
print(repr(s[s.find('Evidencias fotográficas')-100:s.find('function LoginScreen')]))
