CREATE DATABASE IF NOT EXISTS Smart_Street_Light_db;

USE Smart_Street_Light_db;

DROP TABLE IF EXISTS repair_assign;
DROP TABLE IF EXISTS break_part;
DROP TABLE IF EXISTS repair_history;   
DROP TABLE IF EXISTS pole_log;
DROP TABLE IF EXISTS pole;
DROP TABLE IF EXISTS zone;
DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS user_phone;
DROP TABLE IF EXISTS user_data;

CREATE TABLE user_data (
    id_acc INT NOT NULL AUTO_INCREMENT,  
    username VARCHAR(255) NOT NULL,    
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    last VARCHAR(255) NOT NULL,
    birthdate DATE NOT NULL,
    Role VARCHAR(255) NOT NULL DEFAULT 'user',
    available BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT user_ID_PK PRIMARY KEY(id_acc),
    CONSTRAINT user_email_UC UNIQUE(email),
    CONSTRAINT user_token_UC UNIQUE(token),
    CONSTRAINT user_username_UC UNIQUE(username)
);

CREATE TABLE user_phone (
    id_acc INT NOT NULL ,      
    phone VARCHAR(15) NOT NULL , 
    
    CONSTRAINT user_phone_PK PRIMARY KEY(phone),
    CONSTRAINT user_id_acc_FK FOREIGN KEY(id_acc) REFERENCES user_data(id_acc)
);

CREATE TABLE config(
    id_config INT NOT NULL AUTO_INCREMENT,
    mode VARCHAR(255) NOT NULL DEFAULT 'auto',
    time_on datetime,
    time_off datetime,
    brightness INT NOT NULL DEFAULT 0,
    lux INT NOT NULL DEFAULT 0,
    rule_lux INT NOT NULL DEFAULT 0,

    CONSTRAINT config_PK PRIMARY KEY(id_config)
);

CREATE TABLE zone(
    id_zone INT NOT NULL AUTO_INCREMENT,
    name_zone VARCHAR(255) NOT NULL,
    id_config INT NOT NULL,

    CONSTRAINT zone_PK PRIMARY KEY(id_zone),
    CONSTRAINT zone_id_config_FK FOREIGN KEY(id_config) REFERENCES config(id_config)
);

CREATE TABLE pole(
    id_pole INT NOT NULL AUTO_INCREMENT,
    height INT NOT NULL ,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    bulb_type VARCHAR(255) NOT NULL,
    max_watt INT NOT NULL,
    bulb_size VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    id_zone INT NOT NULL, 

    CONSTRAINT pole_PK PRIMARY KEY(id_pole),
    CONSTRAINT pole_id_zone_FK FOREIGN KEY(id_zone) REFERENCES zone(id_zone)
);

CREATE TABLE pole_log(
    id_log INT NOT NULL AUTO_INCREMENT,
    lux_log INT NOT NULL ,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    brightness_log INT NOT NULL DEFAULT 0,
    energy_current INT NOT NULL DEFAULT 0,
    energy_total INT NOT NULL DEFAULT 0,
    time_log datetime NOT NULL,
    id_pole INT NOT NULL,

    CONSTRAINT pole_log_PK PRIMARY KEY(id_log),
    CONSTRAINT pole_log_id_pole_FK FOREIGN KEY(id_pole) REFERENCES pole(id_pole)
);

CREATE TABLE repair_history(
    id_repair INT NOT NULL AUTO_INCREMENT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    time_breaks datetime NOT NULL,
    time_repair_start datetime,
    time_repair_end datetime,
    id_pole INT NOT NULL,

    CONSTRAINT repair_history_PK PRIMARY KEY(id_repair),
    CONSTRAINT repair_history_id_pole_FK FOREIGN KEY(id_pole) REFERENCES pole(id_pole)
);

CREATE TABLE break_part(
    id_break_part INT NOT NULL AUTO_INCREMENT,
    id_repair INT NOT NULL,
    name_part VARCHAR(255) NOT NULL,

    CONSTRAINT break_part_PK PRIMARY KEY(id_break_part),
    CONSTRAINT break_part_id_repair_FK FOREIGN KEY(id_repair) REFERENCES repair_history(id_repair)
);

CREATE TABLE repair_assign(
    id_repair INT NOT NULL,
    id_acc INT NOT NULL,

    CONSTRAINT repair_assign_PK PRIMARY KEY(id_repair, id_acc),
    CONSTRAINT repair_assign_id_repair_FK FOREIGN KEY(id_repair) REFERENCES repair_history(id_repair),
    CONSTRAINT repair_assign_id_acc_FK FOREIGN KEY(id_acc) REFERENCES user_data(id_acc)
);