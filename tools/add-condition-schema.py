from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/drizzle/schema.ts')
s=p.read_text()
s=s.replace('''  estado: varchar("Estado", { length: 30 }).default("Prestada").notNull(),
});''','''  estado: varchar("Estado", { length: 30 }).default("Prestada").notNull(),
  condicionSalida: varchar("Condicion_Salida", { length: 80 }).default("Completa y operativa").notNull(),
  observacionSalida: text("Observacion_Salida"),
  condicionEntrada: varchar("Condicion_Entrada", { length: 80 }),
  observacionEntrada: text("Observacion_Entrada"),
});''')
s=s.replace('''  observacion: text("Observacion"),
});''','''  observacion: text("Observacion"),
  condicion: varchar("Condicion", { length: 80 }),
});''')
p.write_text(s)
