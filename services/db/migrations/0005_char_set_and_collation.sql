-- set char set and collation to UTF8
ALTER TABLE calevent CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE caldaily CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER DATABASE shift CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- will still need to update collation for MySQL v8 to utf8mb4_0900_ai_ci, 
-- but v5.7 doesn't recognize that collation
