CREATE DATABASE IF NOT EXISTS casapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE casapp;

CREATE TABLE IF NOT EXISTS request_logs (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    created_at  DATETIME        NOT NULL,
    type        VARCHAR(32)     NOT NULL COMMENT 'eval | pendulum | ball_beam',
    command     TEXT            NOT NULL,
    success     TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_created (created_at),
    INDEX idx_type    (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS animation_stats (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    created_at      DATETIME        NOT NULL,
    animation_type  VARCHAR(32)     NOT NULL COMMENT 'pendulum | ball_beam',
    user_token      VARCHAR(64)     NOT NULL,
    ip              VARCHAR(45)     NOT NULL DEFAULT '',
    city            VARCHAR(128)    NOT NULL DEFAULT '',
    country         VARCHAR(128)    NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    INDEX idx_created (created_at),
    INDEX idx_type    (animation_type),
    INDEX idx_token   (user_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
