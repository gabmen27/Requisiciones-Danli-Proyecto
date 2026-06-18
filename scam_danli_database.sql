CREATE DATABASE  IF NOT EXISTS `scam_danli` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `scam_danli`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: scam_danli
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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '77ab8c8b-53c1-11f1-9737-b82a72c57aed:1-471';

--
-- Table structure for table `alertas`
--

DROP TABLE IF EXISTS `alertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_asistencia` bigint NOT NULL,
  `id_empleado` int NOT NULL,
  `tipo_alerta` enum('gps_fuera_perimetro','dispositivo_no_registrado','dispositivo_compartido','doble_entrada','sin_salida_fin_dia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revisada` tinyint(1) NOT NULL DEFAULT '0',
  `revisada_por` int DEFAULT NULL,
  `revisada_en` datetime DEFAULT NULL,
  `creada_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_asistencia` (`id_asistencia`),
  KEY `id_empleado` (`id_empleado`),
  KEY `revisada_por` (`revisada_por`),
  KEY `idx_no_revisadas` (`revisada`,`creada_en`),
  CONSTRAINT `alertas_ibfk_1` FOREIGN KEY (`id_asistencia`) REFERENCES `asistencias` (`id`),
  CONSTRAINT `alertas_ibfk_2` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id`),
  CONSTRAINT `alertas_ibfk_3` FOREIGN KEY (`revisada_por`) REFERENCES `usuarios_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertas`
--

LOCK TABLES `alertas` WRITE;
/*!40000 ALTER TABLE `alertas` DISABLE KEYS */;
/*!40000 ALTER TABLE `alertas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asistencias`
--

DROP TABLE IF EXISTS `asistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `tipo` enum('entrada','salida') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha` date NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `dentro_perimetro` tinyint(1) DEFAULT NULL,
  `distancia_metros` int DEFAULT NULL,
  `device_id` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispositivo_autorizado` tinyint(1) DEFAULT NULL,
  `estado` enum('valida','alerta','rechazada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valida',
  `observacion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_empleado_fecha` (`id_empleado`,`fecha`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_device_id` (`device_id`(50)),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencias`
--

LOCK TABLES `asistencias` WRITE;
/*!40000 ALTER TABLE `asistencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `asistencias` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_insert_asistencia` AFTER INSERT ON `asistencias` FOR EACH ROW BEGIN
    DECLARE v_entrada    TIME;
    DECLARE v_salida     TIME;
    DECLARE v_horas      DECIMAL(5,2);
    DECLARE v_extras     DECIMAL(5,2);
    DECLARE v_jornada    DECIMAL(4,2);
    DECLARE v_device_cnt INT;

    -- ── 1. Actualizar resumen_diario ──────────────────────
    IF NEW.tipo = 'entrada' THEN
        -- Insertar o actualizar con la primera entrada del día
        INSERT INTO resumen_diario (id_empleado, fecha, hora_entrada, estado_jornada)
        VALUES (NEW.id_empleado, NEW.fecha, TIME(NEW.fecha_hora), 'sin_salida')
        ON DUPLICATE KEY UPDATE
            hora_entrada   = IF(hora_entrada IS NULL, TIME(NEW.fecha_hora), hora_entrada),
            estado_jornada = 'sin_salida';
    END IF;

    IF NEW.tipo = 'salida' THEN
        -- Obtener la entrada del mismo día para calcular horas
        SELECT hora_entrada INTO v_entrada
        FROM resumen_diario
        WHERE id_empleado = NEW.id_empleado AND fecha = NEW.fecha;

        SELECT horas_jornada INTO v_jornada
        FROM empleados WHERE id = NEW.id_empleado;

        IF v_entrada IS NOT NULL THEN
            SET v_salida = TIME(NEW.fecha_hora);
            -- Horas laboradas = diferencia en horas decimales
            SET v_horas  = TIMESTAMPDIFF(MINUTE,
                               TIMESTAMP(NEW.fecha, v_entrada),
                               TIMESTAMP(NEW.fecha, v_salida)) / 60.0;
            -- Horas extras = lo que supere la jornada estándar (mínimo 0)
            SET v_extras = IF(v_horas > v_jornada, v_horas - v_jornada, 0);

            UPDATE resumen_diario
            SET hora_salida     = v_salida,
                horas_laboradas = v_horas,
                horas_extras    = v_extras,
                estado_jornada  = 'completa'
            WHERE id_empleado = NEW.id_empleado AND fecha = NEW.fecha;
        END IF;
    END IF;

    -- ── 2. Generar alertas automáticas ───────────────────

    -- Alerta: GPS fuera del perímetro
    IF NEW.dentro_perimetro = 0 THEN
        INSERT INTO alertas (id_asistencia, id_empleado, tipo_alerta, descripcion)
        VALUES (NEW.id, NEW.id_empleado, 'gps_fuera_perimetro',
                CONCAT('Marcada a ', NEW.distancia_metros, ' m del perímetro autorizado'));
    END IF;

    -- Alerta: dispositivo no registrado en la tabla dispositivos_autorizados
    IF NEW.dispositivo_autorizado = 0 AND NEW.device_id IS NOT NULL THEN
        INSERT INTO alertas (id_asistencia, id_empleado, tipo_alerta, descripcion)
        VALUES (NEW.id, NEW.id_empleado, 'dispositivo_no_registrado',
                CONCAT('Device ID no registrado: ', LEFT(NEW.device_id, 40), '...'));
    END IF;

    -- Alerta: dispositivo compartido (mismo device_id usado por otro empleado hoy)
    IF NEW.device_id IS NOT NULL THEN
        SELECT COUNT(DISTINCT id_empleado) INTO v_device_cnt
        FROM asistencias
        WHERE device_id   = NEW.device_id
          AND fecha        = NEW.fecha
          AND id_empleado != NEW.id_empleado
          AND estado      != 'rechazada';

        IF v_device_cnt > 0 THEN
            INSERT INTO alertas (id_asistencia, id_empleado, tipo_alerta, descripcion)
            VALUES (NEW.id, NEW.id_empleado, 'dispositivo_compartido',
                    'El mismo dispositivo fue usado por otro empleado hoy');
        END IF;
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `configuracion_gps`
--

DROP TABLE IF EXISTS `configuracion_gps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_gps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitud` decimal(10,8) NOT NULL,
  `longitud` decimal(11,8) NOT NULL,
  `radio_metros` int NOT NULL DEFAULT '200',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_gps`
--

LOCK TABLES `configuracion_gps` WRITE;
/*!40000 ALTER TABLE `configuracion_gps` DISABLE KEYS */;
INSERT INTO `configuracion_gps` VALUES (1,'Edificio Municipal Danlí',14.02650000,-86.57810000,200,1);
/*!40000 ALTER TABLE `configuracion_gps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamentos`
--

LOCK TABLES `departamentos` WRITE;
/*!40000 ALTER TABLE `departamentos` DISABLE KEYS */;
INSERT INTO `departamentos` VALUES (1,'Alcaldía',1,'2026-06-01 15:25:26'),(2,'Gerencia Administrativa Financiera',1,'2026-06-01 15:25:26'),(3,'Recursos Humanos',1,'2026-06-01 15:25:26'),(4,'Compras y Suministros',1,'2026-06-01 15:25:26'),(5,'Bienes y Proveeduría',1,'2026-06-01 15:25:26'),(6,'Contabilidad',1,'2026-06-01 15:25:26'),(7,'Catastro',1,'2026-06-01 15:25:26'),(8,'Obras Públicas',1,'2026-06-01 15:25:26'),(9,'Desarrollo Comunitario',1,'2026-06-01 15:25:26'),(10,'Tecnología de Información',1,'2026-06-01 15:25:26'),(11,'Oficina de Información Pública',1,'2026-06-01 15:25:26');
/*!40000 ALTER TABLE `departamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispositivos_autorizados`
--

DROP TABLE IF EXISTS `dispositivos_autorizados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositivos_autorizados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `device_id` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plataforma` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `registrado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_empleado_activo` (`id_empleado`,`activo`),
  CONSTRAINT `dispositivos_autorizados_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispositivos_autorizados`
--

LOCK TABLES `dispositivos_autorizados` WRITE;
/*!40000 ALTER TABLE `dispositivos_autorizados` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispositivos_autorizados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pin` char(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_departamento` int NOT NULL,
  `cargo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horas_jornada` decimal(4,2) NOT NULL DEFAULT '8.00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleados`
--

LOCK TABLES `empleados` WRITE;
/*!40000 ALTER TABLE `empleados` DISABLE KEYS */;
INSERT INTO `empleados` VALUES (1,'0101199012345','María José','Hernández López','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVzCBgHqEG',3,'Analista de RRHH',NULL,NULL,8.00,1,'2026-06-01 15:25:28','2026-06-01 15:25:28'),(2,'0101198554321','Carlos Iván','Mejía Rodríguez','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVzCBgHqEG',10,'Técnico de TI',NULL,NULL,8.00,1,'2026-06-01 15:25:28','2026-06-01 15:25:28'),(3,'0101199087654','Ana Lucía','Torres Aguilar','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVzCBgHqEG',6,'Contadora',NULL,NULL,8.00,1,'2026-06-01 15:25:28','2026-06-01 15:25:28');
/*!40000 ALTER TABLE `empleados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resumen_diario`
--

DROP TABLE IF EXISTS `resumen_diario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resumen_diario` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time DEFAULT NULL,
  `hora_salida` time DEFAULT NULL,
  `horas_laboradas` decimal(5,2) DEFAULT NULL,
  `horas_extras` decimal(5,2) DEFAULT '0.00',
  `estado_jornada` enum('completa','sin_salida','sin_entrada','dia_libre') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sin_salida',
  `calculado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_empleado_fecha` (`id_empleado`,`fecha`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `resumen_diario_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resumen_diario`
--

LOCK TABLES `resumen_diario` WRITE;
/*!40000 ALTER TABLE `resumen_diario` DISABLE KEYS */;
/*!40000 ALTER TABLE `resumen_diario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesiones_admin`
--

DROP TABLE IF EXISTS `sesiones_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones_admin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `token_jti` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_origen` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispositivo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iniciada_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expira_en` datetime NOT NULL,
  `invalidada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token_jti`),
  KEY `idx_usuario_activo` (`id_usuario`,`invalidada`),
  CONSTRAINT `sesiones_admin_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios_admin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesiones_admin`
--

LOCK TABLES `sesiones_admin` WRITE;
/*!40000 ALTER TABLE `sesiones_admin` DISABLE KEYS */;
/*!40000 ALTER TABLE `sesiones_admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_admin`
--

DROP TABLE IF EXISTS `usuarios_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasena` char(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('superadmin','admin','viewer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultimo_acceso` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_admin`
--

LOCK TABLES `usuarios_admin` WRITE;
/*!40000 ALTER TABLE `usuarios_admin` DISABLE KEYS */;
INSERT INTO `usuarios_admin` VALUES (1,'admin','$2b$10$REEMPLAZAR_CON_HASH_BCRYPT','Administrador del Sistema','superadmin',1,NULL,'2026-06-01 15:25:26');
/*!40000 ALTER TABLE `usuarios_admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_estado_empleados_hoy`
--

DROP TABLE IF EXISTS `v_estado_empleados_hoy`;
/*!50001 DROP VIEW IF EXISTS `v_estado_empleados_hoy`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_estado_empleados_hoy` AS SELECT 
 1 AS `id`,
 1 AS `dni`,
 1 AS `nombre_completo`,
 1 AS `departamento`,
 1 AS `cargo`,
 1 AS `ultima_marcada`,
 1 AS `hora_ultima_marcada`,
 1 AS `estado_actual`,
 1 AS `dentro_perimetro`,
 1 AS `estado_marcada`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_reporte_diario`
--

DROP TABLE IF EXISTS `v_reporte_diario`;
/*!50001 DROP VIEW IF EXISTS `v_reporte_diario`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_reporte_diario` AS SELECT 
 1 AS `fecha`,
 1 AS `dni`,
 1 AS `nombre_completo`,
 1 AS `departamento`,
 1 AS `hora_entrada`,
 1 AS `hora_salida`,
 1 AS `horas_laboradas`,
 1 AS `horas_extras`,
 1 AS `estado_jornada`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'scam_danli'
--

--
-- Dumping routines for database 'scam_danli'
--

--
-- Final view structure for view `v_estado_empleados_hoy`
--

/*!50001 DROP VIEW IF EXISTS `v_estado_empleados_hoy`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_estado_empleados_hoy` AS select `e`.`id` AS `id`,`e`.`dni` AS `dni`,concat(`e`.`nombres`,' ',`e`.`apellidos`) AS `nombre_completo`,`d`.`nombre` AS `departamento`,`e`.`cargo` AS `cargo`,`a`.`tipo` AS `ultima_marcada`,`a`.`fecha_hora` AS `hora_ultima_marcada`,(case when (`a`.`tipo` = 'entrada') then 'PRESENTE' else 'FUERA' end) AS `estado_actual`,`a`.`dentro_perimetro` AS `dentro_perimetro`,`a`.`estado` AS `estado_marcada` from ((`empleados` `e` join `departamentos` `d` on((`d`.`id` = `e`.`id_departamento`))) left join `asistencias` `a` on((`a`.`id` = (select `asistencias`.`id` from `asistencias` where ((`asistencias`.`id_empleado` = `e`.`id`) and (`asistencias`.`fecha` = curdate()) and (`asistencias`.`estado` <> 'rechazada')) order by `asistencias`.`fecha_hora` desc limit 1)))) where (`e`.`activo` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_reporte_diario`
--

/*!50001 DROP VIEW IF EXISTS `v_reporte_diario`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_reporte_diario` AS select `rd`.`fecha` AS `fecha`,`e`.`dni` AS `dni`,concat(`e`.`nombres`,' ',`e`.`apellidos`) AS `nombre_completo`,`d`.`nombre` AS `departamento`,`rd`.`hora_entrada` AS `hora_entrada`,`rd`.`hora_salida` AS `hora_salida`,`rd`.`horas_laboradas` AS `horas_laboradas`,`rd`.`horas_extras` AS `horas_extras`,`rd`.`estado_jornada` AS `estado_jornada` from ((`resumen_diario` `rd` join `empleados` `e` on((`e`.`id` = `rd`.`id_empleado`))) join `departamentos` `d` on((`d`.`id` = `e`.`id_departamento`))) order by `rd`.`fecha` desc,`d`.`nombre`,`e`.`apellidos` */;
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

-- Dump completed on 2026-06-01 15:31:58
