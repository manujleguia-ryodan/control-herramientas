from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('const [message, setMessage] = useState("");', 'const [message, setMessage] = useState(""); const [messageType, setMessageType] = useState<"success" | "error">("success");', 1)
s=s.replace('setMessage(text);\n    window.setTimeout', 'setMessageType(isError ? "error" : "success");\n    setMessage(text);\n    window.setTimeout', 1)
s=s.replace('<div className="toast-fallback" role="status">{message}</div>', '<div className={`toast-fallback toast-${messageType}`} role="status">{message}</div>', 1)
p.write_text(s)

p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
s=s.replace('.toast-fallback { position: fixed;', '.toast-fallback { position: fixed;', 1)
s += '.toast-fallback.toast-error { color: #a83f3a; background: #ffefee; border-color: #f2c9c6; border-left-color: var(--red); }\n'
p.write_text(s)
