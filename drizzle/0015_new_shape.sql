CREATE TABLE `despachos_pendientes` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`Codigo` varchar(12) NOT NULL,
	`Codigo_Trabajador` varchar(80) NOT NULL,
	`ID_Tags` text NOT NULL,
	`User_Entrega` int NOT NULL,
	`Estado` varchar(20) NOT NULL DEFAULT 'PENDIENTE',
	`Firma_Trabajador` text,
	`Creado_At` bigint NOT NULL,
	`Firmado_At` bigint,
	`Confirmado_At` bigint,
	CONSTRAINT `despachos_pendientes_ID` PRIMARY KEY(`ID`),
	CONSTRAINT `despachos_pendientes_codigo_idx` UNIQUE(`Codigo`)
);
