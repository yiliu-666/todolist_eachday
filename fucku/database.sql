-- 创建数据库
CREATE DATABASE IF NOT EXISTS daily_tasks_app;

-- 使用数据库
USE daily_tasks_app;

-- 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建每日状态视图
CREATE OR REPLACE VIEW daily_status AS
SELECT 
    task_date AS date,
    COUNT(*) AS total_tasks,
    SUM(completed) AS completed_tasks,
    (COUNT(*) = SUM(completed) AND COUNT(*) > 0) AS all_completed
FROM tasks
GROUP BY task_date;

-- 添加一些示例数据
INSERT INTO tasks (title, completed, task_date) VALUES
('完成项目报告', TRUE, CURDATE()),
('回复邮件', FALSE, CURDATE()),
('参加会议', FALSE, CURDATE()),
('预订机票', TRUE, DATE_ADD(CURDATE(), INTERVAL -1 DAY)),
('购买生日礼物', TRUE, DATE_ADD(CURDATE(), INTERVAL -1 DAY)),
('整理文档', TRUE, DATE_ADD(CURDATE(), INTERVAL -2 DAY)),
('锻炼身体', FALSE, DATE_ADD(CURDATE(), INTERVAL -3 DAY)),
('学习新技术', TRUE, DATE_ADD(CURDATE(), INTERVAL -3 DAY));