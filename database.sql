CREATE DATABASE IF NOT EXISTS `simple_user_panel`;
USE `simple_user_panel`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(32) NOT NULL,
  `email` varchar(256) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `check_email_format` CHECK (regexp_like(`email`,_utf8mb4'^[^[:space:]@]+@[^[:space:]@]+.[^[:space:]@]+$'))
);
CREATE TABLE IF NOT EXISTS `security` (
  `id` int NOT NULL,
  `hash` char(60) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hash` (`hash`)
);
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int NOT NULL,
  `token_list` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `sessions_chk_1` CHECK ((json_valid(`token_list`) and (json_type(`token_list`) = _cp850'ARRAY')))
);