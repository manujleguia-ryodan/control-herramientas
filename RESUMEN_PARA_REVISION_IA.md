# Resumen técnico de Almacén+

## 1. Propósito del aplicativo

**Almacén+ — Control de Almacén** es una aplicación web interna para controlar herramientas serializadas de un almacén físico. Cada herramienta se identifica mediante un `ID_Tag` único. El sistema registra qué herramienta salió, quién la recibió, qué almacenero la entregó, cuándo ocurrió, cuándo fue devuelta y en qué condición se encontraba.

La aplicación está pensada para utilizarse principalmente desde una **PC y una tablet Android**. No solicita correo electrónico ni depende de cuentas externas para el acceso operativo.

> Regla central: cada `ID_Tag` representa una herramienta física individual. No se maneja una cantidad numérica por herramienta.

## 2. Estado actual

El proyecto funcional se llama `control-herramientas`. La interfaz principal se encuentra en `client/src/pages/Home.tsx`. El backend utiliza React, TypeScript, Express, tRPC, Drizzle ORM y una base de datos compatible con MySQL/TiDB mediante `DATABASE_URL`.

Aunque en solicitudes anteriores se mencionó SQLite, el código y la configuración actuales utilizan **MySQL/TiDB remoto**, no una base SQLite local en el equipo del usuario. La aplicación y la base de datos se ejecutan en el entorno del proyecto. Las fotografías y reportes se almacenan en el servidor o en el almacenamiento configurado, no dentro del navegador.

El último checkpoint funcional es:

`c59b2fdc`

## 3. Acceso y usuarios

El acceso es interno y utiliza un selector de usuario más un PIN numérico de cuatro dígitos.

| Elemento | Comportamiento |
|---|---|
| Usuario | Se selecciona desde un menú con usuarios activos. |
| PIN | Tiene exactamente cuatro dígitos numéricos. Se almacena como hash, no como texto plano. |
| Correo | No se solicita. |
| Primer acceso | Si no existe ningún usuario, se permite registrar el primer Administrador. |
| Sesión | Se crea mediante una cookie de sesión interna. |
| Inactividad | La interfaz cierra la sesión después de 15 minutos sin actividad. |
| Roles | `Admin` y `Almacen`. |
| Accesos | La pestaña de administración de usuarios solo aparece para `Admin`. |

El rol **Administrador** puede crear usuarios, eliminar usuarios respetando las validaciones de seguridad, agregar herramientas, importar catálogos, eliminar herramientas fuera de servicio y acceder a la configuración administrativa.

El rol **Almacén** puede operar despachos, recepciones, consultar inventario, registrar bajas operativas y consultar movimientos, pero no puede agregar herramientas ni administrar usuarios.

## 4. Módulos de la interfaz

### 4.1 Despacho rápido

Permite localizar herramientas mediante un buscador con autocompletado. La búsqueda de herramientas utiliza `ID_Tag` o `Descripcion`. La búsqueda de personal utiliza código, nombre o entidad Marcobre.

El usuario debe seleccionar una sugerencia válida. No se permite depender de texto libre para identificar una herramienta o trabajador.

Cuando se selecciona una herramienta, el sistema verifica inmediatamente:

1. Si la herramienta está activa.
2. Si ya tiene un préstamo abierto.
3. Si tiene observaciones históricas registradas.

Si está prestada, se muestra el mensaje:

> **NO DISPONIBLE: Actualmente en custodia de [Nombre del Trabajador]**

En ese caso se bloquean el buscador de personal y el botón de confirmación del despacho.

Si la herramienta tiene antecedentes, se muestra una alerta adicional:

> **Esta herramienta tiene observaciones**

La alerta presenta la observación registrada más reciente y recomienda revisar el historial antes de realizar el préstamo.

Antes de confirmar un despacho, el almacenero puede seleccionar la condición de salida:

- Completa y operativa.
- Incompleta.
- Con pieza faltante.
- Con pieza rota.
- Dañada.
- Requiere revisión.
- Otro.

Cuando se selecciona una condición diferente de **Completa y operativa**, la observación pasa a ser obligatoria.

### 4.2 Préstamos activos

Muestra las transacciones cuya `Fecha_Retorno` todavía es nula. Los préstamos activos se muestran visualmente como pendientes y permiten iniciar el flujo de recepción.

