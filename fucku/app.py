from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)

# 数据文件路径
TASKS_FILE = 'tasks.json'

# 如果文件不存在，创建一个空的任务列表
if not os.path.exists(TASKS_FILE):
    with open(TASKS_FILE, 'w', encoding='utf-8') as f:
        json.dump({"tasks": [], "dailyStatus": {}}, f, ensure_ascii=False)

# 读取任务
def get_tasks():
    try:
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"tasks": [], "dailyStatus": {}}

# 保存任务
def save_tasks(tasks):
    with open(TASKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

# 更新日期状态
def update_daily_status():
    data = get_tasks()
    
    # 按日期分组任务
    tasks_by_date = {}
    for task in data["tasks"]:
        date = task.get("date", "未分类")
        if date not in tasks_by_date:
            tasks_by_date[date] = []
        tasks_by_date[date].append(task)
    
    # 更新每天的状态
    daily_status = {}
    for date, tasks in tasks_by_date.items():
        if date == "未分类":
            continue
            
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task["completed"])
        
        if total_tasks > 0:
            daily_status[date] = {
                "total": total_tasks,
                "completed": completed_tasks,
                "allCompleted": completed_tasks == total_tasks
            }
    
    data["dailyStatus"] = daily_status
    save_tasks(data)
    return daily_status

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_all_tasks():
    date = request.args.get('date')
    data = get_tasks()
    
    if date:
        # 按日期过滤任务
        data["tasks"] = [task for task in data["tasks"] if task.get("date") == date]
    
    return jsonify(data)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    tasks_data = get_tasks()
    
    # 获取当前日期，格式为YYYY-MM-DD
    today = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    
    new_task = {
        "id": len(tasks_data["tasks"]) + 1,
        "title": data["title"],
        "completed": False,
        "date": today
    }
    
    tasks_data["tasks"].append(new_task)
    save_tasks(tasks_data)
    update_daily_status()
    
    return jsonify(new_task)

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    tasks_data = get_tasks()
    
    for task in tasks_data["tasks"]:
        if task["id"] == task_id:
            if "completed" in data:
                task["completed"] = data["completed"]
            if "date" in data:
                task["date"] = data["date"]
            if "title" in data:
                task["title"] = data["title"]
                
            save_tasks(tasks_data)
            update_daily_status()
            return jsonify(task)
    
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    tasks_data = get_tasks()
    
    tasks_data["tasks"] = [task for task in tasks_data["tasks"] if task["id"] != task_id]
    save_tasks(tasks_data)
    update_daily_status()
    
    return jsonify({"success": True})

@app.route('/api/calendar', methods=['GET'])
def get_calendar():
    # 获取过去30天的日历数据
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    dates = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        dates.append(date_str)
        current_date += timedelta(days=1)
    
    # 获取每天的任务完成状态
    daily_status = get_tasks().get("dailyStatus", {})
    
    calendar_data = {
        "dates": dates,
        "dailyStatus": daily_status
    }
    
    return jsonify(calendar_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, debug=True)