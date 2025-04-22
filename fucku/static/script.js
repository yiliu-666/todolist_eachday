document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const newTaskInput = document.getElementById('new-task');
    const addButton = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const currentDateElement = document.getElementById('current-date');
    const prevDateButton = document.getElementById('prev-date');
    const nextDateButton = document.getElementById('next-date');
    const todayButton = document.getElementById('today-btn');
    const showCalendarButton = document.getElementById('show-calendar-btn');
    const hideCalendarButton = document.getElementById('hide-calendar-btn');
    const calendarView = document.getElementById('calendar-view');
    const tasksView = document.getElementById('tasks-view');
    const calendarGrid = document.getElementById('calendar-grid');
    const dateSummary = document.getElementById('date-summary');
    
    let currentFilter = 'all';
    let selectedDate = new Date();
    let formattedSelectedDate = formatDate(selectedDate);
    let dailyStatus = {};
    
    // 初始化日期显示
    updateDateDisplay();
    
    // 加载任务
    fetchTasks(formattedSelectedDate);
    
    // 加载日历数据
    fetchCalendarData();
    
    // 添加新任务事件
    addButton.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // 过滤器点击事件
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterTasks();
        });
    });
    
    // 日期导航事件
    prevDateButton.addEventListener('click', function() {
        selectedDate.setDate(selectedDate.getDate() - 1);
        formattedSelectedDate = formatDate(selectedDate);
        updateDateDisplay();
        fetchTasks(formattedSelectedDate);
    });
    
    nextDateButton.addEventListener('click', function() {
        selectedDate.setDate(selectedDate.getDate() + 1);
        formattedSelectedDate = formatDate(selectedDate);
        updateDateDisplay();
        fetchTasks(formattedSelectedDate);
    });
    
    todayButton.addEventListener('click', function() {
        selectedDate = new Date();
        formattedSelectedDate = formatDate(selectedDate);
        updateDateDisplay();
        fetchTasks(formattedSelectedDate);
    });
    
    // 日历视图切换
    showCalendarButton.addEventListener('click', function() {
        tasksView.style.display = 'none';
        calendarView.style.display = 'block';
        showCalendarButton.style.display = 'none';
        fetchCalendarData();
    });
    
    hideCalendarButton.addEventListener('click', function() {
        calendarView.style.display = 'none';
        tasksView.style.display = 'block';
        showCalendarButton.style.display = 'block';
    });
    
    // 格式化日期为YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 更新日期显示
    function updateDateDisplay() {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        currentDateElement.textContent = selectedDate.toLocaleDateString('zh-CN', options);
    }
    
    // 获取所有任务
    function fetchTasks(date) {
        fetch(`/api/tasks?date=${date}`)
            .then(response => response.json())
            .then(data => {
                renderTasks(data.tasks);
                updateDateSummary(date, data.dailyStatus);
            })
            .catch(error => console.error('Error fetching tasks:', error));
    }
    
    // 添加新任务
    function addTask() {
        const taskTitle = newTaskInput.value.trim();
        if (taskTitle) {
            // 添加任务前禁用输入框和按钮
            newTaskInput.disabled = true;
            addButton.disabled = true;
            
            fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: taskTitle,
                    date: formattedSelectedDate
                }),
            })
            .then(response => response.json())
            .then(data => {
                newTaskInput.value = '';
                // 重新启用输入框和按钮
                newTaskInput.disabled = false;
                addButton.disabled = false;
                newTaskInput.focus();
                fetchTasks(formattedSelectedDate);
                fetchCalendarData();
            })
            .catch(error => {
                console.error('Error adding task:', error);
                // 发生错误时也要重新启用输入框和按钮
                newTaskInput.disabled = false;
                addButton.disabled = false;
            });
        }
    }
    
    // 切换任务状态
    function toggleTaskStatus(taskId, completed) {
        fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: completed }),
        })
        .then(response => response.json())
        .then(data => {
            fetchTasks(formattedSelectedDate);
            fetchCalendarData();
        })
        .catch(error => console.error('Error updating task:', error));
    }
    
    // 删除任务
    function deleteTask(taskId) {
        fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            fetchTasks(formattedSelectedDate);
            fetchCalendarData();
        })
        .catch(error => console.error('Error deleting task:', error));
    }
    
    // 渲染任务列表
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state';
            emptyMessage.innerHTML = '暂无计划，<br>添加一个新计划开始美好的一天吧！';
            taskList.appendChild(emptyMessage);
            return;
        }
        
        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.setAttribute('data-status', task.completed ? 'completed' : 'pending');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', function() {
                toggleTaskStatus(task.id, this.checked);
            });
            
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.title;
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.setAttribute('aria-label', '删除任务');
            deleteButton.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteTask(task.id);
            });
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskText);
            taskItem.appendChild(deleteButton);
            
            // 点击整个任务项也可以切换任务状态
            taskItem.addEventListener('click', function(e) {
                if (e.target !== deleteButton && e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    toggleTaskStatus(task.id, checkbox.checked);
                }
            });
            
            taskList.appendChild(taskItem);
        });
        
        filterTasks();
    }
    
    // 过滤任务
    function filterTasks() {
        const tasks = document.querySelectorAll('.task-item');
        
        tasks.forEach(task => {
            const status = task.getAttribute('data-status');
            
            if (currentFilter === 'all' || 
                (currentFilter === 'pending' && status === 'pending') || 
                (currentFilter === 'completed' && status === 'completed')) {
                task.style.display = 'flex';
            } else {
                task.style.display = 'none';
            }
        });
    }
    
    // 获取日历数据
    function fetchCalendarData() {
        fetch('/api/calendar')
            .then(response => response.json())
            .then(data => {
                dailyStatus = data.dailyStatus;
                renderCalendar(data.dates, data.dailyStatus);
            })
            .catch(error => console.error('Error fetching calendar data:', error));
    }
    
    // 渲染日历
    function renderCalendar(dates, dailyStatus) {
        calendarGrid.innerHTML = '';
        
        // 添加星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // 获取第一天是星期几，用于填充空白
        const firstDay = new Date(dates[0]);
        const firstDayOfWeek = firstDay.getDay();
        
        // 填充前面的空白
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // 填充日历
        const today = formatDate(new Date());
        dates.forEach(date => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = new Date(date).getDate();
            
            // 标记今天
            if (date === today) {
                dayElement.classList.add('today');
            }
            
            // 标记选中的日期
            if (date === formattedSelectedDate) {
                dayElement.classList.add('selected');
            }
            
            // 添加任务完成状态指示器
            if (dailyStatus[date]) {
                const status = dailyStatus[date];
                const indicator = document.createElement('span');
                indicator.className = 'day-indicator';
                
                if (status.allCompleted) {
                    indicator.textContent = '★';
                    indicator.classList.add('completed');
                } else {
                    indicator.textContent = '✗';
                    indicator.classList.add('incomplete');
                }
                
                dayElement.appendChild(indicator);
            }
            
            // 日期点击事件
            dayElement.addEventListener('click', function() {
                selectedDate = new Date(date);
                formattedSelectedDate = date;
                updateDateDisplay();
                fetchTasks(formattedSelectedDate);
                
                // 切换回任务视图
                calendarView.style.display = 'none';
                tasksView.style.display = 'block';
                showCalendarButton.style.display = 'block';
            });
            
            calendarGrid.appendChild(dayElement);
        });
    }
    
    // 更新日期摘要
    function updateDateSummary(date, allDailyStatus) {
        const status = allDailyStatus[date];
        dateSummary.innerHTML = '';
        
        if (!status || status.total === 0) {
            dateSummary.textContent = '当日没有任务记录';
            dateSummary.className = 'date-summary';
            return;
        }
        
        if (status.allCompleted) {
            dateSummary.innerHTML = '<span class="all-completed-star">★</span> 太棒了！当日所有任务已完成！';
            dateSummary.className = 'date-summary all-completed';
        } else {
            dateSummary.innerHTML = `<span class="incomplete-mark">✗</span> 已完成 ${status.completed}/${status.total} 个任务`;
            dateSummary.className = 'date-summary has-incomplete';
        }
    }
});