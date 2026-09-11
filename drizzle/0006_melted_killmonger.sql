CREATE TABLE `movimientos` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`Tipo` enum('Entrada','Salida') NOT NULL,
	`ID_Tag` varchar(100) NOT NULL,
	`Codigo_Trabajador` varchar(80),
	`User_ID` int NOT NULL,
	`Cantidad` int NOT NULL,
	`Fecha_Movimiento` bigint NOT NULL,
	`Transaccion_ID` int,
	`Descripcion_Herramienta` text,
	`Nombre_Trabajador` varchar(160),
	`Observacion` text,
	CONSTRAINT `movimientos_ID` PRIMARY KEY(`ID`)
);
