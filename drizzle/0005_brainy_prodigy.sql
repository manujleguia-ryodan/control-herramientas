ALTER TABLE `catalogo_herramientas` ADD `Stock` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Descripcion_Herramienta` text;--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Nombre_Trabajador` varchar(160);--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Marcobre_Trabajador` varchar(160);--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Cantidad_Prestada` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `transacciones` ADD `Estado` varchar(30) DEFAULT 'Prestada' NOT NULL;