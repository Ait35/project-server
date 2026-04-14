CREATE DATABASE IF NOT EXISTS ${DB_NAME} ;

USE ${DB_NAME} ;

DROP TABLE IF EXISTS repair_assign;
DROP TABLE IF EXISTS repair_history;   
DROP TABLE IF EXISTS pole_log;
DROP TABLE IF EXISTS pole;
DROP TABLE IF EXISTS zone;
DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS user_phone;
DROP TABLE IF EXISTS user_data;

CREATE TABLE user_data (
    id_acc INT NOT NULL AUTO_INCREMENT,  
    username VARCHAR(100) NOT NULL,    
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    last VARCHAR(100) NOT NULL,
    birthdate DATE NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'user',
    available BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, 

    CONSTRAINT user_ID_PK PRIMARY KEY(id_acc),
    CONSTRAINT user_email_UC UNIQUE(email),
    CONSTRAINT user_token_UC UNIQUE(token),
    CONSTRAINT user_username_UC UNIQUE(username)
);

CREATE TABLE user_phone (
    id_acc INT NOT NULL,      
    phone VARCHAR(15) NOT NULL, 
    
    CONSTRAINT user_phone_PK PRIMARY KEY(phone),
    CONSTRAINT user_id_acc_FK FOREIGN KEY(id_acc) REFERENCES user_data(id_acc) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE config(
    id_config INT NOT NULL AUTO_INCREMENT,
    mode VARCHAR(50) NOT NULL DEFAULT 'auto',
    time_on TIME,  
    time_off TIME, 
    brightness INT NOT NULL DEFAULT 0,
    lux INT NOT NULL DEFAULT 0,
    rule_lux INT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT config_PK PRIMARY KEY(id_config)
);

CREATE TABLE zone(
    id_zone INT NOT NULL AUTO_INCREMENT,
    name_zone VARCHAR(100) NOT NULL,
    id_config INT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, 

    CONSTRAINT zone_PK PRIMARY KEY(id_zone),
    -- RESTRICT: ห้ามลบ Config ถ้ายังมี Zone ใช้อยู่ (กันพัง)
    CONSTRAINT zone_id_config_FK FOREIGN KEY(id_config) REFERENCES config(id_config) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pole(
    id_pole INT NOT NULL AUTO_INCREMENT,
    height DECIMAL(5,2) NOT NULL, 
    status BOOLEAN NOT NULL DEFAULT TRUE, 
    bulb_type VARCHAR(100) NOT NULL,
    max_watt INT NOT NULL,
    bulb_size VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,  
    longitude DECIMAL(11, 8) NOT NULL,
    id_zone INT NOT NULL, 
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pole_PK PRIMARY KEY(id_pole),
    CONSTRAINT pole_id_zone_FK FOREIGN KEY(id_zone) REFERENCES zone(id_zone) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pole_log(
    id_log INT NOT NULL AUTO_INCREMENT,
    lux_log INT NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    brightness_log INT NOT NULL DEFAULT 0,
    energy_current DECIMAL(10,2) NOT NULL DEFAULT 0.00, 
    energy_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,   
    time_log DATETIME NOT NULL, 
    id_pole INT NOT NULL,

    CONSTRAINT pole_log_PK PRIMARY KEY(id_log),
    CONSTRAINT pole_log_id_pole_FK FOREIGN KEY(id_pole) REFERENCES pole(id_pole) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE repair_history(
    id_repair INT NOT NULL AUTO_INCREMENT,
    status BOOLEAN NOT NULL DEFAULT TRUE, 
    time_breaks DATETIME NOT NULL,     
    time_repair_start DATETIME,        
    time_repair_end DATETIME,          
    broken_parts TEXT,                 
    id_pole INT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, 

    CONSTRAINT repair_history_PK PRIMARY KEY(id_repair),
    CONSTRAINT repair_history_id_pole_FK FOREIGN KEY(id_pole) REFERENCES pole(id_pole) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE repair_assign(
    id_repair INT NOT NULL,
    id_acc INT NOT NULL,

    CONSTRAINT repair_assign_PK PRIMARY KEY(id_repair, id_acc),
    CONSTRAINT repair_assign_id_repair_FK FOREIGN KEY(id_repair) REFERENCES repair_history(id_repair) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT repair_assign_id_acc_FK FOREIGN KEY(id_acc) REFERENCES user_data(id_acc) ON UPDATE CASCADE ON DELETE CASCADE
);