Al recibir una herramienta, se abre un formulario donde el almacenero selecciona la condición de entrada y registra una observación si la herramienta llega incompleta, dañada o con alguna diferencia.

La recepción utiliza las mismas opciones de condición. La observación es obligatoria cuando la condición no es normal.

### 4.3 Registro de movimientos

Es un historial permanente de entradas y salidas. El registro se diseñó como un libro mayor de movimientos: los registros no se borran cuando se elimina un usuario o una herramienta del catálogo.

La tabla muestra:

| Columna | Contenido |
|---|---|
| Fecha | Fecha y hora en zona horaria de Perú. |
| Movimiento | Entrada o Salida. |
| Herramienta | `ID_Tag` y descripción. |
| Trabajador | Código y nombre del trabajador. |
| Responsable | Usuario de almacén que registró el movimiento. |
| Condición | Condición registrada en el evento. |
| Observaciones | Detalle de faltantes, daños o diferencias. |

La búsqueda de movimientos considera fecha, tipo de movimiento, herramienta, trabajador, condición, observación y usuario de almacén. También se pueden utilizar filtros de fecha desde/hasta.

Existe un reporte PDF y un reporte Excel XLSX de movimientos. El XLSX contiene el logotipo de Marcobre, el título **REPORTE DE MOVIMIENTOS**, columnas ordenadas, filtros y encabezados congelados.

### 4.4 Inventario

Muestra las herramientas activas y permite filtrar por:

- Disponibles.
- Prestadas.
- Código `ID_Tag`.
- Descripción.
- Marca.
- Ubicación.

Cada herramienta es un activo serializado. No se permite registrar una cantidad mayor que uno para el mismo `ID_Tag`.

La ficha de inventario muestra la ubicación física con el formato:

`Estante A - Nivel 2`

El Administrador tiene un formulario manual para agregar herramientas. El formulario incluye `ID_Tag`, descripción, marca, estante y nivel. El usuario con rol Almacén no ve este formulario.

El panel también muestra herramientas con mayor rotación, calculada a partir de los movimientos históricos.

### 4.5 Fuera de servicio

Las herramientas fuera de servicio se mueven mediante una baja lógica. No desaparecen inmediatamente del historial.

La baja solicita:

- Herramienta.
- Descripción.
- Usuario de almacén responsable.
- Supervisor responsable.
- Fecha del incidente.
- Motivo obligatorio.
- Hasta cinco fotografías de evidencia.

Las fotografías se comprimen antes de enviarse y se guardan fuera de la base de datos. La herramienta queda con `Estado_Activo = 0` y aparece en la pestaña **Fuera de servicio**.

La pestaña permite filtrar por código, descripción, marca, ubicación, motivo y trabajador responsable.

Desde cada tarjeta fuera de servicio se pueden descargar o regenerar reportes PDF y XLSX. El Administrador también puede eliminar definitivamente una herramienta fuera de servicio, sujeto a las reglas de seguridad. El historial de movimientos se conserva.

### 4.6 Personal

Permite registrar trabajadores propios o contratistas.

Los datos principales son:

- `Codigo_Trabajador`.
- `Nombre_Completo`.
- `Marcobre`.
- `Tipo`.

El Administrador puede retirar personal del catálogo. El historial previo debe conservarse.

### 4.7 Accesos

Esta pestaña solo aparece para el Administrador. Permite crear usuarios de almacén con:

- Nombre.
- PIN numérico de cuatro dígitos.
- Rol `Admin` o `Almacen`.

Los usuarios activos creados en esta pestaña aparecen automáticamente en el selector de inicio de sesión.

## 5. Modelo de datos actual

### 5.1 Tabla `usuarios`

| Campo | Descripción |
|---|---|
| `ID` | Identificador autoincremental. |
| `Nombre` | Nombre del usuario interno. |
| `PIN_Hash` | Hash seguro del PIN de cuatro dígitos. |
| `Rol` | `Admin` o `Almacen`. |
| `Estado` | Estado activo/inactivo. |

### 5.2 Tabla `catalogo_herramientas`

La tabla de herramientas mantiene el modelo serializado solicitado:

