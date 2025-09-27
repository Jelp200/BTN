/*
* #######################################################################################################################################
*       Archivo: CabinasData.sql
*       Proyecto: Botonera (BTN)
*       SO: Windows 11
*       Herramientas:
*           - Visual Studio Code
*           - MySQL Workbench
*      Compilador:
*           - MySQL 8.0
*      Autor:
*           - Jorge Peña (Jelp200)
*      Descripción:
*          Script que permite insertar los comandos iniciales en la base de datos para las cabinas de control.
* ######################################################################################################################################
*/

USE CabinasDB;

--- ===========================================
--- INSERCIÓN DE DATOS EN LA TABLA CABINAS
--- ===========================================
INSERT INTO Cabinas (nombre, descripcion) VALUES
('Cabina 1', 'Cabina de control número 1'),
('Cabina 2', 'Cabina de control número 2');

--- ===========================================
--- INSERCIÓN DE DATOS EN LA TABLA COMANDOS
--- Cabina 1
--- ===========================================
INSERT INTO Comandos (cabina_id, codigo_comando, categoria, tipo, sensor) VALUES
(1, '000', 'Apagado Air', 'Actuador', 'N/A'),   (1, '001', 'Encendido Air', 'Actuador', 'N/A'),
(1, '002', 'Apagado Cal', 'Actuador', 'N/A'),   (1, '003', 'Encendido Cal', 'Actuador', 'N/A'),
(1, '004', 'Apagado Hum', 'Actuador', 'N/A'),   (1, '005', 'Encendido Hum', 'Actuador', 'N/A'),
(1, '006', 'Apagado Vib', 'Actuador', 'N/A'),   (1, '007', 'Encendido Vib', 'Actuador', 'N/A'),
(1, '008', 'Apagado Ven', 'Actuador', 'N/A'),   (1, '009', 'Encendido Ven', 'Actuador', 'N/A'),
(1, '010', 'Apagado Ext', 'Actuador', 'N/A'),   (1, '011', 'Encendido Ext', 'Actuador', 'N/A'),
(1, '012', 'Apagado Dsh', 'Actuador', 'N/A'),   (1, '013', 'Encendido Dsh', 'Actuador', 'N/A'),
(1, '014', 'Apagado Hum', 'Actuador', 'N/A'),   (1, '015', 'Encendido Hum', 'Actuador', 'N/A'),
(1, '016', 'Apagado Sht', 'Actuador', 'N/A'),   (1, '017', 'Encendido Sht', 'Actuador', 'N/A'),
(1, '018', '', 'Actuador', 'N/A'),  (1, '019', '', 'Actuador', 'N/A'),
(1, '020', '', 'Actuador', 'N/A'),  (1, '021', '', 'Actuador', 'N/A'),
(1, '022', '', 'Actuador', 'N/A'),  (1, '023', '', 'Actuador', 'N/A'),
(1, '024', '', 'Actuador', 'N/A'),  (1, '025', '', 'Actuador', 'N/A'),
(1, '026', '', 'Actuador', 'N/A'),  (1, '027', '', 'Actuador', 'N/A'),
(1, '028', '', 'Actuador', 'N/A'),  (1, '029', '', 'Actuador', 'N/A'),
(1, '030', '', 'Actuador', 'N/A'),  (1, '031', '', 'Actuador', 'N/A'),
(1, '032', '', 'Actuador', 'N/A'),  (1, '033', '', 'Actuador', 'N/A'),
(1, '034', '', 'Actuador', 'N/A'),  (1, '035', 'Play', 'Actuador', 'N/A'),
(1, '036', 'Vol+', 'Actuador', 'N/A'),  (1, '037', 'Vol-', 'Actuador', 'N/A'),
(1, '038', 'Stop', 'Actuador', 'N/A'),  (1, '039', 'Pis1', 'Actuador', 'N/A'),
(1, '040', 'Pis2', 'Actuador', 'N/A'),  (1, '041', 'Pis3', 'Actuador', 'N/A'),
(1, '042', 'Pis4', 'Actuador', 'N/A'),  (1, '043', 'Pis5', 'Actuador', 'N/A'),
(1, '044', 'Pis6', 'Actuador', 'N/A'),  (1, '045', 'Pis7', 'Actuador', 'N/A'),
(1, '046', 'Pis8', 'Actuador', 'N/A'),  (1, '047', 'Pis9', 'Actuador', 'N/A'),
(1, '048', 'Pis10', 'Actuador', 'N/A'),  (1, '049', 'Pis11', 'Actuador', 'N/A'),
(1, '050', 'Pis12', 'Actuador', 'N/A'),  (1, '051', '', 'Actuador', 'N/A'),
(1, '052', '', 'Actuador', 'N/A'),  (1, '053', '', 'Actuador', 'N/A'),
(1, '054', '', 'Actuador', 'N/A'),  (1, '055', '', 'Actuador', 'N/A'),
(1, '056', '', 'Actuador', 'N/A'),  (1, '057', '', 'Actuador', 'N/A'),
(1, '058', '', 'Actuador', 'N/A'),  (1, '059', '', 'Actuador', 'N/A'),
(1, '060', '', 'Actuador', 'N/A'),  (1, '061', '', 'Actuador', 'N/A'),
(1, '062', '', 'Actuador', 'N/A'),  (1, '063', '', 'Actuador', 'N/A'),
(1, '064', '', 'Actuador', 'N/A'),  (1, '065', '', 'Actuador', 'N/A'),
(1, '066', '', 'Actuador', 'N/A'),  (1, '067', '', 'Actuador', 'N/A'),
(1, '068', '', 'Actuador', 'N/A'),  (1, '069', '', 'Actuador', 'N/A'),
(1, '070', 'Pis13', 'Actuador', 'N/A'),  (1, '071', 'Pis14', 'Actuador', 'N/A'),
(1, '072', 'Pis15', 'Actuador', 'N/A'),  (1, '073', 'Pis16', 'Actuador', 'N/A'),
(1, '074', 'Pis17', 'Actuador', 'N/A'),  (1, '075', 'Pis18', 'Actuador', 'N/A'),
(1, '076', 'Pis19', 'Actuador', 'N/A'),  (1, '077', 'Pis20', 'Actuador', 'N/A'),
(1, '078', 'Pis21', 'Actuador', 'N/A'),  (1, '079', 'Pis22', 'Actuador', 'N/A'),
(1, '080', 'Pis23', 'Actuador', 'N/A'),  (1, '081', 'Pis24', 'Actuador', 'N/A'),
(1, '082', 'Pis25', 'Actuador', 'N/A'),  (1, '083', 'Pis26', 'Actuador', 'N/A'),
(1, '084', 'Pis27', 'Actuador', 'N/A'),  (1, '085', 'Pis28', 'Actuador', 'N/A'),
(1, '086', 'Pis29', 'Actuador', 'N/A'),  (1, '087', 'Pis30', 'Actuador', 'N/A'),
(1, '088', '', 'Actuador', 'N/A'),  (1, '089', '', 'Actuador', 'N/A'),
(1, '090', '', 'Actuador', 'N/A'),  (1, '091', '', 'Actuador', 'N/A'),
(1, '092', '', 'Actuador', 'N/A'),  (1, '093', '', 'Actuador', 'N/A'),
(1, '094', '', 'Actuador', 'N/A'),  (1, '095', '', 'Actuador', 'N/A'),
(1, '096', '', 'Actuador', 'N/A'),  (1, '097', '', 'Actuador', 'N/A'),
(1, '098', '', 'Actuador', 'N/A'),  (1, '099', '', 'Actuador', 'N/A'),
(1, '100', 'APRGB', 'Actuador', 'N/A'),  (1, '101', 'ENCLC', 'Actuador', 'N/A'),
(1, '102', 'ENCLF', 'Actuador', 'N/A'),  (1, '103', 'ENCLN', 'Actuador', 'N/A'),
(1, '104', 'ENCLR', 'Actuador', 'N/A'),  (1, '105', 'ENCLOR', 'Actuador', 'N/A'),
(1, '106', 'ENCDO', 'Actuador', 'N/A'),  (1, '107', 'ENCOY', 'Actuador', 'N/A'),
(1, '108', 'ENCLY', 'Actuador', 'N/A'),  (1, '109', 'ENCLB', 'Actuador', 'N/A'),
(1, '110', 'ENCDB', 'Actuador', 'N/A'),  (1, '111', 'ENCMD', 'Actuador', 'N/A'),
(1, '112', 'ENCLP', 'Actuador', 'N/A'),  (1, '113', 'ENCLV', 'Actuador', 'N/A'),
(1, '114', 'ENCLG', 'Actuador', 'N/A'),  (1, '115', 'ENCLA', 'Actuador', 'N/A'),
(1, '116', 'ENCLI', 'Actuador', 'N/A'),  (1, '117', 'ENCSG', 'Actuador', 'N/A'),
(1, '118', 'ENCLT', 'Actuador', 'N/A'),  (1, '119', 'STROB', 'Actuador', 'N/A'),
(1, '120', 'FLASH', 'Actuador', 'N/A'),  (1, '121', 'BRIL+', 'Actuador', 'N/A'),
(1, '122', 'BRI-', 'Actuador', 'N/A');

