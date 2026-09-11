CREATE TABLE `bajas_herramientas` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`ID_Tag` varchar(100) NOT NULL,
	`Motivo` text NOT NULL,
	`Fecha_Incidente` bigint NOT NULL,
	`Trabajador_Responsable` varchar(160) NOT NULL,
	`Usuario_Baja` int NOT NULL,
	CONSTRAINT `bajas_herramientas_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` DROP COLUMN `Motivo_Baja`;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` DROP COLUMN `Fecha_Incidente`;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` DROP COLUMN `Trabajador_Responsable`;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` DROP COLUMN `Usuario_Baja`;--> statement-breakpoint
ALTER TABLE `catalogo_herramientas` DROP COLUMN `Stock`;--> statement-breakpoint
ALTER TABLE `movimientos` DROP COLUMN `Cantidad`;--> statement-breakpoint
ALTER TABLE `transacciones` DROP COLUMN `Cantidad_Prestada`;