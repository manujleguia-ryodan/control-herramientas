from pathlib import Path
s=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx').read_text()
i=s.find('<p><b>{modalTool.code}')
print(i)
print(s[i:i+2200])
print('TYPEAHEAD')
i=s.find('function Typeahead')
print(s[i:i+1000])
