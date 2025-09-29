/*
* #######################################################################################################################################
*       Archivo: CabinasSchema.sql
*       Proyecto: Botonera (BTN)
*       SO: Windows 11
*       Herramientas:
*           - Visual Studio Code
*           - MySQL Workbench
*       Compilador:
*           - MySQL 8.0
*       Autor:
*           - Jorge Peña (Jelp200)
*       Descripción:
*          Script para la creación de la base de datos y tablas para la gestión de comandos de las cabinas de control.
* ######################################################################################################################################
*/

CREATE DATABASE IF NOT EXISTS CabinasDB;
USE CabinasDB;

--- ===========================================
--- CREACIÓN DE LA TABLA CABINAS
--- ===========================================
CREATE TABLE IF NOT EXISTS Cabinas (
    cabina_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(15) NOT NULL,
    descripcion TEXT
);

--- ===========================================
--- CREACIÓN DE LA TABLA COMANDOS
--- ===========================================
CREATE TABLE IF NOT EXISTS Comandos (
    comando_id INT AUTO_INCREMENT PRIMARY KEY,
    caracter_inicio CHAR(1) NOT NULL DEFAULT 'C',
    cabina_id INT NOT NULL,
    codigo_comando VARCHAR(3) NOT NULL,
    caracter_final CHAR(1) NOT NULL DEFAULT 'F',
    categoria VARCHAR(50),
    tipo VARCHAR(50),
    sensor VARCHAR(50),
    UNIQUE (cabina_id, codigo_comando),
    FOREIGN KEY (cabina_id) REFERENCES Cabinas(cabina_id)
);
