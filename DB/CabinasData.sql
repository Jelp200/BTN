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
INSERT INTO Comandos (codigo_comando, cabina_id, categoria, tipo, sensor) VALUES
('000', 1, 'Apagado Air', 'Actuador', 'N/A'),   ('001', 1, 'Encendido Air', 'Actuador', 'N/A'),
('002', 1, 'Apagado Cal', 'Actuador', 'N/A'),   ('003', 1, 'Encendido Cal', 'Actuador', 'N/A'),
('004', 1, 'Apagado Hum', 'Actuador', 'N/A'),   ('005', 1, 'Encendido Hum', 'Actuador', 'N/A'),
('006', 1, 'Apagado Vib', 'Actuador', 'N/A'),   ('007', 1, 'Encendido Vib', 'Actuador', 'N/A'),
('008', 1, 'Apagado Ven', 'Actuador', 'N/A'),   ('009', 1, 'Encendido Ven', 'Actuador', 'N/A'),
('010', 1, 'Apagado Ext', 'Actuador', 'N/A'),   ('011', 1, 'Encendido Ext', 'Actuador', 'N/A'),
('012', 1, 'Apagado Dsh', 'Actuador', 'N/A'),   ('013', 1, 'Encendido Dsh', 'Actuador', 'N/A'),
('014', 1, 'Apagado Hum', 'Actuador', 'N/A'),   ('015', 1, 'Encendido Hum', 'Actuador', 'N/A'),
('016', 1, 'Apagado Sht', 'Actuador', 'N/A'),   ('017', 1, 'Encendido Sht', 'Actuador', 'N/A'),
('018', 1, '', 'Actuador', 'N/A'),  ('019', 1, '', 'Actuador', 'N/A'),
('020', 1, '', 'Actuador', 'N/A'),  ('021', 1, '', 'Actuador', 'N/A'),
('022', 1, '', 'Actuador', 'N/A'),  ('023', 1, '', 'Actuador', 'N/A'),
('024', 1, '', 'Actuador', 'N/A'),  ('025', 1, '', 'Actuador', 'N/A'),
('026', 1, '', 'Actuador', 'N/A'),  ('027', 1, '', 'Actuador', 'N/A'),
('028', 1, '', 'Actuador', 'N/A'),  ('029', 1, '', 'Actuador', 'N/A'),
('030', 1, '', 'Actuador', 'N/A'),  ('031', 1, '', 'Actuador', 'N/A'),
('032', 1, '', 'Actuador', 'N/A'),  ('033', 1, '', 'Actuador', 'N/A'),
('034', 1, '', 'Actuador', 'N/A'),  ('035', 1, 'Play', 'Actuador', 'N/A'),
('036', 1, 'Vol+', 'Actuador', 'N/A'),  ('037', 1, 'Vol-', 'Actuador', 'N/A'),
('038', 1, 'Stop', 'Actuador', 'N/A'),  ('039', 1, 'Pis1', 'Actuador', 'N/A'),
('040', 1, 'Pis2', 'Actuador', 'N/A'),  ('041', 1, 'Pis3', 'Actuador', 'N/A'),
('042', 1, 'Pis4', 'Actuador', 'N/A'),  ('043', 1, 'Pis5', 'Actuador', 'N/A'),
('044', 1, 'Pis6', 'Actuador', 'N/A'),  ('045', 1, 'Pis7', 'Actuador', 'N/A'),
('046', 1, 'Pis8', 'Actuador', 'N/A'),  ('047', 1, 'Pis9', 'Actuador', 'N/A'),
('048', 1, 'Pis10', 'Actuador', 'N/A'),  ('049', 1, 'Pis11', 'Actuador', 'N/A'),
('050', 1, 'Pis12', 'Actuador', 'N/A'),  ('051', 1, '', 'Actuador', 'N/A'),
('052', 1, '', 'Actuador', 'N/A'),  ('053', 1, '', 'Actuador', 'N/A'),
('054', 1, '', 'Actuador', 'N/A'),  ('055', 1, '', 'Actuador', 'N/A'),
('056', 1, '', 'Actuador', 'N/A'),  ('057', 1, '', 'Actuador', 'N/A'),
('058', 1, '', 'Actuador', 'N/A'),  ('059', 1, '', 'Actuador', 'N/A'),
('060', 1, '', 'Actuador', 'N/A'),  ('061', 1, '', 'Actuador', 'N/A'),
('062', 1, '', 'Actuador', 'N/A'),  ('063', 1, '', 'Actuador', 'N/A'),
('064', 1, '', 'Actuador', 'N/A'),  ('065', 1, '', 'Actuador', 'N/A'),
('066', 1, '', 'Actuador', 'N/A'),  ('067', 1, '', 'Actuador', 'N/A'),
('068', 1, '', 'Actuador', 'N/A'),  ('069', 1, '', 'Actuador', 'N/A'),
('070', 1, 'Pis13', 'Actuador', 'N/A'),  ('071', 1, 'Pis14', 'Actuador', 'N/A'),
('072', 1, 'Pis15', 'Actuador', 'N/A'),  ('073', 1, 'Pis16', 'Actuador', 'N/A'),
('074', 1, 'Pis17', 'Actuador', 'N/A'),  ('075', 1, 'Pis18', 'Actuador', 'N/A'),
('076', 1, 'Pis19', 'Actuador', 'N/A'),  ('077', 1, 'Pis20', 'Actuador', 'N/A'),
('078', 1, 'Pis21', 'Actuador', 'N/A'),  ('079', 1, 'Pis22', 'Actuador', 'N/A'),
('080', 1, 'Pis23', 'Actuador', 'N/A'),  ('081', 1, 'Pis24', 'Actuador', 'N/A'),
('082', 1, 'Pis25', 'Actuador', 'N/A'),  ('083', 1, 'Pis26', 'Actuador', 'N/A'),
('084', 1, 'Pis27', 'Actuador', 'N/A'),  ('085', 1, 'Pis28', 'Actuador', 'N/A'),
('086', 1, 'Pis29', 'Actuador', 'N/A'),  ('087', 1, 'Pis30', 'Actuador', 'N/A'),
('088', 1, '', 'Actuador', 'N/A'),  ('089', 1, '', 'Actuador', 'N/A'),
('090', 1, '', 'Actuador', 'N/A'),  ('091', 1, '', 'Actuador', 'N/A'),
('092', 1, '', 'Actuador', 'N/A'),  ('093', 1, '', 'Actuador', 'N/A'),
('094', 1, '', 'Actuador', 'N/A'),  ('095', 1, '', 'Actuador', 'N/A'),
('096', 1, '', 'Actuador', 'N/A'),  ('097', 1, '', 'Actuador', 'N/A'),
('098', 1, '', 'Actuador', 'N/A'),  ('099', 1, '', 'Actuador', 'N/A'),
('100', 1, 'APRGB', 'Actuador', 'N/A'),  ('101', 1, 'ENCLC', 'Actuador', 'N/A'),
('102', 1, 'ENCLF', 'Actuador', 'N/A'),  ('103', 1, 'ENCLN', 'Actuador', 'N/A'),
('104', 1, 'ENCLR', 'Actuador', 'N/A'),  ('105', 1, 'ENCLOR', 'Actuador', 'N/A'),
('106', 1, 'ENCDO', 'Actuador', 'N/A'),  ('107', 1, 'ENCOY', 'Actuador', 'N/A'),
('108', 1, 'ENCLY', 'Actuador', 'N/A'),  ('109', 1, 'ENCLB', 'Actuador', 'N/A'),
('110', 1, 'ENCDB', 'Actuador', 'N/A'),  ('111', 1, 'ENCMD', 'Actuador', 'N/A'),
('112', 1, 'ENCLP', 'Actuador', 'N/A'),  ('113', 1, 'ENCLV', 'Actuador', 'N/A'),
('114', 1, 'ENCLG', 'Actuador', 'N/A'),  ('115', 1, 'ENCLA', 'Actuador', 'N/A'),
('116', 1, 'ENCLI', 'Actuador', 'N/A'),  ('117', 1, 'ENCSG', 'Actuador', 'N/A'),
('118', 1, 'ENCLT', 'Actuador', 'N/A'),  ('119', 1, 'STROB', 'Actuador', 'N/A'),
('120', 1, 'FLASH', 'Actuador', 'N/A'),  ('121', 1, 'BRIL+', 'Actuador', 'N/A'),
('122', 1, 'BRI-', 'Actuador', 'N/A');

