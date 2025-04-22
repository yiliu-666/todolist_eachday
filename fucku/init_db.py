import mysql.connector
import os
from dotenv import load_dotenv
import json
import sys
from datetime import datetime

# 加载环境变量
load_dotenv()

def init_database():
    # 使用环境变量连接到MySQL
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
    }
    
    # 连接到MySQL并创建数据库
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # 创建数据库
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {os.getenv('DB_NAME', 'daily_tasks_app')}")
        cursor.execute(f"USE {os.getenv('DB_NAME', 'daily_tasks_app')}")
        
        # 创建tasks表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                task_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # 创建daily_status视图
        cursor.execute("""
            CREATE OR REPLACE VIEW daily_status AS
            SELECT 
                task_date AS date,
                COUNT(*) AS total_tasks,
                SUM(completed) AS completed_tasks,
                (COUNT(*) = SUM(completed) AND COUNT(*) > 0) AS all_completed
            FROM tasks
            GROUP BY task_date
        """)
        
        # 导入现有数据（如果有）
        if os.path.exists('tasks.json'):
            try:
                with open('tasks.json', 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                if 'tasks' in data and len(data['tasks']) > 0:
                    for task in data['tasks']:
                        date = task.get('date', datetime.now().strftime('%Y-%m-%d'))
                        title = task.get('title', '')
                        completed = task.get('completed', False)
                        
                        cursor.execute("""
                            INSERT INTO tasks (title, completed, task_date)
                            VALUES (%s, %s, %s)
                        """, (title, completed, date))
                
                conn.commit()
                print(f"成功导入 {len(data.get('tasks', []))} 个任务到数据库")
            except Exception as e:
                print(f"导入数据时出错: {e}")
        
        print("数据库初始化成功！")
        
    except mysql.connector.Error as err:
        print(f"数据库错误: {err}")
        sys.exit(1)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    init_database()