--- ===========================================
--- INSERCIÓN DE DATOS EN LA TABLA COMANDOS
--- Cabina 2
--- ===========================================
INSERT INTO Comandos (cabina_id, codigo_comando, categoria, tipo, sensor) VALUES
(2, '000', 'Apagado Air', 'Actuador', 'N/A'),   (2, '001', 'Encendido Air', 'Actuador', 'N/A'),
(2, '002', 'Apagado Cal', 'Actuador', 'N/A'),   (2, '003', 'Encendido Cal', 'Actuador', 'N/A'),
(2, '004', 'Apagado Hum', 'Actuador', 'N/A'),   (2, '005', 'Encendido Hum', 'Actuador', 'N/A'),
(2, '006', 'Apagado Vib', 'Actuador', 'N/A'),   (2, '007', 'Encendido Vib', 'Actuador', 'N/A'),
(2, '008', 'Apagado Ven', 'Actuador', 'N/A'),   (2, '009', 'Encendido Ven', 'Actuador', 'N/A'),
(2, '010', 'Apagado Ext', 'Actuador', 'N/A'),   (2, '011', 'Encendido Ext', 'Actuador', 'N/A'),
(2, '012', 'Apagado Dsh', 'Actuador', 'N/A'),   (2, '013', 'Encendido Dsh', 'Actuador', 'N/A'),
(2, '014', 'Apagado Hum', 'Actuador', 'N/A'),   (2, '015', 'Encendido Hum', 'Actuador', 'N/A'),
(2, '016', 'Apagado Sht', 'Actuador', 'N/A'),   (2, '017', 'Encendido Sht', 'Actuador', 'N/A'),
(2, '018', '', 'Actuador', 'N/A'),  (2, '019', '', 'Actuador', 'N/A'),
(2, '020', '', 'Actuador', 'N/A'),  (2, '021', '', 'Actuador', 'N/A'),
(2, '022', '', 'Actuador', 'N/A'),  (2, '023', '', 'Actuador', 'N/A'),
(2, '024', '', 'Actuador', 'N/A'),  (2, '025', '', 'Actuador', 'N/A'),
(2, '026', '', 'Actuador', 'N/A'),  (2, '027', '', 'Actuador', 'N/A'),
(2, '028', '', 'Actuador', 'N/A'),  (2, '029', '', 'Actuador', 'N/A'),
(2, '030', '', 'Actuador', 'N/A'),  (2, '031', '', 'Actuador', 'N/A'),
(2, '032', '', 'Actuador', 'N/A'),  (2, '033', '', 'Actuador', 'N/A'),
(2, '034', '', 'Actuador', 'N/A'),  (2, '035', 'Play', 'Actuador', 'N/A'),
(2, '036', 'Vol+', 'Actuador', 'N/A'),  (2, '037', 'Vol-', 'Actuador', 'N/A'),
(2, '038', 'Stop', 'Actuador', 'N/A'),  (2, '039', 'Pis1', 'Actuador', 'N/A'),
(2, '040', 'Pis2', 'Actuador', 'N/A'),  (2, '041', 'Pis3', 'Actuador', 'N/A'),
(2, '042', 'Pis4', 'Actuador', 'N/A'),  (2, '043', 'Pis5', 'Actuador', 'N/A'),
(2, '044', 'Pis6', 'Actuador', 'N/A'),  (2, '045', 'Pis7', 'Actuador', 'N/A'),
(2, '046', 'Pis8', 'Actuador', 'N/A'),  (2, '047', 'Pis9', 'Actuador', 'N/A'),
(2, '048', 'Pis10', 'Actuador', 'N/A'),  (2, '049', 'Pis11', 'Actuador', 'N/A'),
(2, '050', 'Pis12', 'Actuador', 'N/A'),  (2, '051', '', 'Actuador', 'N/A'),
(2, '052', '', 'Actuador', 'N/A'),  (2, '053', '', 'Actuador', 'N/A'),
(2, '054', '', 'Actuador', 'N/A'),  (2, '055', '', 'Actuador', 'N/A'),
(2, '056', '', 'Actuador', 'N/A'),  (2, '057', '', 'Actuador', 'N/A'),
(2, '058', '', 'Actuador', 'N/A'),  (2, '059', '', 'Actuador', 'N/A'),
(2, '060', '', 'Actuador', 'N/A'),  (2, '061', '', 'Actuador', 'N/A'),
(2, '062', '', 'Actuador', 'N/A'),  (2, '063', '', 'Actuador', 'N/A'),
(2, '064', '', 'Actuador', 'N/A'),  (2, '065', '', 'Actuador', 'N/A'),
(2, '066', '', 'Actuador', 'N/A'),  (2, '067', '', 'Actuador', 'N/A'),
(2, '068', '', 'Actuador', 'N/A'),  (2, '069', '', 'Actuador', 'N/A'),
(2, '070', 'Pis13', 'Actuador', 'N/A'),  (2, '071', 'Pis14', 'Actuador', 'N/A'),
(2, '072', 'Pis15', 'Actuador', 'N/A'),  (2, '073', 'Pis16', 'Actuador', 'N/A'),
(2, '074', 'Pis17', 'Actuador', 'N/A'),  (2, '075', 'Pis18', 'Actuador', 'N/A'),
(2, '076', 'Pis19', 'Actuador', 'N/A'),  (2, '077', 'Pis20', 'Actuador', 'N/A'),
(2, '078', 'Pis21', 'Actuador', 'N/A'),  (2, '079', 'Pis22', 'Actuador', 'N/A'),
(2, '080', 'Pis23', 'Actuador', 'N/A'),  (2, '081', 'Pis24', 'Actuador', 'N/A'),
(2, '082', 'Pis25', 'Actuador', 'N/A'),  (2, '083', 'Pis26', 'Actuador', 'N/A'),
(2, '084', 'Pis27', 'Actuador', 'N/A'),  (2, '085', 'Pis28', 'Actuador', 'N/A'),
(2, '086', 'Pis29', 'Actuador', 'N/A'),  (2, '087', 'Pis30', 'Actuador', 'N/A'),
(2, '088', '', 'Actuador', 'N/A'),  (2, '089', '', 'Actuador', 'N/A'),
(2, '090', '', 'Actuador', 'N/A'),  (2, '091', '', 'Actuador', 'N/A'),
(2, '092', '', 'Actuador', 'N/A'),  (2, '093', '', 'Actuador', 'N/A'),
(2, '094', '', 'Actuador', 'N/A'),  (2, '095', '', 'Actuador', 'N/A'),
(2, '096', '', 'Actuador', 'N/A'),  (2, '097', '', 'Actuador', 'N/A'),
(2, '098', '', 'Actuador', 'N/A'),  (2, '099', '', 'Actuador', 'N/A'),
(2, '100', 'APRGB', 'Actuador', 'N/A'),  (2, '101', 'ENCLC', 'Actuador', 'N/A'),
(2, '102', 'ENCLF', 'Actuador', 'N/A'),  (2, '103', 'ENCLN', 'Actuador', 'N/A'),
(2, '104', 'ENCLR', 'Actuador', 'N/A'),  (2, '105', 'ENCLOR', 'Actuador', 'N/A'),
(2, '106', 'ENCDO', 'Actuador', 'N/A'),  (2, '107', 'ENCOY', 'Actuador', 'N/A'),
(2, '108', 'ENCLY', 'Actuador', 'N/A'),  (2, '109', 'ENCLB', 'Actuador', 'N/A'),
(2, '110', 'ENCDB', 'Actuador', 'N/A'),  (2, '111', 'ENCMD', 'Actuador', 'N/A'),
(2, '112', 'ENCLP', 'Actuador', 'N/A'),  (2, '113', 'ENCLV', 'Actuador', 'N/A'),
(2, '114', 'ENCLG', 'Actuador', 'N/A'),  (2, '115', 'ENCLA', 'Actuador', 'N/A'),
(2, '116', 'ENCLI', 'Actuador', 'N/A'),  (2, '117', 'ENCSG', 'Actuador', 'N/A'),
(2, '118', 'ENCLT', 'Actuador', 'N/A'),  (2, '119', 'STROB', 'Actuador', 'N/A'),
(2, '120', 'FLASH', 'Actuador', 'N/A'),  (2, '121', 'BRIL+', 'Actuador', 'N/A'),
(2, '122', 'BRI-', 'Actuador', 'N/A');