--- ===========================================
--- INSERCIÓN DE DATOS EN LA TABLA COMANDOS
--- Cabina 2
--- ===========================================
INSERT INTO Comandos (codigo_comando, cabina_id, categoria, tipo, sensor) VALUES
('000', 2, 'Apagado Air', 'Actuador', 'N/A'),   ('001', 2, 'Encendido Air', 'Actuador', 'N/A'),
('002', 2, 'Apagado Cal', 'Actuador', 'N/A'),   ('003', 2, 'Encendido Cal', 'Actuador', 'N/A'),
('004', 2, 'Apagado Hum', 'Actuador', 'N/A'),   ('005', 2, 'Encendido Hum', 'Actuador', 'N/A'),
('006', 2, 'Apagado Vib', 'Actuador', 'N/A'),   ('007', 2, 'Encendido Vib', 'Actuador', 'N/A'),
('008', 2, 'Apagado Ven', 'Actuador', 'N/A'),   ('009', 2, 'Encendido Ven', 'Actuador', 'N/A'),
('010', 2, 'Apagado Ext', 'Actuador', 'N/A'),   ('011', 2, 'Encendido Ext', 'Actuador', 'N/A'),
('012', 2, 'Apagado Dsh', 'Actuador', 'N/A'),   ('013', 2, 'Encendido Dsh', 'Actuador', 'N/A'),
('014', 2, 'Apagado Hum', 'Actuador', 'N/A'),   ('015', 2, 'Encendido Hum', 'Actuador', 'N/A'),
('016', 2, 'Apagado Sht', 'Actuador', 'N/A'),   ('017', 2, 'Encendido Sht', 'Actuador', 'N/A'),
('018', 2, '', 'Actuador', 'N/A'),  ('019', 2, '', 'Actuador', 'N/A'),
('020', 2, '', 'Actuador', 'N/A'),  ('021', 2, '', 'Actuador', 'N/A'),
('022', 2, '', 'Actuador', 'N/A'),  ('023', 2, '', 'Actuador', 'N/A'),
('024', 2, '', 'Actuador', 'N/A'),  ('025', 2, '', 'Actuador', 'N/A'),
('026', 2, '', 'Actuador', 'N/A'),  ('027', 2, '', 'Actuador', 'N/A'),
('028', 2, '', 'Actuador', 'N/A'),  ('029', 2, '', 'Actuador', 'N/A'),
('030', 2, '', 'Actuador', 'N/A'),  ('031', 2, '', 'Actuador', 'N/A'),
('032', 2, '', 'Actuador', 'N/A'),  ('033', 2, '', 'Actuador', 'N/A'),
('034', 2, '', 'Actuador', 'N/A'),  ('035', 2, 'Play', 'Actuador', 'N/A'),
('036', 2, 'Vol+', 'Actuador', 'N/A'),  ('037', 2, 'Vol-', 'Actuador', 'N/A'),
('038', 2, 'Stop', 'Actuador', 'N/A'),  ('039', 2, 'Pis1', 'Actuador', 'N/A'),
('040', 2, 'Pis2', 'Actuador', 'N/A'),  ('041', 2, 'Pis3', 'Actuador', 'N/A'),
('042', 2, 'Pis4', 'Actuador', 'N/A'),  ('043', 2, 'Pis5', 'Actuador', 'N/A'),
('044', 2, 'Pis6', 'Actuador', 'N/A'),  ('045', 2, 'Pis7', 'Actuador', 'N/A'),
('046', 2, 'Pis8', 'Actuador', 'N/A'),  ('047', 2, 'Pis9', 'Actuador', 'N/A'),
('048', 2, 'Pis10', 'Actuador', 'N/A'),  ('049', 2, 'Pis11', 'Actuador', 'N/A'),
('050', 2, 'Pis12', 'Actuador', 'N/A'),  ('051', 2, '', 'Actuador', 'N/A'),
('052', 2, '', 'Actuador', 'N/A'),  ('053', 2, '', 'Actuador', 'N/A'),
('054', 2, '', 'Actuador', 'N/A'),  ('055', 2, '', 'Actuador', 'N/A'),
('056', 2, '', 'Actuador', 'N/A'),  ('057', 2, '', 'Actuador', 'N/A'),
('058', 2, '', 'Actuador', 'N/A'),  ('059', 2, '', 'Actuador', 'N/A'),
('060', 2, '', 'Actuador', 'N/A'),  ('061', 2, '', 'Actuador', 'N/A'),
('062', 2, '', 'Actuador', 'N/A'),  ('063', 2, '', 'Actuador', 'N/A'),
('064', 2, '', 'Actuador', 'N/A'),  ('065', 2, '', 'Actuador', 'N/A'),
('066', 2, '', 'Actuador', 'N/A'),  ('067', 2, '', 'Actuador', 'N/A'),
('068', 2, '', 'Actuador', 'N/A'),  ('069', 2, '', 'Actuador', 'N/A'),
('070', 2, 'Pis13', 'Actuador', 'N/A'),  ('071', 2, 'Pis14', 'Actuador', 'N/A'),
('072', 2, 'Pis15', 'Actuador', 'N/A'),  ('073', 2, 'Pis16', 'Actuador', 'N/A'),
('074', 2, 'Pis17', 'Actuador', 'N/A'),  ('075', 2, 'Pis18', 'Actuador', 'N/A'),
('076', 2, 'Pis19', 'Actuador', 'N/A'),  ('077', 2, 'Pis20', 'Actuador', 'N/A'),
('078', 2, 'Pis21', 'Actuador', 'N/A'),  ('079', 2, 'Pis22', 'Actuador', 'N/A'),
('080', 2, 'Pis23', 'Actuador', 'N/A'),  ('081', 2, 'Pis24', 'Actuador', 'N/A'),
('082', 2, 'Pis25', 'Actuador', 'N/A'),  ('083', 2, 'Pis26', 'Actuador', 'N/A'),
('084', 2, 'Pis27', 'Actuador', 'N/A'),  ('085', 2, 'Pis28', 'Actuador', 'N/A'),
('086', 2, 'Pis29', 'Actuador', 'N/A'),  ('087', 2, 'Pis30', 'Actuador', 'N/A'),
('088', 2, '', 'Actuador', 'N/A'),  ('089', 2, '', 'Actuador', 'N/A'),
('090', 2, '', 'Actuador', 'N/A'),  ('091', 2, '', 'Actuador', 'N/A'),
('092', 2, '', 'Actuador', 'N/A'),  ('093', 2, '', 'Actuador', 'N/A'),
('094', 2, '', 'Actuador', 'N/A'),  ('095', 2, '', 'Actuador', 'N/A'),
('096', 2, '', 'Actuador', 'N/A'),  ('097', 2, '', 'Actuador', 'N/A'),
('098', 2, '', 'Actuador', 'N/A'),  ('099', 2, '', 'Actuador', 'N/A'),
('100', 2, 'APRGB', 'Actuador', 'N/A'),  ('101', 2, 'ENCLC', 'Actuador', 'N/A'),
('102', 2, 'ENCLF', 'Actuador', 'N/A'),  ('103', 2, 'ENCLN', 'Actuador', 'N/A'),
('104', 2, 'ENCLR', 'Actuador', 'N/A'),  ('105', 2, 'ENCLOR', 'Actuador', 'N/A'),
('106', 2, 'ENCDO', 'Actuador', 'N/A'),  ('107', 2, 'ENCOY', 'Actuador', 'N/A'),
('108', 2, 'ENCLY', 'Actuador', 'N/A'),  ('109', 2, 'ENCLB', 'Actuador', 'N/A'),
('110', 2, 'ENCDB', 'Actuador', 'N/A'),  ('111', 2, 'ENCMD', 'Actuador', 'N/A'),
('112', 2, 'ENCLP', 'Actuador', 'N/A'),  ('113', 2, 'ENCLV', 'Actuador', 'N/A'),
('114', 2, 'ENCLG', 'Actuador', 'N/A'),  ('115', 2, 'ENCLA', 'Actuador', 'N/A'),
('116', 2, 'ENCLI', 'Actuador', 'N/A'),  ('117', 2, 'ENCSG', 'Actuador', 'N/A'),
('118', 2, 'ENCLT', 'Actuador', 'N/A'),  ('119', 2, 'STROB', 'Actuador', 'N/A'),
('120', 2, 'FLASH', 'Actuador', 'N/A'),  ('121', 2, 'BRIL+', 'Actuador', 'N/A'),
('122', 2, 'BRI-', 'Actuador', 'N/A');
