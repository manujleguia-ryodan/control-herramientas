ALTER TABLE `movimientos` ADD `Condicion` varchar(80);--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Condicion_Salida` varchar(80) DEFAULT 'Completa y operativa' NOT NULL;--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Observacion_Salida` text;--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Condicion_Entrada` varchar(80);--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Observacion_Entrada` text;