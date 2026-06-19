CREATE DATABASE  IF NOT EXISTS `req_danli` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `req_danli`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: req_danli
-- ------------------------------------------------------
-- Server version	9.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '77ab8c8b-53c1-11f1-9737-b82a72c57aed:1-1146';

--
-- Table structure for table `activos_asignaciones`
--

DROP TABLE IF EXISTS `activos_asignaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activos_asignaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activo_id` int NOT NULL,
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Custodio responsable. FK lógica a rrhh_danli.',
  `departamento_id` int NOT NULL COMMENT 'Departamento al que pertenecía en ese período. FK lógica.',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL COMMENT 'NULL = custodio actual. Se cierra al registrar un traslado.',
  `motivo_asignacion` varchar(200) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Ej. Asignación inicial, Traslado NT-00012',
  `registrado_por` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_activo` (`activo_id`),
  KEY `idx_empleado` (`empleado_dni`),
  KEY `idx_departamento` (`departamento_id`),
  KEY `idx_fecha_fin` (`fecha_fin`),
  CONSTRAINT `fk_aa_activo` FOREIGN KEY (`activo_id`) REFERENCES `activos_fijos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Historial de custodios de cada activo. fecha_fin NULL = custodio actual. Sin devolución.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activos_asignaciones`
--

LOCK TABLES `activos_asignaciones` WRITE;
/*!40000 ALTER TABLE `activos_asignaciones` DISABLE KEYS */;
INSERT INTO `activos_asignaciones` VALUES (1,1,'0801-1987-01467',4,'2023-03-15',NULL,'Asignación inicial — Jefe de TI','0801-1987-01467'),(2,4,'0801-1987-01467',4,'2026-05-10',NULL,'Asignación inicial — Adquirido con OC-080000','0801-1987-01467'),(3,5,'0801-1987-01467',4,'2026-05-10',NULL,'Asignación inicial — Adquirido con OC-080000','0801-1987-01467'),(4,6,'0801-1987-01467',4,'2022-11-20',NULL,'Asignación inicial — Servidor institucional','0801-1987-01467'),(5,7,'0801-1987-01467',4,'2026-05-22',NULL,'Asignación inicial — Adquirido con OC-079973','0801-1987-01467');
/*!40000 ALTER TABLE `activos_asignaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activos_fijos`
--

DROP TABLE IF EXISTS `activos_fijos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activos_fijos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_inventario` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Generado por sp_siguiente_numero_inv(). Nunca cambia aunque el activo se traslade.',
  `descripcion` text COLLATE utf8mb4_spanish_ci NOT NULL,
  `categoria_id` int DEFAULT NULL,
  `departamento_id` int NOT NULL COMMENT 'Departamento actual. Se actualiza al registrar un traslado.',
  `custodio_dni` varchar(15) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Empleado actualmente responsable del activo. FK lógica a rrhh_danli.',
  `orden_compra_id` int DEFAULT NULL COMMENT 'OC con la que fue adquirido',
  `marca` varchar(80) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `modelo` varchar(80) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `serie` varchar(80) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `fecha_adquisicion` date DEFAULT NULL,
  `valor_adquisicion` decimal(14,2) DEFAULT NULL,
  `valor_actual` decimal(14,2) DEFAULT NULL COMMENT 'Valor depreciado. Calculado externamente.',
  `ubicacion` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Descripción física: ej. Oficina TI - 2do piso',
  `estado` enum('bueno','regular','malo','en_reparacion','dado_de_baja') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'bueno',
  `observaciones` text COLLATE utf8mb4_spanish_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_numero_inventario` (`numero_inventario`),
  KEY `idx_categoria` (`categoria_id`),
  KEY `idx_departamento` (`departamento_id`),
  KEY `idx_custodio` (`custodio_dni`),
  KEY `idx_estado` (`estado`),
  KEY `fk_af_oc` (`orden_compra_id`),
  CONSTRAINT `fk_af_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_activos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_af_oc` FOREIGN KEY (`orden_compra_id`) REFERENCES `ordenes_compra` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Inventario de activos fijos. numero_inventario no cambia nunca.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activos_fijos`
--

LOCK TABLES `activos_fijos` WRITE;
/*!40000 ALTER TABLE `activos_fijos` DISABLE KEYS */;
INSERT INTO `activos_fijos` VALUES (1,'INV-00001','Computadora de escritorio all-in-one',1,4,'0801-1987-01467',NULL,'HP','ProOne 400 G6','MXL1234567','2023-03-15',18500.00,NULL,'Oficina TI - Escritorio 1','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(2,'INV-00002','Laptop ejecutiva',1,1,NULL,NULL,'Dell','Latitude 5520','DLLAT55XY','2022-08-10',25000.00,NULL,'Gerencia Administrativa','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(3,'INV-00003','Impresora multifunción láser',1,5,NULL,NULL,'HP','LaserJet M428','VND9876543','2021-06-01',12000.00,NULL,'Departamento de Compras','regular',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(4,'INV-00004','Switch de red 24 puertos',3,4,'0801-1987-01467',2,'Cisco','SG250-26','FOC2412L9X','2026-05-10',3622.00,NULL,'Rack - Sala de servidores','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(5,'INV-00005','Switch de red 8 puertos (x2)',3,4,'0801-1987-01467',2,'TP-Link','TL-SG108','TPL2024001','2026-05-10',1478.00,NULL,'Tesorería y Aud. Fiscales','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(6,'INV-00006','Servidor de archivos',1,4,'0801-1987-01467',NULL,'Dell','PowerEdge T150','SRVD2022XZ','2022-11-20',55000.00,NULL,'Sala de servidores','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(7,'INV-00007','UPS / Estación de energía portátil',4,4,'0801-1987-01467',1,'EcoFlow','DELTA 3 Plus','ECF2026001','2026-05-22',20865.22,NULL,'Sala de servidores','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(8,'INV-00008','Escritorio ejecutivo madera',2,1,NULL,NULL,'Artmetal','Serie 200','','2020-01-10',8500.00,NULL,'Alcaldía - Oficina principal','bueno',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(9,'INV-00009','Silla giratoria ejecutiva',2,1,NULL,NULL,'Vartika','Manager Pro','','2020-01-10',3200.00,NULL,'Alcaldía - Oficina principal','regular',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(10,'INV-00010','Fotocopiadora multifunción A3',4,5,NULL,NULL,'Ricoh','MP 2014D','RCH20192KL','2019-07-15',35000.00,NULL,'Departamento de Compras','regular',NULL,'2026-06-03 21:06:41','2026-06-03 21:06:41');
/*!40000 ALTER TABLE `activos_fijos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activos_traslados`
--

DROP TABLE IF EXISTS `activos_traslados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activos_traslados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_nota` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Ej. NT-00001. Generado por sp_siguiente_numero_traslado().',
  `activo_id` int NOT NULL,
  `departamento_origen_id` int NOT NULL COMMENT 'Departamento que entrega el activo. FK lógica.',
  `custodio_origen_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Empleado que entrega. FK lógica.',
  `departamento_destino_id` int NOT NULL COMMENT 'Departamento que recibe el activo. FK lógica.',
  `custodio_destino_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Empleado que recibe. FK lógica.',
  `motivo` text COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Justificación del traslado',
  `autorizado_por_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'Quien autorizó el traslado (jefe de bienes o admin)',
  `fecha_traslado` date NOT NULL,
  `registrado_por` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_numero_nota` (`numero_nota`),
  KEY `idx_activo` (`activo_id`),
  KEY `idx_dept_origen` (`departamento_origen_id`),
  KEY `idx_dept_destino` (`departamento_destino_id`),
  KEY `idx_fecha_traslado` (`fecha_traslado`),
  CONSTRAINT `fk_at_activo` FOREIGN KEY (`activo_id`) REFERENCES `activos_fijos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Notas de traslado de activos entre departamentos. El número de inventario no cambia.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activos_traslados`
--

LOCK TABLES `activos_traslados` WRITE;
/*!40000 ALTER TABLE `activos_traslados` DISABLE KEYS */;
/*!40000 ALTER TABLE `activos_traslados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tabla_afectada` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL,
  `registro_id` int DEFAULT NULL,
  `accion` enum('crear','editar','aprobar','rechazar','anular','login','logout','config','inventario') COLLATE utf8mb4_spanish_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_spanish_ci NOT NULL,
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tabla` (`tabla_afectada`),
  KEY `idx_accion` (`accion`),
  KEY `idx_empleado` (`empleado_dni`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Auditoría inmutable. Solo INSERT.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
INSERT INTO `bitacora` VALUES (1,'usuarios',1,'login','Inicio de sesión exitoso — usuario: ngarcia','0801-1987-01467','10.30.136.50','2026-05-10 08:00:00'),(2,'solicitudes',1,'crear','Solicitud SOL-2026-001 creada — tipo: cotizacion','0801-1987-01467','10.30.136.50','2026-05-10 08:30:00'),(3,'solicitudes',1,'editar','Solicitud SOL-2026-001 respondida — PDF adjunto','0801-1985-67890','10.30.136.30','2026-05-12 14:00:00'),(4,'requisiciones',1,'crear','Requisición R-91300 creada por Néstor García / UMI','0801-1987-01467','10.30.136.50','2026-05-13 09:00:00'),(5,'requisiciones',1,'aprobar','Requisición R-91300 aprobada por Gerencia Administrativa','0801-1975-22222','10.30.136.20','2026-05-14 11:30:00'),(6,'ordenes_compra',1,'crear','OC-079973 generada desde R-91306 / Proveedor: Jetstereo','0801-1985-67890','10.30.136.30','2026-05-22 00:00:00'),(7,'ordenes_compra',1,'editar','OC-079973 marcada como entregada','0801-1985-67890','10.30.136.30','2026-05-24 14:00:00'),(8,'requisiciones',8,'rechazar','Requisición R-91307 rechazada — sin partida presupuestaria','0801-1975-22222','10.30.136.20','2026-05-16 08:00:00'),(9,'requisiciones',9,'anular','Requisición R-91308 anulada por administrador — duplicado','0801-1987-01467','10.30.136.50','2026-05-17 12:00:00'),(10,'configuracion',1,'config','Configuración actualizada — jefe_bienes_nombre modificado','0801-1987-01467','10.30.136.50','2026-05-25 08:00:00'),(11,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-16 01:16:55'),(12,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-16 14:12:37'),(13,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-16 21:09:16'),(14,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-17 00:39:01'),(15,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-17 00:52:35'),(16,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-17 01:05:03'),(17,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-17 02:45:51'),(18,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-17 02:58:17'),(19,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-18 15:26:48'),(20,'solicitudes',6,'crear','Solicitud SOL-2026-010 creada - tipo: cotizacion','0801-1987-01467','::1','2026-06-18 20:11:57'),(21,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-18 23:58:27'),(22,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-19 00:21:31'),(23,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-19 02:01:31'),(24,'usuarios',3,'login','Inicio de sesión exitoso - usuario: jayestas','0801-1985-67890','::1','2026-06-19 02:03:51'),(25,'usuarios',3,'login','Inicio de sesión exitoso - usuario: jayestas','0801-1985-67890','::1','2026-06-19 02:31:13'),(26,'usuarios',5,'login','Inicio de sesión exitoso - usuario: mfsauceda','0801-1975-22222','::1','2026-06-19 02:32:20'),(27,'usuarios',6,'login','Inicio de sesión exitoso - usuario: akafati','0801-1970-33333','::1','2026-06-19 02:32:42'),(28,'usuarios',4,'login','Inicio de sesión exitoso - usuario: mrodriguez','0801-1988-11111','::1','2026-06-19 02:33:07'),(29,'usuarios',2,'login','Inicio de sesión exitoso - usuario: jlopez','0801-1990-12345','::1','2026-06-19 02:33:28'),(30,'usuarios',2,'login','Inicio de sesión exitoso - usuario: jlopez','0801-1990-12345','::1','2026-06-19 02:37:46'),(31,'usuarios',2,'login','Inicio de sesión exitoso - usuario: jlopez','0801-1990-12345','::1','2026-06-19 02:38:10'),(32,'usuarios',2,'login','Inicio de sesión exitoso - usuario: jlopez','0801-1990-12345','::1','2026-06-19 02:43:44'),(33,'usuarios',6,'login','Inicio de sesión exitoso - usuario: akafati','0801-1970-33333','::1','2026-06-19 02:43:58'),(34,'usuarios',5,'login','Inicio de sesión exitoso - usuario: mfsauceda','0801-1975-22222','::1','2026-06-19 02:44:09'),(35,'usuarios',3,'login','Inicio de sesión exitoso - usuario: jayestas','0801-1985-67890','::1','2026-06-19 02:44:18'),(36,'usuarios',1,'login','Inicio de sesión exitoso - usuario: ngarcia','0801-1987-01467','::1','2026-06-19 02:44:32'),(37,'usuarios',3,'login','Inicio de sesión exitoso - usuario: jayestas','0801-1985-67890','::1','2026-06-19 02:47:33');
/*!40000 ALTER TABLE `bitacora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_activos`
--

DROP TABLE IF EXISTS `categorias_activos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_activos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_spanish_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Categorías para clasificar activos fijos.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_activos`
--

LOCK TABLES `categorias_activos` WRITE;
/*!40000 ALTER TABLE `categorias_activos` DISABLE KEYS */;
INSERT INTO `categorias_activos` VALUES (1,'Equipo de Cómputo','Computadoras, laptops, tablets, impresoras, servidores y periféricos',1),(2,'Mobiliario','Escritorios, sillas, archivadores, estantes y muebles de oficina',1),(3,'Equipo de Comunicación','Teléfonos, radios, switches, routers y equipos de red',1),(4,'Equipo de Oficina','Fotocopiadoras, proyectores, pantallas, aires acondicionados',1),(5,'Vehículos','Vehículos, motocicletas y maquinaria pesada',1),(6,'Herramientas','Herramientas manuales y eléctricas',1),(7,'Equipo de Seguridad','Cámaras, servidores NVR, controles de acceso, alarmas',1);
/*!40000 ALTER TABLE `categorias_activos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `municipalidad_nombre` varchar(150) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Municipalidad de Danlí',
  `municipalidad_dir` varchar(255) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Danlí, Departamento de El Paraíso, Honduras, C.A.',
  `municipalidad_tel` varchar(80) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT '2763-2080 / 2763-2405  Telefax: 2763-2638',
  `alcalde_nombre` varchar(120) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Abraham Kafati Díaz',
  `alcalde_cargo` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Alcalde Municipal',
  `gerente_nombre` varchar(120) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Maria Fernanda Sauceda',
  `gerente_cargo` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Gerente Administrativo Financiero',
  `jefe_compras_nombre` varchar(120) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Jorge Ayestas',
  `jefe_compras_cargo` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Jefe de Compras y Suministros',
  `jefe_bienes_nombre` varchar(120) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT '',
  `jefe_bienes_cargo` varchar(100) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Jefe de Bienes y Proveeduría',
  `logo_path` varchar(300) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `escudo_path` varchar(300) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `pie_documento` text COLLATE utf8mb4_spanish_ci,
  `req_prefijo` varchar(10) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'R',
  `req_siguiente` int unsigned NOT NULL DEFAULT '91310',
  `oc_prefijo` varchar(10) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'OC',
  `oc_siguiente` int unsigned NOT NULL DEFAULT '80003',
  `sol_prefijo` varchar(10) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'SOL',
  `sol_siguiente` int unsigned NOT NULL DEFAULT '10',
  `inv_prefijo` varchar(10) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'INV',
  `inv_siguiente` int unsigned NOT NULL DEFAULT '11',
  `traslado_prefijo` varchar(10) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'NT' COMMENT 'Prefijo para notas de traslado de activos',
  `traslado_siguiente` int unsigned NOT NULL DEFAULT '1',
  `tasa_impuesto` decimal(5,2) NOT NULL DEFAULT '15.00' COMMENT 'ISV %. Se aplica por ítem (aplica_isv=1) en requisiciones y OC.',
  `moneda_simbolo` varchar(5) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'L.',
  `req_filas_base` tinyint NOT NULL DEFAULT '12',
  `oc_filas_base` tinyint NOT NULL DEFAULT '12',
  `dias_alerta_stock` tinyint NOT NULL DEFAULT '30',
  `sistema_version` varchar(10) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT '1.2',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Parámetros globales. Un solo registro id=1.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion`
--

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
INSERT INTO `configuracion` VALUES (1,'Municipalidad de Danlí','Danlí, Departamento de El Paraíso, Honduras, C.A.','2763-2080 / 2763-2405  Telefax: 2763-2638','Abraham Kafati Díaz','Alcalde Municipal','Maria Fernanda Sauceda','Gerente Administrativo Financiero','Jorge Ayestas','Jefe de Compras y Suministros','Carmen Moncada','Jefe de Bienes y Proveeduría','uploads/logos/logo.png','uploads/logos/escudo.png','Para cancelar su cuenta envíe esta orden con Factura en triplicado firmado con la siguiente certificación. Certifico(amos) que esta cuenta es justa y correcta y que no ha sido pagada. La falta de cualquiera de estos requisitos atrasará la cancelación de la cuenta.','R',91310,'OC',80003,'SOL',11,'INV',11,'NT',1,15.00,'L.',12,12,30,'1.0','2026-06-18 20:11:57');
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kardex_articulos`
--

DROP TABLE IF EXISTS `kardex_articulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kardex_articulos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_spanish_ci NOT NULL,
  `unidad` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Unidad',
  `stock_actual` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Punto de reorden. Aparece en v_stock_bajo_minimo cuando stock_actual < stock_minimo.',
  `precio_referencia` decimal(14,2) DEFAULT NULL COMMENT 'Último precio de entrada. Se actualiza con cada OC recibida.',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_codigo` (`codigo`),
  KEY `idx_descripcion` (`descripcion`(50)),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catálogo de artículos consumibles en bodega de Bienes y Proveeduría.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kardex_articulos`
--

LOCK TABLES `kardex_articulos` WRITE;
/*!40000 ALTER TABLE `kardex_articulos` DISABLE KEYS */;
INSERT INTO `kardex_articulos` VALUES (1,'PAP-001','Resma de papel bond carta 75g','Resma',35.00,20.00,150.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(2,'PAP-002','Resma de papel bond oficio 75g','Resma',12.00,10.00,170.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(3,'ESC-001','Lapicero tinta azul punta media','Unidad',180.00,50.00,12.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(4,'ESC-002','Lápiz de grafito HB Nº2','Unidad',120.00,30.00,8.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(5,'ESC-003','Folder manila tamaño carta','Unidad',250.00,100.00,5.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(6,'ESC-004','Grapa estándar 26/6 caja x 5000','Caja',15.00,5.00,35.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(7,'ESC-005','Clip metálico Nº1 caja x 100','Caja',28.00,10.00,18.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(8,'ESC-006','Corrector líquido tipo pluma','Unidad',22.00,5.00,25.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(9,'LIM-001','Escoba plástica con palo','Unidad',6.00,5.00,85.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(10,'LIM-002','Trapeador algodón 400g','Unidad',4.00,4.00,95.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(11,'LIM-003','Desinfectante líquido multiusos galón','Galón',7.00,5.00,180.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(12,'LIM-004','Papel higiénico institucional 500 hojas','Rollo',96.00,48.00,18.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(13,'LIM-005','Jabón líquido para manos galón','Galón',3.00,3.00,120.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(14,'INF-001','Tóner negro compatible HP LaserJet 85A','Unidad',2.00,2.00,650.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(15,'INF-002','Tóner negro original HP LaserJet 26A','Unidad',1.00,2.00,980.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(16,'INF-003','Cable UTP Cat6 metro','Metro',50.00,20.00,15.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41'),(17,'INF-004','Memoria USB 32GB','Unidad',5.00,3.00,180.00,1,'2026-06-03 21:06:41','2026-06-03 21:06:41');
/*!40000 ALTER TABLE `kardex_articulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kardex_movimientos`
--

DROP TABLE IF EXISTS `kardex_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kardex_movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articulo_id` int NOT NULL,
  `tipo_movimiento` enum('entrada','salida') COLLATE utf8mb4_spanish_ci NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(14,2) NOT NULL DEFAULT '0.00',
  `valor_movimiento` decimal(14,2) NOT NULL DEFAULT '0.00',
  `stock_antes` decimal(10,2) NOT NULL COMMENT 'Stock antes del movimiento (para kardex imprimible)',
  `stock_despues` decimal(10,2) NOT NULL COMMENT 'Stock después del movimiento',
  `referencia_tipo` varchar(30) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'requisicion | orden_compra | ajuste_manual',
  `referencia_id` int DEFAULT NULL COMMENT 'ID del documento origen',
  `referencia_numero` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL COMMENT 'Número legible del documento (ej. R-91302, OC-080000)',
  `departamento_destino_id` int DEFAULT NULL COMMENT 'Departamento que recibió la salida. FK lógica a rrhh_danli.',
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_spanish_ci,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_articulo` (`articulo_id`),
  KEY `idx_tipo` (`tipo_movimiento`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_referencia` (`referencia_tipo`,`referencia_id`),
  CONSTRAINT `fk_km_articulo` FOREIGN KEY (`articulo_id`) REFERENCES `kardex_articulos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Movimientos de Kardex. Solo INSERT — registro inmutable de auditoría.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kardex_movimientos`
--

LOCK TABLES `kardex_movimientos` WRITE;
/*!40000 ALTER TABLE `kardex_movimientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `kardex_movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orden_compra_detalles`
--

DROP TABLE IF EXISTS `orden_compra_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orden_compra_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orden_id` int NOT NULL,
  `numero_linea` tinyint unsigned NOT NULL,
  `descripcion` text COLLATE utf8mb4_spanish_ci NOT NULL,
  `unidad` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Unidad',
  `cantidad` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_unitario` decimal(14,2) NOT NULL DEFAULT '0.00',
  `aplica_isv` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=gravado | 0=exento',
  `valor_total` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'Calculado por trigger',
  `articulo_kardex_id` int DEFAULT NULL COMMENT 'FK a kardex_articulos. NULL si no es consumible de bodega.',
  PRIMARY KEY (`id`),
  KEY `idx_orden` (`orden_id`),
  KEY `idx_articulo_kardex` (`articulo_kardex_id`),
  CONSTRAINT `fk_ocdet_kardex` FOREIGN KEY (`articulo_kardex_id`) REFERENCES `kardex_articulos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ocdet_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_compra` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Líneas de la OC. articulo_kardex_id liga consumibles con el kardex.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orden_compra_detalles`
--

LOCK TABLES `orden_compra_detalles` WRITE;
/*!40000 ALTER TABLE `orden_compra_detalles` DISABLE KEYS */;
INSERT INTO `orden_compra_detalles` VALUES (1,1,1,'EcoFlow-DELTA3PLU / Estación de Energía DELTA 3 PLU','Unidad',1.00,20865.22,1,20865.22,NULL),(2,1,2,'Flete Tegucigalpa-Danlí','Servicio',1.00,350.00,0,350.00,NULL),(3,2,1,'Switch 8 puertos Gigabit 1000Mbps','Unidad',2.00,739.00,1,1478.00,NULL),(4,2,2,'Switch 24 puertos Gigabit administrable','Unidad',1.00,3622.00,1,3622.00,NULL),(5,2,3,'Servicio de instalación y configuración','Servicio',1.00,500.00,0,500.00,NULL),(6,3,1,'Resma de papel bond carta 75g','Resma',5.00,150.00,1,750.00,1),(7,3,2,'Lapicero tinta azul punta media','Unidad',24.00,12.00,1,288.00,3),(8,3,3,'Lápiz de grafito HB Nº2','Unidad',20.00,8.00,1,160.00,4);
/*!40000 ALTER TABLE `orden_compra_detalles` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_ocdet_valor_ins` BEFORE INSERT ON `orden_compra_detalles` FOR EACH ROW BEGIN
  SET NEW.valor_total = NEW.cantidad * NEW.precio_unitario;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_oc_totales_ins` AFTER INSERT ON `orden_compra_detalles` FOR EACH ROW BEGIN
  DECLARE v_sub  DECIMAL(14,2);
  DECLARE v_grav DECIMAL(14,2);
  DECLARE v_desc DECIMAL(14,2);
  DECLARE v_tasa DECIMAL(5,2);

  SELECT COALESCE(SUM(valor_total),0) INTO v_sub
  FROM orden_compra_detalles WHERE orden_id = NEW.orden_id;

  SELECT COALESCE(SUM(valor_total),0) INTO v_grav
  FROM orden_compra_detalles WHERE orden_id = NEW.orden_id AND aplica_isv = 1;

  SELECT descuento INTO v_desc FROM ordenes_compra WHERE id = NEW.orden_id;
  SELECT tasa_impuesto/100 INTO v_tasa FROM configuracion WHERE id = 1;

  UPDATE ordenes_compra
  SET subtotal = v_sub,
      impuesto = (v_grav - v_desc) * v_tasa,
      total    = v_sub - v_desc + (v_grav - v_desc) * v_tasa
  WHERE id = NEW.orden_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_ocdet_valor_upd` BEFORE UPDATE ON `orden_compra_detalles` FOR EACH ROW BEGIN
  SET NEW.valor_total = NEW.cantidad * NEW.precio_unitario;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_oc_totales_upd` AFTER UPDATE ON `orden_compra_detalles` FOR EACH ROW BEGIN
  DECLARE v_sub  DECIMAL(14,2);
  DECLARE v_grav DECIMAL(14,2);
  DECLARE v_desc DECIMAL(14,2);
  DECLARE v_tasa DECIMAL(5,2);

  SELECT COALESCE(SUM(valor_total),0) INTO v_sub
  FROM orden_compra_detalles WHERE orden_id = NEW.orden_id;

  SELECT COALESCE(SUM(valor_total),0) INTO v_grav
  FROM orden_compra_detalles WHERE orden_id = NEW.orden_id AND aplica_isv = 1;

  SELECT descuento INTO v_desc FROM ordenes_compra WHERE id = NEW.orden_id;
  SELECT tasa_impuesto/100 INTO v_tasa FROM configuracion WHERE id = 1;

  UPDATE ordenes_compra
  SET subtotal = v_sub,
      impuesto = (v_grav - v_desc) * v_tasa,
      total    = v_sub - v_desc + (v_grav - v_desc) * v_tasa
  WHERE id = NEW.orden_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_oc_totales_del` AFTER DELETE ON `orden_compra_detalles` FOR EACH ROW BEGIN
  DECLARE v_sub  DECIMAL(14,2);
  DECLARE v_grav DECIMAL(14,2);
  DECLARE v_desc DECIMAL(14,2);
  DECLARE v_tasa DECIMAL(5,2);

  SELECT COALESCE(SUM(valor_total),0) INTO v_sub
  FROM orden_compra_detalles WHERE orden_id = OLD.orden_id;

  SELECT COALESCE(SUM(valor_total),0) INTO v_grav
  FROM orden_compra_detalles WHERE orden_id = OLD.orden_id AND aplica_isv = 1;

  SELECT descuento INTO v_desc FROM ordenes_compra WHERE id = OLD.orden_id;
  SELECT tasa_impuesto/100 INTO v_tasa FROM configuracion WHERE id = 1;

  UPDATE ordenes_compra
  SET subtotal = v_sub,
      impuesto = (v_grav - v_desc) * v_tasa,
      total    = v_sub - v_desc + (v_grav - v_desc) * v_tasa
  WHERE id = OLD.orden_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `ordenes_compra`
--

DROP TABLE IF EXISTS `ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes_compra` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL,
  `origen_oc` enum('desde_requisicion','transcripcion') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'desde_requisicion',
  `requisicion_id` int DEFAULT NULL,
  `proveedor_id` int NOT NULL,
  `departamento_id` int NOT NULL,
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(14,2) NOT NULL DEFAULT '0.00',
  `impuesto` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `estado` enum('emitida','entregada','cancelada') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'emitida',
  `codigo_presupuestario` varchar(80) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `expediente` varchar(40) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `notas` text COLLATE utf8mb4_spanish_ci,
  `snap_jefe_compras` varchar(120) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `snap_gerente` varchar(120) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `snap_alcalde` varchar(120) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `creado_por_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `fecha_emision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_numero` (`numero`),
  KEY `idx_estado` (`estado`),
  KEY `idx_proveedor` (`proveedor_id`),
  KEY `idx_requisicion` (`requisicion_id`),
  KEY `idx_departamento` (`departamento_id`),
  KEY `idx_fecha_emision` (`fecha_emision`),
  KEY `idx_origen` (`origen_oc`),
  CONSTRAINT `fk_oc_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_oc_requisicion` FOREIGN KEY (`requisicion_id`) REFERENCES `requisiciones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Cabecera de la Orden de Compra.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra`
--

LOCK TABLES `ordenes_compra` WRITE;
/*!40000 ALTER TABLE `ordenes_compra` DISABLE KEYS */;
INSERT INTO `ordenes_compra` VALUES (1,'OC-079973','desde_requisicion',7,1,4,'0801-1987-01467',21215.22,0.00,3129.78,24345.00,'entregada','14-00-000-004-000-42110-11-001-01','EXP-48006','Para proteger los servidores. CM-AMD-CS-348-2026.','Jorge Ayestas','Maria Fernanda Sauceda','Abraham Kafati Díaz','0801-1985-67890','2026-05-22 00:00:00','2026-05-24 14:00:00'),(2,'OC-080000','desde_requisicion',3,5,4,'0801-1987-01467',5600.00,0.00,765.00,6365.00,'emitida','14-00-000-004-000-42110-11-001-01','EXP-48005','Switch para Tesorería y Auditorías Fiscales.','Jorge Ayestas','Maria Fernanda Sauceda','Abraham Kafati Díaz','0801-1985-67890','2026-05-10 09:00:00',NULL),(3,'OC-080001','transcripcion',NULL,3,4,'0801-1987-01467',1198.00,0.00,179.70,1377.70,'emitida','14-00-000-004-000-21100-11-001-01',NULL,'Transcripción de OC física. Compra urgente de materiales.','Jorge Ayestas','Maria Fernanda Sauceda','Abraham Kafati Díaz','0801-1985-67890','2026-05-19 10:00:00',NULL);
/*!40000 ALTER TABLE `ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_spanish_ci NOT NULL,
  `rtn` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT '14 dígitos sin guiones. Validado por trigger.',
  `direccion` varchar(255) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rtn` (`rtn`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Catálogo de proveedores externos.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,'Jetstereo S.A. de C.V.','05019999400238','Tegucigalpa, Honduras','ventas@jetstereo.com','2232-0000',1,'2026-06-03 21:06:41'),(2,'Distribuidora La Económica S.A.','08019999500145','San Pedro Sula, Honduras','info@laeconomica.hn','2556-1234',1,'2026-06-03 21:06:41'),(3,'Papelería El Estudiante','06019887200321','Danlí, El Paraíso, Honduras','','2763-5678',1,'2026-06-03 21:06:41'),(4,'Ferretería El Tornillo Feliz','08011234500987','Danlí, El Paraíso, Honduras','','2763-9012',1,'2026-06-03 21:06:41'),(5,'Cómputo y Tecnología S.A.','05019876543210','Tegucigalpa, Honduras','ventas@computec.hn','2239-4567',1,'2026-06-03 21:06:41'),(6,'Librería y Papelería DIUNSA','05019654321098','Tegucigalpa, Honduras','corporativo@diunsa.hn','2231-8000',1,'2026-06-03 21:06:41'),(7,'Suministros Generales del Norte','03019888700654','San Pedro Sula, Honduras','','2559-3333',1,'2026-06-03 21:06:41'),(8,'EcoFlow Honduras','05019111222333','Tegucigalpa, Honduras','info@ecoflow.hn','2289-0001',1,'2026-06-03 21:06:41');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_proveedor_rtn` BEFORE INSERT ON `proveedores` FOR EACH ROW BEGIN
  IF NEW.rtn REGEXP '[^0-9]' OR CHAR_LENGTH(NEW.rtn) != 14 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'RTN inválido: debe contener exactamente 14 dígitos numéricos sin guiones';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `requisicion_detalles`
--

DROP TABLE IF EXISTS `requisicion_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisicion_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisicion_id` int NOT NULL,
  `numero_linea` tinyint unsigned NOT NULL,
  `descripcion` text COLLATE utf8mb4_spanish_ci NOT NULL,
  `unidad` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Unidad',
  `cantidad` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_unitario` decimal(14,2) NOT NULL DEFAULT '0.00',
  `aplica_isv` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=gravado | 0=exento',
  `valor_total` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'Calculado por trigger',
  `articulo_kardex_id` int DEFAULT NULL COMMENT 'FK a kardex_articulos. NULL si el ítem no es un consumible de bodega.',
  PRIMARY KEY (`id`),
  KEY `idx_requisicion` (`requisicion_id`),
  KEY `idx_articulo_kardex` (`articulo_kardex_id`),
  CONSTRAINT `fk_reqdet_kardex` FOREIGN KEY (`articulo_kardex_id`) REFERENCES `kardex_articulos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reqdet_req` FOREIGN KEY (`requisicion_id`) REFERENCES `requisiciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Líneas de la requisición. articulo_kardex_id liga consumibles con el kardex.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisicion_detalles`
--

LOCK TABLES `requisicion_detalles` WRITE;
/*!40000 ALTER TABLE `requisicion_detalles` DISABLE KEYS */;
INSERT INTO `requisicion_detalles` VALUES (1,1,1,'Impresora Epson L3250 multifunción WiFi/USB','Unidad',3.00,3500.00,1,10500.00,NULL),(2,2,1,'Resma de papel bond carta 75g','Resma',10.00,150.00,1,1500.00,1),(3,2,2,'Lapicero tinta azul punta media','Unidad',24.00,12.00,1,288.00,3),(4,2,3,'Lápiz de grafito HB Nº2','Unidad',24.00,8.00,1,192.00,4),(5,2,4,'Folder manila tamaño carta','Unidad',50.00,5.00,1,250.00,5),(6,2,5,'Grapa estándar 26/6 caja x 5000','Caja',3.00,35.00,1,105.00,6),(7,2,6,'Clip metálico Nº1 caja x 100','Caja',5.00,18.00,1,90.00,7),(8,3,1,'Switch 8 puertos Gigabit','Unidad',2.00,739.00,1,1478.00,NULL),(9,3,2,'Switch 24 puertos Gigabit administrable','Unidad',1.00,3622.00,1,3622.00,NULL),(10,3,3,'Servicio de instalación y configuración','Servicio',1.00,500.00,0,500.00,NULL),(11,4,1,'Escoba plástica con palo','Unidad',6.00,85.00,0,510.00,9),(12,4,2,'Trapeador algodón 400g','Unidad',4.00,95.00,0,380.00,10),(13,4,3,'Desinfectante líquido multiusos galón','Galón',5.00,180.00,0,900.00,11),(14,4,4,'Papel higiénico institucional 500 hojas','Rollo',24.00,18.00,0,432.00,12),(15,6,1,'Tóner negro compatible HP LaserJet 85A','Unidad',4.00,650.00,1,2600.00,14),(16,6,2,'Tóner negro original HP LaserJet 26A','Unidad',2.00,980.00,1,1960.00,15),(17,7,1,'EcoFlow DELTA 3 Plus — Estación de Energía','Unidad',1.00,20865.22,1,20865.22,NULL),(18,7,2,'Flete Tegucigalpa-Danlí','Servicio',1.00,350.00,0,350.00,NULL),(19,8,1,'Pintura látex blanca 5 galones','Cubo',4.00,450.00,1,1800.00,NULL),(20,8,2,'Rodillo de pintura 9 pulgadas','Unidad',6.00,85.00,1,510.00,NULL),(21,8,3,'Mano de obra instalación','Servicio',1.00,800.00,0,800.00,NULL),(22,9,1,'Resma de papel bond carta','Resma',5.00,150.00,1,750.00,1);
/*!40000 ALTER TABLE `requisicion_detalles` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_reqdet_valor_ins` BEFORE INSERT ON `requisicion_detalles` FOR EACH ROW BEGIN
  SET NEW.valor_total = NEW.cantidad * NEW.precio_unitario;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_req_totales_ins` AFTER INSERT ON `requisicion_detalles` FOR EACH ROW BEGIN
  DECLARE v_sub  DECIMAL(14,2);
  DECLARE v_grav DECIMAL(14,2);
  DECLARE v_tasa DECIMAL(5,2);

  SELECT COALESCE(SUM(valor_total),0) INTO v_sub
  FROM requisicion_detalles WHERE requisicion_id = NEW.requisicion_id;

  SELECT COALESCE(SUM(valor_total),0) INTO v_grav
  FROM requisicion_detalles
  WHERE requisicion_id = NEW.requisicion_id AND aplica_isv = 1;

  SELECT tasa_impuesto/100 INTO v_tasa FROM configuracion WHERE id = 1;

  UPDATE requisiciones
  SET subtotal  = v_sub,
      total_isv = v_grav * v_tasa,
      total     = v_sub + (v_grav * v_tasa)
  WHERE id = NEW.requisicion_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_reqdet_valor_upd` BEFORE UPDATE ON `requisicion_detalles` FOR EACH ROW BEGIN
  SET NEW.valor_total = NEW.cantidad * NEW.precio_unitario;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_req_totales_upd` AFTER UPDATE ON `requisicion_detalles` FOR EACH ROW BEGIN
  DECLARE v_sub  DECIMAL(14,2);
  DECLARE v_grav DECIMAL(14,2);
  DECLARE v_tasa DECIMAL(5,2);

  SELECT COALESCE(SUM(valor_total),0) INTO v_sub
  FROM requisicion_detalles WHERE requisicion_id = NEW.requisicion_id;

  SELECT COALESCE(SUM(valor_total),0) INTO v_grav
  FROM requisicion_detalles
  WHERE requisicion_id = NEW.requisicion_id AND aplica_isv = 1;

  SELECT tasa_impuesto/100 INTO v_tasa FROM configuracion WHERE id = 1;

  UPDATE requisiciones
  SET subtotal  = v_sub,
      total_isv = v_grav * v_tasa,
      total     = v_sub + (v_grav * v_tasa)
  WHERE id = NEW.requisicion_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_req_totales_del` AFTER DELETE ON `requisicion_detalles` FOR EACH ROW BEGIN
  DECLARE v_sub  DECIMAL(14,2);
  DECLARE v_grav DECIMAL(14,2);
  DECLARE v_tasa DECIMAL(5,2);

  SELECT COALESCE(SUM(valor_total),0) INTO v_sub
  FROM requisicion_detalles WHERE requisicion_id = OLD.requisicion_id;

  SELECT COALESCE(SUM(valor_total),0) INTO v_grav
  FROM requisicion_detalles
  WHERE requisicion_id = OLD.requisicion_id AND aplica_isv = 1;

  SELECT tasa_impuesto/100 INTO v_tasa FROM configuracion WHERE id = 1;

  UPDATE requisiciones
  SET subtotal  = v_sub,
      total_isv = v_grav * v_tasa,
      total     = v_sub + (v_grav * v_tasa)
  WHERE id = OLD.requisicion_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `requisiciones`
--

DROP TABLE IF EXISTS `requisiciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisiciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL,
  `tipo` enum('compras','bienes') COLLATE utf8mb4_spanish_ci NOT NULL,
  `departamento_id` int NOT NULL,
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `dirigida_a` enum('compras','bienes') COLLATE utf8mb4_spanish_ci NOT NULL,
  `solicitud_id` int DEFAULT NULL,
  `proveedor_id` int DEFAULT NULL,
  `proveedor_nombre_snap` varchar(150) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `rtn_proveedor_snap` varchar(20) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `codigo_presupuestario` varchar(80) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `expediente` varchar(40) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total_isv` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `estado` enum('borrador','pendiente','aprobada','rechazada','comprometida','anulada') COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'borrador',
  `aprobado_por` enum('gerencia','alcaldia') COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `aprobado_por_dni` varchar(15) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `motivo_rechazo` text COLLATE utf8mb4_spanish_ci,
  `observaciones` text COLLATE utf8mb4_spanish_ci,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_aprobacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_numero` (`numero`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_departamento` (`departamento_id`),
  KEY `idx_empleado` (`empleado_dni`),
  KEY `idx_solicitud` (`solicitud_id`),
  KEY `idx_proveedor` (`proveedor_id`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `fk_req_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_req_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Cabecera de la requisición.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisiciones`
--

LOCK TABLES `requisiciones` WRITE;
/*!40000 ALTER TABLE `requisiciones` DISABLE KEYS */;
INSERT INTO `requisiciones` VALUES (1,'R-91300','compras',4,'0801-1987-01467','compras',1,1,'Jetstereo S.A. de C.V.','05019999400238','14-00-000-004-000-42110-11-001-01','EXP-48006',10500.00,1575.00,12075.00,'comprometida','gerencia','0801-1975-22222',NULL,'Para proteger los servidores.','2026-05-13 09:00:00','2026-05-14 11:30:00'),(2,'R-91301','bienes',4,'0801-1987-01467','bienes',2,NULL,NULL,NULL,'14-00-000-004-000-21100-11-001-01','EXP-48007',2425.00,363.75,2788.75,'aprobada','gerencia','0801-1975-22222',NULL,'Reposición de materiales de oficina.','2026-05-12 10:00:00','2026-05-13 09:00:00'),(3,'R-91302','compras',4,'0801-1987-01467','compras',5,5,'Cómputo y Tecnología S.A.','05019876543210','14-00-000-004-000-42110-11-001-01','EXP-48005',5600.00,765.00,6365.00,'comprometida','alcaldia','0801-1970-33333',NULL,'Switch para Tesorería y Auditorías Fiscales.','2026-05-08 08:00:00','2026-05-09 10:00:00'),(4,'R-91303','bienes',2,'0801-1990-12345','bienes',4,NULL,NULL,NULL,'14-00-000-002-000-21100-11-001-01',NULL,2222.00,0.00,2222.00,'pendiente',NULL,NULL,NULL,'Materiales de limpieza para junio.','2026-05-19 08:30:00',NULL),(5,'R-91304','compras',2,'0801-1990-12345','compras',NULL,3,'Papelería El Estudiante','06019887200321',NULL,NULL,0.00,0.00,0.00,'borrador',NULL,NULL,NULL,'Escritorios para Catastro.','2026-05-21 14:00:00',NULL),(6,'R-91305','compras',4,'0801-1987-01467','compras',NULL,6,'Librería y Papelería DIUNSA','05019654321098','14-00-000-004-000-21100-11-001-01','EXP-48010',4560.00,684.00,5244.00,'pendiente',NULL,NULL,NULL,'Tóner para impresoras HP.','2026-05-22 08:00:00',NULL),(7,'R-91306','compras',4,'0801-1987-01467','compras',NULL,1,'Jetstereo S.A. de C.V.','05019999400238','14-00-000-004-000-42110-11-001-01','EXP-48006',21215.22,3129.78,24345.00,'comprometida','alcaldia','0801-1970-33333',NULL,'EcoFlow DELTA 3 Plus.','2026-05-20 08:00:00','2026-05-21 09:00:00'),(8,'R-91307','compras',2,'0801-1990-12345','compras',NULL,4,'Ferretería El Tornillo Feliz','08011234500987',NULL,NULL,3110.00,346.50,3456.50,'rechazada','gerencia','0801-1975-22222',NULL,'Materiales de construcción.','2026-05-15 10:00:00','2026-05-16 08:00:00'),(9,'R-91308','bienes',4,'0801-1987-01467','bienes',NULL,NULL,NULL,NULL,NULL,NULL,750.00,112.50,862.50,'anulada',NULL,NULL,NULL,'Prueba anulada.','2026-05-17 11:00:00',NULL);
/*!40000 ALTER TABLE `requisiciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_respuesta_items`
--

DROP TABLE IF EXISTS `solicitud_respuesta_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_respuesta_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `respuesta_id` int NOT NULL,
  `numero_linea` tinyint unsigned NOT NULL,
  `descripcion` text COLLATE utf8mb4_spanish_ci NOT NULL,
  `unidad` varchar(30) COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'Unidad',
  `precio_unitario` decimal(14,2) NOT NULL DEFAULT '0.00',
  `cantidad_disponible` decimal(10,2) NOT NULL DEFAULT '0.00',
  `aplica_isv` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_respuesta` (`respuesta_id`),
  CONSTRAINT `fk_sri_respuesta` FOREIGN KEY (`respuesta_id`) REFERENCES `solicitud_respuestas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Ítems del listado de precios respondido por Bienes.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_respuesta_items`
--

LOCK TABLES `solicitud_respuesta_items` WRITE;
/*!40000 ALTER TABLE `solicitud_respuesta_items` DISABLE KEYS */;
INSERT INTO `solicitud_respuesta_items` VALUES (1,2,1,'Resma de papel bond carta 75g','Resma',150.00,45.00,1),(2,2,2,'Lapicero tinta azul punta media','Unidad',12.00,200.00,1),(3,2,3,'Lápiz de grafito HB Nº2','Unidad',8.00,150.00,1),(4,2,4,'Folder manila tamaño carta','Unidad',5.00,300.00,1),(5,2,5,'Grapa estándar 26/6 caja x 5000','Caja',35.00,20.00,1),(6,2,6,'Clip metálico Nº1 caja x 100','Caja',18.00,35.00,1),(7,3,1,'Escoba plástica con palo','Unidad',85.00,12.00,1),(8,3,2,'Trapeador algodón 400g','Unidad',95.00,8.00,1),(9,3,3,'Desinfectante líquido multiusos galón','Galón',180.00,10.00,1),(10,3,4,'Papel higiénico institucional 500 hojas','Rollo',18.00,144.00,1);
/*!40000 ALTER TABLE `solicitud_respuesta_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_respuestas`
--

DROP TABLE IF EXISTS `solicitud_respuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_respuestas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `solicitud_id` int NOT NULL,
  `tipo_respuesta` enum('pdf_cotizacion','listado_precios') COLLATE utf8mb4_spanish_ci NOT NULL,
  `archivo_pdf` varchar(300) COLLATE utf8mb4_spanish_ci DEFAULT NULL,
  `respondido_por_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_spanish_ci,
  `fecha_respuesta` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_solicitud` (`solicitud_id`),
  CONSTRAINT `fk_sr_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Respuesta de Compras (PDF) o Bienes (listado) a una solicitud.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_respuestas`
--

LOCK TABLES `solicitud_respuestas` WRITE;
/*!40000 ALTER TABLE `solicitud_respuestas` DISABLE KEYS */;
INSERT INTO `solicitud_respuestas` VALUES (1,1,'pdf_cotizacion','uploads/cotizaciones/COT-2026-001.pdf','0801-1985-67890','Cotización Jetstereo. Garantía 1 año, entrega en Danlí.','2026-05-12 14:00:00'),(2,2,'listado_precios',NULL,'0801-1988-11111','Artículos disponibles en bodega al 11 de mayo de 2026.','2026-05-11 16:30:00'),(3,4,'listado_precios',NULL,'0801-1988-11111','Materiales de limpieza disponibles para junio.','2026-05-18 15:00:00'),(4,5,'pdf_cotizacion','uploads/cotizaciones/COT-2026-005.pdf','0801-1985-67890','Switch 8p L.739.00, 24p L.3,622.00. Incluye configuración.','2026-05-07 09:30:00');
/*!40000 ALTER TABLE `solicitud_respuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes`
--

DROP TABLE IF EXISTS `solicitudes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) COLLATE utf8mb4_spanish_ci NOT NULL,
  `tipo` enum('cotizacion','precios_bienes') COLLATE utf8mb4_spanish_ci NOT NULL,
  `departamento_id` int NOT NULL,
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL,
  `observaciones` text COLLATE utf8mb4_spanish_ci NOT NULL,
  `estado` enum('pendiente','en_espera','respondida','cancelada') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL DEFAULT 'pendiente',
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_respuesta` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_numero` (`numero`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_departamento` (`departamento_id`),
  KEY `idx_empleado` (`empleado_dni`),
  KEY `idx_fecha` (`fecha_solicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Solicitudes de cotización o lista de precios. Todos los departamentos pueden crear.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
INSERT INTO `solicitudes` VALUES (1,'SOL-2026-001','cotizacion',4,'0801-1987-01467','Cotización de 3 impresoras Epson L3250 para la UMI.','respondida','2026-05-10 08:30:00','2026-05-12 14:00:00'),(2,'SOL-2026-002','precios_bienes',4,'0801-1987-01467','Lista de precios y disponibilidad de materiales de oficina.','respondida','2026-05-11 09:00:00','2026-05-11 16:30:00'),(3,'SOL-2026-003','cotizacion',2,'0801-1990-12345','Cotización de 2 escritorios ejecutivos para Catastro.','pendiente','2026-05-20 10:15:00',NULL),(4,'SOL-2026-004','precios_bienes',2,'0801-1990-12345','Disponibilidad de materiales de limpieza para junio.','respondida','2026-05-18 07:45:00','2026-05-18 15:00:00'),(5,'SOL-2026-005','cotizacion',4,'0801-1987-01467','Cotización de switch 8p y 24p Gigabit.','respondida','2026-05-05 08:00:00','2026-05-07 09:30:00'),(6,'SOL-2026-010','cotizacion',1,'0801-1987-01467','cotizar un ecoFlow un regulador de voltage una bateria ','pendiente','2026-06-18 20:11:57',NULL);
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_dni` varchar(15) COLLATE utf8mb4_spanish_ci NOT NULL COMMENT 'FK lógica a rrhh_danli.empleados',
  `username` varchar(60) COLLATE utf8mb4_spanish_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_spanish_ci NOT NULL,
  `rol` enum('admin','solicitante','compras','bienes','gerencia','alcaldia','contabilidad') CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `departamento_id` int DEFAULT NULL COMMENT 'FK lógica a rrhh_danli.departamentos',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultimo_acceso` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  UNIQUE KEY `uq_empleado_dni` (`empleado_dni`),
  KEY `idx_rol` (`rol`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci COMMENT='Usuarios del sistema con rol y vínculo a RRHH.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'0801-1987-01467','ngarcia','$2a$12$ifL6PgWF/SXmtFrH.xQM7uH8CC0uoXcpgRfrjKduQZo9vwK5OncLS','admin',4,1,'2026-06-19 02:44:32','2026-06-03 21:06:41'),(2,'0801-1990-12345','jlopez','$2a$12$ifL6PgWF/SXmtFrH.xQM7uH8CC0uoXcpgRfrjKduQZo9vwK5OncLS','solicitante',2,1,'2026-06-19 02:43:44','2026-06-03 21:06:41'),(3,'0801-1985-67890','jayestas','$2a$12$ifL6PgWF/SXmtFrH.xQM7uH8CC0uoXcpgRfrjKduQZo9vwK5OncLS','compras',5,1,'2026-06-19 02:47:33','2026-06-03 21:06:41'),(4,'0801-1988-11111','mrodriguez','$2a$12$ifL6PgWF/SXmtFrH.xQM7uH8CC0uoXcpgRfrjKduQZo9vwK5OncLS','bienes',6,1,'2026-06-19 02:33:07','2026-06-03 21:06:41'),(5,'0801-1975-22222','mfsauceda','$2a$12$ifL6PgWF/SXmtFrH.xQM7uH8CC0uoXcpgRfrjKduQZo9vwK5OncLS','gerencia',1,1,'2026-06-19 02:44:09','2026-06-03 21:06:41'),(6,'0801-1970-33333','akafati','$2a$12$ifL6PgWF/SXmtFrH.xQM7uH8CC0uoXcpgRfrjKduQZo9vwK5OncLS','alcaldia',1,1,'2026-06-19 02:43:58','2026-06-03 21:06:41');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_activos_fijos_completo`
--

DROP TABLE IF EXISTS `v_activos_fijos_completo`;
/*!50001 DROP VIEW IF EXISTS `v_activos_fijos_completo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_activos_fijos_completo` AS SELECT 
 1 AS `id`,
 1 AS `numero_inventario`,
 1 AS `descripcion`,
 1 AS `categoria`,
 1 AS `departamento_id`,
 1 AS `custodio_dni`,
 1 AS `marca`,
 1 AS `modelo`,
 1 AS `serie`,
 1 AS `fecha_adquisicion`,
 1 AS `valor_adquisicion`,
 1 AS `valor_actual`,
 1 AS `ubicacion`,
 1 AS `estado`,
 1 AS `oc_origen`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_activos_por_departamento`
--

DROP TABLE IF EXISTS `v_activos_por_departamento`;
/*!50001 DROP VIEW IF EXISTS `v_activos_por_departamento`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_activos_por_departamento` AS SELECT 
 1 AS `departamento_id`,
 1 AS `total_activos`,
 1 AS `buenos`,
 1 AS `regulares`,
 1 AS `malos`,
 1 AS `en_reparacion`,
 1 AS `dados_de_baja`,
 1 AS `valor_total_adquisicion`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_kardex_detalle`
--

DROP TABLE IF EXISTS `v_kardex_detalle`;
/*!50001 DROP VIEW IF EXISTS `v_kardex_detalle`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_kardex_detalle` AS SELECT 
 1 AS `id`,
 1 AS `fecha`,
 1 AS `codigo`,
 1 AS `descripcion`,
 1 AS `unidad`,
 1 AS `tipo_movimiento`,
 1 AS `cantidad`,
 1 AS `precio_unitario`,
 1 AS `valor_movimiento`,
 1 AS `stock_antes`,
 1 AS `stock_despues`,
 1 AS `referencia_tipo`,
 1 AS `referencia_numero`,
 1 AS `departamento_destino_id`,
 1 AS `empleado_dni`,
 1 AS `observaciones`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_ordenes_compra_completas`
--

DROP TABLE IF EXISTS `v_ordenes_compra_completas`;
/*!50001 DROP VIEW IF EXISTS `v_ordenes_compra_completas`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_ordenes_compra_completas` AS SELECT 
 1 AS `id`,
 1 AS `numero`,
 1 AS `origen_oc`,
 1 AS `requisicion_id`,
 1 AS `departamento_id`,
 1 AS `empleado_dni`,
 1 AS `subtotal`,
 1 AS `descuento`,
 1 AS `impuesto`,
 1 AS `total`,
 1 AS `estado`,
 1 AS `codigo_presupuestario`,
 1 AS `expediente`,
 1 AS `snap_jefe_compras`,
 1 AS `snap_gerente`,
 1 AS `snap_alcalde`,
 1 AS `notas`,
 1 AS `creado_por_dni`,
 1 AS `fecha_emision`,
 1 AS `fecha_entrega`,
 1 AS `proveedor_nombre`,
 1 AS `proveedor_rtn`,
 1 AS `proveedor_telefono`,
 1 AS `proveedor_correo`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_requisiciones_completas`
--

DROP TABLE IF EXISTS `v_requisiciones_completas`;
/*!50001 DROP VIEW IF EXISTS `v_requisiciones_completas`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_requisiciones_completas` AS SELECT 
 1 AS `id`,
 1 AS `numero`,
 1 AS `tipo`,
 1 AS `departamento_id`,
 1 AS `empleado_dni`,
 1 AS `dirigida_a`,
 1 AS `solicitud_id`,
 1 AS `proveedor_id`,
 1 AS `proveedor_nombre_snap`,
 1 AS `estado`,
 1 AS `aprobado_por`,
 1 AS `aprobado_por_dni`,
 1 AS `codigo_presupuestario`,
 1 AS `expediente`,
 1 AS `observaciones`,
 1 AS `subtotal`,
 1 AS `total_isv`,
 1 AS `total`,
 1 AS `fecha_creacion`,
 1 AS `fecha_aprobacion`,
 1 AS `total_filas`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_solicitudes_pendientes`
--

DROP TABLE IF EXISTS `v_solicitudes_pendientes`;
/*!50001 DROP VIEW IF EXISTS `v_solicitudes_pendientes`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_solicitudes_pendientes` AS SELECT 
 1 AS `id`,
 1 AS `numero`,
 1 AS `tipo`,
 1 AS `departamento_id`,
 1 AS `empleado_dni`,
 1 AS `resumen`,
 1 AS `estado`,
 1 AS `fecha_solicitud`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_stock_bajo_minimo`
--

DROP TABLE IF EXISTS `v_stock_bajo_minimo`;
/*!50001 DROP VIEW IF EXISTS `v_stock_bajo_minimo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_stock_bajo_minimo` AS SELECT 
 1 AS `id`,
 1 AS `codigo`,
 1 AS `descripcion`,
 1 AS `unidad`,
 1 AS `stock_actual`,
 1 AS `stock_minimo`,
 1 AS `faltante`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'req_danli'
--

--
-- Dumping routines for database 'req_danli'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_aprobar_requisicion_bienes` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_aprobar_requisicion_bienes`(
  IN  p_requisicion_id  INT,
  IN  p_aprobado_por    ENUM('gerencia','alcaldia'),
  IN  p_aprobado_dni    VARCHAR(15),
  IN  p_empleado_dni    VARCHAR(15),
  IN  p_ip              VARCHAR(45),
  OUT p_resultado       VARCHAR(200)
)
BEGIN
  DECLARE v_done          INT DEFAULT 0;
  DECLARE v_articulo_id   INT;
  DECLARE v_cantidad      DECIMAL(10,2);
  DECLARE v_precio        DECIMAL(14,2);
  DECLARE v_req_numero    VARCHAR(20);
  DECLARE v_dept_id       INT;
  DECLARE v_kardex_result VARCHAR(100);
  DECLARE v_descripcion   VARCHAR(200);
  DECLARE v_tipo          VARCHAR(10);
  DECLARE v_sin_stock     VARCHAR(200) DEFAULT '';

  -- Cursor 1: solo para verificar stock (no mueve nada)
  DECLARE cur_check CURSOR FOR
    SELECT rd.articulo_kardex_id,
           rd.cantidad,
           ka.descripcion
    FROM   requisicion_detalles rd
    JOIN   kardex_articulos ka ON ka.id = rd.articulo_kardex_id
    WHERE  rd.requisicion_id     = p_requisicion_id
      AND  rd.articulo_kardex_id IS NOT NULL;

  -- Cursor 2: para ejecutar los movimientos de kardex
  DECLARE cur_move CURSOR FOR
    SELECT rd.articulo_kardex_id,
           rd.cantidad,
           rd.precio_unitario
    FROM   requisicion_detalles rd
    WHERE  rd.requisicion_id     = p_requisicion_id
      AND  rd.articulo_kardex_id IS NOT NULL;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_resultado = 'ERROR: Fallo general en la aprobación';
  END;

  -- Validar que sea tipo bienes
  SELECT tipo, numero, departamento_id
  INTO   v_tipo, v_req_numero, v_dept_id
  FROM   requisiciones WHERE id = p_requisicion_id;

  IF v_tipo != 'bienes' THEN
    SET p_resultado = 'ERROR: Esta requisición no es de tipo bienes';
  ELSE
    -- PASO 1: Verificar stock de todos los ítems ANTES de mover nada
    SET p_resultado = 'OK';
    OPEN cur_check;
    check_loop: LOOP
      FETCH cur_check INTO v_articulo_id, v_cantidad, v_descripcion;
      IF v_done THEN LEAVE check_loop; END IF;
      IF (SELECT stock_actual FROM kardex_articulos WHERE id = v_articulo_id) < v_cantidad THEN
        SET v_sin_stock = v_descripcion;
        LEAVE check_loop;
      END IF;
    END LOOP;
    CLOSE cur_check;

    IF v_sin_stock != '' THEN
      SET p_resultado = CONCAT('ERROR: Stock insuficiente para "', v_sin_stock, '"');
    ELSE
      -- PASO 2: Todos tienen stock — ejecutar movimientos
      SET v_done = 0;
      OPEN cur_move;
      move_loop: LOOP
        FETCH cur_move INTO v_articulo_id, v_cantidad, v_precio;
        IF v_done THEN LEAVE move_loop; END IF;

        CALL sp_registrar_movimiento_kardex(
          v_articulo_id, 'salida', v_cantidad, v_precio,
          'requisicion', p_requisicion_id, v_req_numero,
          v_dept_id, p_empleado_dni,
          CONCAT('Salida por requisición aprobada ', v_req_numero),
          v_kardex_result
        );

        IF v_kardex_result LIKE 'ERROR%' THEN
          SET p_resultado = v_kardex_result;
          LEAVE move_loop;
        END IF;
      END LOOP;
      CLOSE cur_move;

      -- PASO 3: Si todos los movimientos salieron bien, aprobar la req
      IF p_resultado = 'OK' THEN
        UPDATE requisiciones
        SET estado           = 'aprobada',
            aprobado_por     = p_aprobado_por,
            aprobado_por_dni = p_aprobado_dni,
            fecha_aprobacion = NOW()
        WHERE id = p_requisicion_id;

        INSERT INTO bitacora (tabla_afectada, registro_id, accion, descripcion, empleado_dni, ip_address)
        VALUES ('requisiciones', p_requisicion_id, 'aprobar',
                CONCAT('Requisición ', v_req_numero,
                       ' aprobada. Stock descontado del kardex por ',
                       p_aprobado_por),
                p_empleado_dni, p_ip);
      END IF;
    END IF;
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_recibir_orden_compra` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_recibir_orden_compra`(
  IN  p_orden_id      INT,
  IN  p_empleado_dni  VARCHAR(15),
  IN  p_ip            VARCHAR(45),
  OUT p_resultado     VARCHAR(200)
)
BEGIN
  DECLARE v_done          INT DEFAULT 0;
  DECLARE v_articulo_id   INT;
  DECLARE v_cantidad      DECIMAL(10,2);
  DECLARE v_precio        DECIMAL(14,2);
  DECLARE v_oc_numero     VARCHAR(20);
  DECLARE v_kardex_result VARCHAR(100);

  DECLARE cur CURSOR FOR
    SELECT ocd.articulo_kardex_id,
           ocd.cantidad,
           ocd.precio_unitario
    FROM   orden_compra_detalles ocd
    WHERE  ocd.orden_id           = p_orden_id
      AND  ocd.articulo_kardex_id IS NOT NULL;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_resultado = 'ERROR: Fallo al recibir la orden de compra';
  END;

  SELECT numero INTO v_oc_numero
  FROM ordenes_compra WHERE id = p_orden_id;

  SET p_resultado = 'OK';

  OPEN cur;
  entrada_loop: LOOP
    FETCH cur INTO v_articulo_id, v_cantidad, v_precio;
    IF v_done THEN LEAVE entrada_loop; END IF;

    CALL sp_registrar_movimiento_kardex(
      v_articulo_id, 'entrada', v_cantidad, v_precio,
      'orden_compra', p_orden_id, v_oc_numero,
      NULL, p_empleado_dni,
      CONCAT('Entrada por OC recibida ', v_oc_numero),
      v_kardex_result
    );

    IF v_kardex_result LIKE 'ERROR%' THEN
      SET p_resultado = v_kardex_result;
      LEAVE entrada_loop;
    END IF;
  END LOOP;
  CLOSE cur;

  IF p_resultado = 'OK' THEN
    UPDATE ordenes_compra
    SET estado        = 'entregada',
        fecha_entrega = NOW()
    WHERE id = p_orden_id;

    INSERT INTO bitacora (tabla_afectada, registro_id, accion, descripcion, empleado_dni, ip_address)
    VALUES ('ordenes_compra', p_orden_id, 'editar',
            CONCAT('OC ', v_oc_numero, ' marcada como entregada. Stock incrementado en kardex.'),
            p_empleado_dni, p_ip);
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_registrar_movimiento_kardex` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_movimiento_kardex`(
  IN  p_articulo_id       INT,
  IN  p_tipo              ENUM('entrada','salida'),
  IN  p_cantidad          DECIMAL(10,2),
  IN  p_precio_unitario   DECIMAL(14,2),
  IN  p_referencia_tipo   VARCHAR(30),
  IN  p_referencia_id     INT,
  IN  p_referencia_numero VARCHAR(20),
  IN  p_dept_destino_id   INT,
  IN  p_empleado_dni      VARCHAR(15),
  IN  p_observaciones     TEXT,
  OUT p_resultado         VARCHAR(100)
)
BEGIN
  DECLARE v_stock_antes   DECIMAL(10,2);
  DECLARE v_stock_despues DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_resultado = 'ERROR: Fallo en la transacción de kardex';
  END;

  START TRANSACTION;
    SELECT stock_actual INTO v_stock_antes
    FROM kardex_articulos WHERE id = p_articulo_id FOR UPDATE;

    IF p_tipo = 'salida' AND v_stock_antes < p_cantidad THEN
      ROLLBACK;
      SET p_resultado = 'ERROR: Stock insuficiente';
    ELSE
      SET v_stock_despues = IF(p_tipo = 'entrada',
        v_stock_antes + p_cantidad,
        v_stock_antes - p_cantidad);

      UPDATE kardex_articulos
      SET stock_actual      = v_stock_despues,
          precio_referencia = IF(p_tipo = 'entrada', p_precio_unitario, precio_referencia)
      WHERE id = p_articulo_id;

      INSERT INTO kardex_movimientos (
        articulo_id, tipo_movimiento, cantidad, precio_unitario,
        valor_movimiento, stock_antes, stock_despues,
        referencia_tipo, referencia_id, referencia_numero,
        departamento_destino_id, empleado_dni, observaciones
      ) VALUES (
        p_articulo_id, p_tipo, p_cantidad, p_precio_unitario,
        p_cantidad * p_precio_unitario, v_stock_antes, v_stock_despues,
        p_referencia_tipo, p_referencia_id, p_referencia_numero,
        p_dept_destino_id, p_empleado_dni, p_observaciones
      );

      COMMIT;
      SET p_resultado = CONCAT('OK: Stock actualizado a ', v_stock_despues);
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_registrar_traslado_activo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_traslado_activo`(
  IN  p_activo_id           INT,
  IN  p_dept_origen_id      INT,
  IN  p_custodio_origen_dni VARCHAR(15),
  IN  p_dept_destino_id     INT,
  IN  p_custodio_destino_dni VARCHAR(15),
  IN  p_motivo              TEXT,
  IN  p_autorizado_por_dni  VARCHAR(15),
  IN  p_fecha_traslado      DATE,
  IN  p_registrado_por      VARCHAR(15),
  OUT p_numero_nota         VARCHAR(20),
  OUT p_resultado           VARCHAR(100)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_resultado = 'ERROR: No se pudo registrar el traslado';
  END;

  START TRANSACTION;

  -- 1. Generar número de nota de traslado
  CALL sp_siguiente_numero_traslado(p_numero_nota);

  -- 2. Registrar la nota de traslado
  INSERT INTO activos_traslados (
    numero_nota, activo_id,
    departamento_origen_id,  custodio_origen_dni,
    departamento_destino_id, custodio_destino_dni,
    motivo, autorizado_por_dni, fecha_traslado, registrado_por
  ) VALUES (
    p_numero_nota, p_activo_id,
    p_dept_origen_id,  p_custodio_origen_dni,
    p_dept_destino_id, p_custodio_destino_dni,
    p_motivo, p_autorizado_por_dni, p_fecha_traslado, p_registrado_por
  );

  -- 3. Cerrar asignación actual
  UPDATE activos_asignaciones
  SET fecha_fin = p_fecha_traslado
  WHERE activo_id    = p_activo_id
    AND empleado_dni = p_custodio_origen_dni
    AND fecha_fin    IS NULL;

  -- 4. Abrir nueva asignación para el custodio destino
  INSERT INTO activos_asignaciones (
    activo_id, empleado_dni, departamento_id,
    fecha_inicio, fecha_fin, motivo_asignacion, registrado_por
  ) VALUES (
    p_activo_id, p_custodio_destino_dni, p_dept_destino_id,
    p_fecha_traslado, NULL,
    CONCAT('Traslado ', p_numero_nota),
    p_registrado_por
  );

  -- 5. Actualizar custodio y departamento actuales en activos_fijos
  UPDATE activos_fijos
  SET departamento_id = p_dept_destino_id,
      custodio_dni    = p_custodio_destino_dni
  WHERE id = p_activo_id;

  COMMIT;
  SET p_resultado = CONCAT('OK: Traslado registrado con nota ', p_numero_nota);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_siguiente_numero_inv` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_siguiente_numero_inv`(OUT p_numero VARCHAR(20))
BEGIN
  DECLARE v_prefijo   VARCHAR(10);
  DECLARE v_siguiente INT UNSIGNED;
  START TRANSACTION;
    SELECT inv_prefijo, inv_siguiente INTO v_prefijo, v_siguiente
    FROM configuracion WHERE id = 1 FOR UPDATE;
    SET p_numero = CONCAT(v_prefijo, '-', LPAD(v_siguiente, 5, '0'));
    UPDATE configuracion SET inv_siguiente = inv_siguiente + 1 WHERE id = 1;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_siguiente_numero_oc` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_siguiente_numero_oc`(OUT p_numero VARCHAR(20))
BEGIN
  DECLARE v_prefijo   VARCHAR(10);
  DECLARE v_siguiente INT UNSIGNED;
  START TRANSACTION;
    SELECT oc_prefijo, oc_siguiente INTO v_prefijo, v_siguiente
    FROM configuracion WHERE id = 1 FOR UPDATE;
    SET p_numero = CONCAT(v_prefijo, '-', LPAD(v_siguiente, 6, '0'));
    UPDATE configuracion SET oc_siguiente = oc_siguiente + 1 WHERE id = 1;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_siguiente_numero_req` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_siguiente_numero_req`(OUT p_numero VARCHAR(20))
BEGIN
  DECLARE v_prefijo   VARCHAR(10);
  DECLARE v_siguiente INT UNSIGNED;
  START TRANSACTION;
    SELECT req_prefijo, req_siguiente INTO v_prefijo, v_siguiente
    FROM configuracion WHERE id = 1 FOR UPDATE;
    SET p_numero = CONCAT(v_prefijo, '-', LPAD(v_siguiente, 5, '0'));
    UPDATE configuracion SET req_siguiente = req_siguiente + 1 WHERE id = 1;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_siguiente_numero_sol` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_siguiente_numero_sol`(OUT p_numero VARCHAR(20))
BEGIN
  DECLARE v_anio      CHAR(4);
  DECLARE v_siguiente INT UNSIGNED;
  START TRANSACTION;
    SELECT YEAR(NOW()), sol_siguiente INTO v_anio, v_siguiente
    FROM configuracion WHERE id = 1 FOR UPDATE;
    SET p_numero = CONCAT('SOL-', v_anio, '-', LPAD(v_siguiente, 3, '0'));
    UPDATE configuracion SET sol_siguiente = sol_siguiente + 1 WHERE id = 1;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_siguiente_numero_traslado` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_siguiente_numero_traslado`(OUT p_numero VARCHAR(20))
BEGIN
  DECLARE v_prefijo   VARCHAR(10);
  DECLARE v_siguiente INT UNSIGNED;
  START TRANSACTION;
    SELECT traslado_prefijo, traslado_siguiente INTO v_prefijo, v_siguiente
    FROM configuracion WHERE id = 1 FOR UPDATE;
    SET p_numero = CONCAT(v_prefijo, '-', LPAD(v_siguiente, 5, '0'));
    UPDATE configuracion SET traslado_siguiente = traslado_siguiente + 1 WHERE id = 1;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `v_activos_fijos_completo`
--

/*!50001 DROP VIEW IF EXISTS `v_activos_fijos_completo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_activos_fijos_completo` AS select `af`.`id` AS `id`,`af`.`numero_inventario` AS `numero_inventario`,`af`.`descripcion` AS `descripcion`,`ca`.`nombre` AS `categoria`,`af`.`departamento_id` AS `departamento_id`,`af`.`custodio_dni` AS `custodio_dni`,`af`.`marca` AS `marca`,`af`.`modelo` AS `modelo`,`af`.`serie` AS `serie`,`af`.`fecha_adquisicion` AS `fecha_adquisicion`,`af`.`valor_adquisicion` AS `valor_adquisicion`,`af`.`valor_actual` AS `valor_actual`,`af`.`ubicacion` AS `ubicacion`,`af`.`estado` AS `estado`,`oc`.`numero` AS `oc_origen` from ((`activos_fijos` `af` left join `categorias_activos` `ca` on((`ca`.`id` = `af`.`categoria_id`))) left join `ordenes_compra` `oc` on((`oc`.`id` = `af`.`orden_compra_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_activos_por_departamento`
--

/*!50001 DROP VIEW IF EXISTS `v_activos_por_departamento`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_activos_por_departamento` AS select `af`.`departamento_id` AS `departamento_id`,count(`af`.`id`) AS `total_activos`,sum((case when (`af`.`estado` = 'bueno') then 1 else 0 end)) AS `buenos`,sum((case when (`af`.`estado` = 'regular') then 1 else 0 end)) AS `regulares`,sum((case when (`af`.`estado` = 'malo') then 1 else 0 end)) AS `malos`,sum((case when (`af`.`estado` = 'en_reparacion') then 1 else 0 end)) AS `en_reparacion`,sum((case when (`af`.`estado` = 'dado_de_baja') then 1 else 0 end)) AS `dados_de_baja`,coalesce(sum(`af`.`valor_adquisicion`),0) AS `valor_total_adquisicion` from `activos_fijos` `af` group by `af`.`departamento_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_kardex_detalle`
--

/*!50001 DROP VIEW IF EXISTS `v_kardex_detalle`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_kardex_detalle` AS select `km`.`id` AS `id`,`km`.`fecha` AS `fecha`,`ka`.`codigo` AS `codigo`,`ka`.`descripcion` AS `descripcion`,`ka`.`unidad` AS `unidad`,`km`.`tipo_movimiento` AS `tipo_movimiento`,`km`.`cantidad` AS `cantidad`,`km`.`precio_unitario` AS `precio_unitario`,`km`.`valor_movimiento` AS `valor_movimiento`,`km`.`stock_antes` AS `stock_antes`,`km`.`stock_despues` AS `stock_despues`,`km`.`referencia_tipo` AS `referencia_tipo`,`km`.`referencia_numero` AS `referencia_numero`,`km`.`departamento_destino_id` AS `departamento_destino_id`,`km`.`empleado_dni` AS `empleado_dni`,`km`.`observaciones` AS `observaciones` from (`kardex_movimientos` `km` join `kardex_articulos` `ka` on((`ka`.`id` = `km`.`articulo_id`))) order by `km`.`articulo_id`,`km`.`fecha`,`km`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_ordenes_compra_completas`
--

/*!50001 DROP VIEW IF EXISTS `v_ordenes_compra_completas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_ordenes_compra_completas` AS select `oc`.`id` AS `id`,`oc`.`numero` AS `numero`,`oc`.`origen_oc` AS `origen_oc`,`oc`.`requisicion_id` AS `requisicion_id`,`oc`.`departamento_id` AS `departamento_id`,`oc`.`empleado_dni` AS `empleado_dni`,`oc`.`subtotal` AS `subtotal`,`oc`.`descuento` AS `descuento`,`oc`.`impuesto` AS `impuesto`,`oc`.`total` AS `total`,`oc`.`estado` AS `estado`,`oc`.`codigo_presupuestario` AS `codigo_presupuestario`,`oc`.`expediente` AS `expediente`,`oc`.`snap_jefe_compras` AS `snap_jefe_compras`,`oc`.`snap_gerente` AS `snap_gerente`,`oc`.`snap_alcalde` AS `snap_alcalde`,`oc`.`notas` AS `notas`,`oc`.`creado_por_dni` AS `creado_por_dni`,`oc`.`fecha_emision` AS `fecha_emision`,`oc`.`fecha_entrega` AS `fecha_entrega`,`p`.`nombre` AS `proveedor_nombre`,`p`.`rtn` AS `proveedor_rtn`,`p`.`telefono` AS `proveedor_telefono`,`p`.`correo` AS `proveedor_correo` from (`ordenes_compra` `oc` join `proveedores` `p` on((`p`.`id` = `oc`.`proveedor_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_requisiciones_completas`
--

/*!50001 DROP VIEW IF EXISTS `v_requisiciones_completas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_requisiciones_completas` AS select `r`.`id` AS `id`,`r`.`numero` AS `numero`,`r`.`tipo` AS `tipo`,`r`.`departamento_id` AS `departamento_id`,`r`.`empleado_dni` AS `empleado_dni`,`r`.`dirigida_a` AS `dirigida_a`,`r`.`solicitud_id` AS `solicitud_id`,`r`.`proveedor_id` AS `proveedor_id`,`r`.`proveedor_nombre_snap` AS `proveedor_nombre_snap`,`r`.`estado` AS `estado`,`r`.`aprobado_por` AS `aprobado_por`,`r`.`aprobado_por_dni` AS `aprobado_por_dni`,`r`.`codigo_presupuestario` AS `codigo_presupuestario`,`r`.`expediente` AS `expediente`,`r`.`observaciones` AS `observaciones`,`r`.`subtotal` AS `subtotal`,`r`.`total_isv` AS `total_isv`,`r`.`total` AS `total`,`r`.`fecha_creacion` AS `fecha_creacion`,`r`.`fecha_aprobacion` AS `fecha_aprobacion`,count(`d`.`id`) AS `total_filas` from (`requisiciones` `r` left join `requisicion_detalles` `d` on((`d`.`requisicion_id` = `r`.`id`))) group by `r`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_solicitudes_pendientes`
--

/*!50001 DROP VIEW IF EXISTS `v_solicitudes_pendientes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_solicitudes_pendientes` AS select `s`.`id` AS `id`,`s`.`numero` AS `numero`,`s`.`tipo` AS `tipo`,`s`.`departamento_id` AS `departamento_id`,`s`.`empleado_dni` AS `empleado_dni`,left(`s`.`observaciones`,80) AS `resumen`,`s`.`estado` AS `estado`,`s`.`fecha_solicitud` AS `fecha_solicitud` from `solicitudes` `s` where (`s`.`estado` = 'pendiente') order by `s`.`fecha_solicitud` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stock_bajo_minimo`
--

/*!50001 DROP VIEW IF EXISTS `v_stock_bajo_minimo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_stock_bajo_minimo` AS select `kardex_articulos`.`id` AS `id`,`kardex_articulos`.`codigo` AS `codigo`,`kardex_articulos`.`descripcion` AS `descripcion`,`kardex_articulos`.`unidad` AS `unidad`,`kardex_articulos`.`stock_actual` AS `stock_actual`,`kardex_articulos`.`stock_minimo` AS `stock_minimo`,(`kardex_articulos`.`stock_minimo` - `kardex_articulos`.`stock_actual`) AS `faltante` from `kardex_articulos` where ((`kardex_articulos`.`activo` = 1) and (`kardex_articulos`.`stock_actual` < `kardex_articulos`.`stock_minimo`)) order by (`kardex_articulos`.`stock_minimo` - `kardex_articulos`.`stock_actual`) desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-18 20:52:53
