CREATE TABLE `resoluciones_observaciones` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`ID_Tag` varchar(100) NOT NULL,
	`Observacion_Anterior` text NOT NULL,
	`Condicion_Anterior` varchar(80),
	`Comentario_Resolucion` text NOT NULL,
	`Fecha_Resolucion` bigint NOT NULL,
	`Usuario_Resolucion` int NOT NULL,
	`Transaccion_ID` int,
	CONSTRAINT `resoluciones_observaciones_ID` PRIMARY KEY(`ID`)
);
