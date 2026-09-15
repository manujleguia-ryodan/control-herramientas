from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('const [bulkSelectedLoans, setBulkSelectedLoans] = useState<number[]>([]);\n  const [bulkMode, setBulkMode] = useState<"quick" | "review" | null>(null);', 'const [bulkSelectedLoans, setBulkSelectedLoans] = useState<number[]>([]);\n  const [bulkReviewedLoans, setBulkReviewedLoans] = useState<number[]>([]);\n  const [bulkMode, setBulkMode] = useState<"quick" | "review" | null>(null);', 1)
s=s.replace('onClick={() => setBulkMode("review")}', 'onClick={() => { setBulkReviewedLoans([]); setBulkMode("review"); }}', 1)
s=s.replace('<input type="checkbox" checked readOnly /><span><b>{tool?.code}</b>', '<input type="checkbox" checked={bulkReviewedLoans.includes(loan.id)} onChange={(e) => setBulkReviewedLoans((current) => e.target.checked ? [...current, loan.id] : current.filter((id) => id !== loan.id))} /><span><b>{tool?.code}</b>', 1)
s=s.replace('disabled={bulkReturnMutation.isPending} onClick={() => void doBulkReturn()}', 'disabled={bulkReturnMutation.isPending || bulkReviewedLoans.length !== bulkSelectedLoans.length} onClick={() => void doBulkReturn()}', 1)
p.write_text(s)
