ALTER TABLE `catalogo_herramientas` ADD `Estado_Actual` varchar(50) DEFAULT 'Disponible' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` ADD `Condicion_Actual` varchar(80) DEFAULT 'Completa y operativa' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` ADD `Observacion_Activa` text;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` ADD `Observacion_Fecha` bigint;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` ADD `Observacion_Usuario` int;