| Campo | Descripción |
|---|---|
| `ID_Tag` | Clave primaria y código único de la herramienta. |
| `Descripcion` | Descripción de la herramienta. |
| `Marca` | Marca de la herramienta. |
| `Estado_Activo` | Indica si está activa. |
| `Ubicacion` | Ubicación física, por ejemplo `Estante A - Nivel 2`. |

La cantidad no forma parte del modelo actual. Cada fila equivale a una unidad física.

### 5.3 Tabla `catalogo_personal`

| Campo | Descripción |
|---|---|
| `Codigo_Trabajador` | Clave primaria del trabajador. |
| `Nombre_Completo` | Nombre del trabajador. |
| `Marcobre` | Empresa o entidad del trabajador. |
| `Tipo` | Personal propio o contratista. |

### 5.4 Tabla `transacciones`

| Campo | Descripción |
|---|---|
| `ID` | Identificador de la transacción. |
| `ID_Tag` | Herramienta prestada. |
| `Codigo_Trabajador` | Persona que recibe. |
| `User_Entrega` | Usuario que registra la salida. |
| `Fecha_Salida` | Fecha y hora de despacho. |
| `User_Recibe` | Usuario que registra la devolución. Puede ser nulo. |
| `Fecha_Retorno` | Fecha y hora de devolución. Puede ser nula. |
| `Descripcion_Herramienta` | Copia informativa de la descripción. |
| `Nombre_Trabajador` | Copia informativa del nombre. |
| `Marcobre_Trabajador` | Copia informativa de la entidad. |
| `Estado` | Normalmente `Prestada` o `Devuelto`. |
| `Condicion_Salida` | Condición al entregar. |
| `Observacion_Salida` | Observación al entregar. |
| `Condicion_Entrada` | Condición al devolver. |
| `Observacion_Entrada` | Observación al devolver. |

### 5.5 Tabla `movimientos`

Esta tabla es el historial append-only de entradas y salidas.

| Campo | Descripción |
|---|---|
| `ID` | Identificador del movimiento. |
| `Tipo` | `Entrada` o `Salida`. |
| `ID_Tag` | Herramienta involucrada. |
| `Codigo_Trabajador` | Trabajador relacionado. |
| `User_ID` | Usuario de almacén que registró el evento. |
| `Fecha_Movimiento` | Fecha y hora del evento. |
| `Transaccion_ID` | Transacción relacionada. |
| `Descripcion_Herramienta` | Descripción copiada. |
| `Nombre_Trabajador` | Nombre copiado. |
| `Observacion` | Observación del evento. |
| `Condicion` | Condición del evento. |

### 5.6 Tabla `bajas_herramientas`

| Campo | Descripción |
|---|---|
| `ID` | Identificador de la baja. |
| `ID_Tag` | Herramienta dada de baja. |
| `Motivo` | Motivo de la baja. |
| `Fecha_Incidente` | Fecha del incidente. |
| `Trabajador_Responsable` | Trabajador relacionado. |
| `Usuario_Baja` | Usuario que registra la baja. |
| `Supervisor_Codigo` | Supervisor seleccionado. |
| `PDF_Nombre` | Nombre del reporte generado. |

## 6. Importación masiva

La aplicación permite cargar catálogos mediante CSV y también acepta archivos XLSX desde la interfaz actual.

### CSV de herramientas

Las columnas esperadas son:

```text
ID_Tag,Descripcion,Marca,Estado_Activo,Ubicacion
```

### CSV de personal

Las columnas esperadas son:

```text
Codigo_Trabajador,Nombre_Completo,Marcobre,Tipo
```

La importación está diseñada para agregar o actualizar registros mediante el identificador correspondiente, no para borrar automáticamente todo el catálogo anterior. Los duplicados deben resolverse por la clave única:

- Herramientas: `ID_Tag`.
- Personal: `Codigo_Trabajador`.

Si se repite un identificador dentro de los datos importados, el backend debe rechazarlo o tratarlo como actualización según el flujo del importador. La importación no debe eliminar movimientos históricos.

## 7. API y backend

La API está organizada con tRPC en `server/routers.ts` y consultas auxiliares en `server/db.ts`.

Procedimientos principales:

