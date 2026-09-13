from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/server/_core/index.ts')
s=p.read_text()
s=s.replace('      if (format === "xlsx") return res.download(result.xlsxPath, result.xlsxNombre);\n      return res.download(result.pdfPath, result.pdfNombre);','      if ("xlsxPath" in result) return res.download(result.xlsxPath, result.xlsxNombre);\n      return res.download(result.pdfPath, result.pdfNombre);')
p.write_text(s)
