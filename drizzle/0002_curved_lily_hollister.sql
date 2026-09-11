CREATE TABLE `catalogo_herramientas` (
	`ID_Tag` varchar(100) NOT NULL,
	`Descripcion` text NOT NULL,
	`Marca` varchar(120),
	`Estado_Activo` int NOT NULL DEFAULT 1,
	`Motivo_Baja` text,
	CONSTRAINT `catalogo_herramientas_ID_Tag` PRIMARY KEY(`ID_Tag`)
);
--> statement-breakpoint
CREATE TABLE `catalogo_personal` (
	`Codigo_Trabajador` varchar(80) NOT NULL,
	`Nombre_Completo` varchar(160) NOT NULL,
	`Empresa` varchar(160),
	`Tipo` varchar(40) NOT NULL,
	CONSTRAINT `catalogo_personal_Codigo_Trabajador` PRIMARY KEY(`Codigo_Trabajador`)
);
--> statement-breakpoint
CREATE TABLE `transacciones` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`ID_Tag` varchar(100) NOT NULL,
	`Codigo_Trabajador` varchar(80) NOT NULL,
	`User_Entrega` int NOT NULL,
	`Fecha_Salida` bigint NOT NULL,
	`User_Recibe` int,
	`Fecha_Retorno` bigint,
	CONSTRAINT `transacciones_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`Nombre` varchar(160) NOT NULL,
	`PIN_Hash` varchar(255) NOT NULL,
	`Rol` enum('Admin','Almacen') NOT NULL DEFAULT 'Almacen',
	`Estado` int NOT NULL DEFAULT 1,
	CONSTRAINT `usuarios_ID` PRIMARY KEY(`ID`)
);
--> statement-breakpoint
DROP TABLE `mining_units`;--> statement-breakpoint
DROP TABLE `movements`;--> statement-breakpoint
DROP TABLE `storekeepers`;--> statement-breakpoint
DROP TABLE `tools`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
DROP TABLE `warehouse_locations`;--> statement-breakpoint
DROP TABLE `workers`;