| Área | Procedimientos relevantes |
|---|---|
| Autenticación | `auth.me`, `auth.status`, `auth.loginOptions`, `auth.registerFirst`, `auth.login`, `auth.logout`. |
| Catálogo | `catalog.snapshot`, `catalog.searchTools`, `catalog.users`, `catalog.createUser`, `catalog.createToolRecord`, `catalog.createPersonal`. |
| Bajas | `catalog.deactivateTool`, `catalog.deleteToolSafely`, `catalog.deleteUserSafely`. |
| Importación | `catalog.importCsv` y rutas multipart para herramientas y personal. |
| Movimientos | `movements.dispatch`, `movements.return`, `movements.create`. |
| Imágenes | `catalog.uploadImage`. |

El backend valida los datos con Zod. Las reglas de seguridad se aplican también en el servidor, no solamente en la interfaz.

## 8. Reglas de negocio importantes

1. Un `ID_Tag` es único.
2. Una herramienta serializada no puede tener dos préstamos activos al mismo tiempo.
3. Una herramienta prestada no puede volver a despacharse.
4. El despacho se bloquea si la herramienta no está disponible.
5. La devolución registra condición y observación.
6. La observación es obligatoria si la condición no es `Completa y operativa`.
7. El movimiento de entrada o salida no se borra del historial.
8. Una baja normal es lógica, no física.
9. La eliminación definitiva de herramientas está restringida al Administrador.
10. El Administrador no puede eliminarse a sí mismo.
11. No se puede eliminar al último Administrador.
12. No se puede eliminar una herramienta con un préstamo activo.
13. Los reportes de bajas incluyen evidencia fotográfica cuando se adjunta.
14. La herramienta dada de baja deja de aparecer en el inventario activo.
15. Las fechas se muestran en zona horaria `America/Lima`.

## 9. Reportes

### Reporte de movimientos

El reporte de movimientos se genera en PDF y XLSX. El Excel contiene:

- Logotipo de Marcobre.
- Título `REPORTE DE MOVIMIENTOS`.
- Fecha y hora de generación.
- Rango de fechas utilizado.
- Fecha y hora del movimiento.
- Tipo de movimiento.
- Condición.
- `ID_Tag`.
- Descripción de herramienta.
- Código y nombre del trabajador.
- Usuario de almacén.
- Observación.
- Filtros de Excel y encabezado congelado.

### Reporte de herramienta fuera de servicio

El reporte de baja se genera en PDF y XLSX. Usa la plantilla proporcionada por el usuario, incluye datos de código, descripción, marca y ubicación, e incorpora las fotografías de evidencia. También incluye el motivo o descripción del evento, supervisor, almacenero y fecha.

El usuario puede revisar una vista previa antes de confirmar la baja y puede regenerar el reporte desde la tarjeta de una herramienta ya fuera de servicio.

## 10. Archivos principales del proyecto

| Archivo | Función |
|---|---|
| `client/src/pages/Home.tsx` | Interfaz principal y flujos operativos. |
| `client/src/index.css` | Estilos visuales y responsive. |
| `server/routers.ts` | Contratos tRPC y permisos. |
| `server/db.ts` | Consultas, transacciones, importaciones y reportes. |
| `drizzle/schema.ts` | Modelo de datos Drizzle. |
| `server/_core/context.ts` | Contexto de sesión interna. |
| `server/internalSession.ts` | Sesiones internas mediante cookie. |
| `server/pinAuth.ts` | Hash y verificación de PIN. |
| `server/_core/index.ts` | Arranque de Express y rutas multipart. |
| `server/templates/` | Plantillas y logotipo para reportes. |
| `client/public/icon-inventory.svg` | Ícono de la aplicación. |

## 11. Validación actual

La última validación ejecutada fue satisfactoria:

```text
14 pruebas Vitest aprobadas
TypeScript sin errores
Build de producción exitoso
Servidor de desarrollo activo
Migraciones no destructivas aplicadas
```

El flujo más recientemente añadido fue el registro de **condición y observación** en entradas y salidas, junto con la columna de observaciones en movimientos y la alerta previa al préstamo.

## 12. Puntos que otra IA debería revisar

Si otra IA va a auditar o continuar el proyecto, debería revisar primero estos puntos:

