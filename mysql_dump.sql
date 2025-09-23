CREATE DATABASE  IF NOT EXISTS `scheduler_howto_node`;
USE `scheduler_howto_node`;

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` bigint(20) unsigned AUTO_INCREMENT,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `text` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `recurring_events`;
CREATE TABLE `recurring_events` (
  `id` bigint(20) unsigned AUTO_INCREMENT,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `text` varchar(255) DEFAULT NULL,
  `duration` bigint(20) unsigned DEFAULT NULL,
  `rrule` varchar(255) DEFAULT NULL,
  `recurring_event_id` varchar(255) DEFAULT NULL,
  `original_start` varchar(255) DEFAULT NULL,
  `deleted` BOOLEAN DEFAULT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8;