1. Confirmar que las columnas de condición y observación existan realmente en la base de datos remota y coincidan con `drizzle/schema.ts`.
2. Confirmar que todos los endpoints de despacho y devolución guarden los campos de salida y entrada en una transacción atómica.
3. Verificar que la alerta de observaciones muestre el registro correcto y no confunda una observación de salida con una de entrada.
4. Confirmar que el importador de CSV/XLSX preserve registros anteriores y documente claramente el tratamiento de duplicados.
5. Revisar que las rutas multipart de fotografías no guarden archivos grandes dentro de SQLite/MySQL.
6. Probar en tablet el tamaño de los botones, tablas, modales y formularios.
7. Verificar que las descargas PDF y XLSX funcionen desde Chrome Android y desde un navegador de PC.
8. Revisar las reglas de eliminación definitiva, especialmente la conservación del historial.
9. Confirmar respaldos periódicos de la base de datos y de la carpeta de reportes/fotografías.
10. Evaluar si se debe registrar una auditoría adicional para modificaciones de catálogos, no solo para movimientos.

## 13. Prompt listo para enviar a otra IA

```text
Actúa como auditor y desarrollador Full-Stack senior. Revisa una aplicación interna llamada Almacén+ — Control de Almacén.

La aplicación controla herramientas serializadas de un almacén físico. Cada herramienta tiene un ID_Tag único y representa una unidad física. El sistema registra despachos, devoluciones, usuarios de almacén, trabajadores, ubicación, condición y observaciones.

La aplicación utiliza React + TypeScript en frontend, Express + tRPC en backend, Drizzle ORM y MySQL/TiDB mediante DATABASE_URL. No usa correo electrónico ni OAuth para el acceso operativo. El acceso es mediante selector de usuario y PIN de cuatro dígitos. Hay dos roles: Admin y Almacen.

Módulos actuales: Despacho rápido, Préstamos activos, Registro de movimientos, Inventario, Fuera de servicio, Personal y Accesos.

Reglas principales:
- Un ID_Tag no puede tener dos préstamos activos.
- Una herramienta prestada no se puede volver a despachar.
- El despacho consulta disponibilidad antes de permitir seleccionar al trabajador.
- Si la herramienta tiene observaciones históricas, debe mostrarse una alerta antes del préstamo.
- La condición puede ser Completa y operativa, Incompleta, Con pieza faltante, Con pieza rota, Dañada, Requiere revisión u Otro.
- Si la condición no es Completa y operativa, la observación es obligatoria.
- Las entradas y salidas se guardan en un historial permanente que no debe borrarse.
- Las bajas de herramientas son lógicas y requieren motivo, fecha, supervisor, almacenero y evidencia fotográfica opcional.
- Solo el Administrador puede crear herramientas, administrar usuarios, importar catálogos y eliminar definitivamente herramientas fuera de servicio.

Tablas principales:
- usuarios: ID, Nombre, PIN_Hash, Rol, Estado.
- catalogo_herramientas: ID_Tag, Descripcion, Marca, Estado_Activo, Ubicacion.
- catalogo_personal: Codigo_Trabajador, Nombre_Completo, Marcobre, Tipo.
- transacciones: salida, retorno, usuario que entrega, usuario que recibe, condición y observaciones de salida/entrada.
- movimientos: historial append-only de Entrada/Salida con condición y observación.
- bajas_herramientas: motivo, fecha, supervisor, almacenero y nombre del PDF.

CSV de herramientas:
ID_Tag,Descripcion,Marca,Estado_Activo,Ubicacion

CSV de personal:
Codigo_Trabajador,Nombre_Completo,Marcobre,Tipo

Revisa especialmente:
1. Integridad de las transacciones y bloqueo de préstamos duplicados.
2. Consistencia entre el esquema Drizzle y la base de datos real.
3. Tratamiento de duplicados al importar CSV/XLSX.
4. Persistencia de observaciones y condiciones en salidas, entradas, historial y reportes.
5. Seguridad de roles y permisos.
6. Conservación del historial al eliminar usuarios o herramientas.
7. Funcionamiento de reportes PDF/XLSX con logo y fotografías.
8. Experiencia de uso en PC y tablet Android.
9. Respaldos de base de datos, fotografías y reportes.
10. Errores potenciales, deuda técnica y mejoras prioritarias.

Entrega el resultado como una auditoría técnica con: hallazgos críticos, riesgos, pruebas recomendadas, correcciones propuestas y valoración general.
```

## Referencias

[1]: https://manus-webdev://c59b2fdc "Checkpoint funcional de Almacén+ con observaciones visibles y alerta previa al préstamo"
