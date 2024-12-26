document.addEventListener('DOMContentLoaded', () => {
    // طلب إذن الإشعارات
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    const taskInput = document.querySelector('.task-text');
    const timeInput = document.querySelector('.task-time');
    const addBtn = document.querySelector('.add-btn');
    const taskList = document.querySelector('.task-list');
    const filters = document.querySelectorAll('.task-filters button');
    const clearBtn = document.querySelector('.clear-btn');
    const pendingTasksCount = document.querySelector('.pending-tasks');

    // إنشاء عنصر الصوت
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notificationSound.volume = 0.5; // ضبط مستوى الصوت

    // Get tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    const updateLocalStorage = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updatePendingCount();
        checkTaskTimes();
    };

    const updatePendingCount = () => {
        const pendingTasks = tasks.filter(task => !task.completed).length;
        pendingTasksCount.textContent = `لديك ${pendingTasks} مهام معلقة`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes}`;
    };

    const createTaskElement = (task) => {
        return `<li class="${task.completed ? 'completed' : ''}">
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                ${task.time ? `<span class="task-time">${formatTime(task.time)}</span>` : ''}
            </div>
            <div class="actions">
                <button onclick="toggleTask(${task.id})" class="complete-btn">
                    <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button onclick="deleteTask(${task.id})" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>`;
    };

    const showTasks = (filter = 'all') => {
        let filteredTasks = tasks;
        if (filter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        taskList.innerHTML = filteredTasks.map(createTaskElement).join('');
    };

    const playNotificationSound = async () => {
        try {
            await notificationSound.play();
        } catch (error) {
            console.log('Could not play notification sound');
        }
    };

    const checkTaskTimes = () => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        tasks.forEach(task => {
            if (task.time && !task.completed && !task.notified) {
                if (task.time === currentTime) {
                    showNotification(task);
                    playNotificationSound(); // تشغيل الصوت مع الإشعار
                    task.notified = true;
                    updateLocalStorage();
                }
            }
        });
    };

    const showNotification = (task) => {
        if (Notification.permission === 'granted') {
            const notification = new Notification('تذكير بالمهمة', {
                body: `حان موعد: ${task.text}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/4697/4697260.png',
                silent: true // نستخدم الصوت المخصص بدلاً من صوت النظام
            });

            // إضافة حدث النقر على الإشعار
            notification.onclick = function() {
                window.focus();
                this.close();
            };
        }
    };

    window.toggleTask = (id) => {
        tasks = tasks.map(task => {
            if (task.id === id) {
                task.completed = !task.completed;
                task.notified = false; // إعادة تعيين حالة الإشعار عند تغيير حالة المهمة
            }
            return task;
        });
        updateLocalStorage();
        showTasks(document.querySelector('.task-filters button.active').dataset.filter);
    };

    window.deleteTask = (id) => {
        tasks = tasks.filter(task => task.id !== id);
        updateLocalStorage();
        showTasks(document.querySelector('.task-filters button.active').dataset.filter);
    };

    const addTask = () => {
        const text = taskInput.value.trim();
        const time = timeInput.value;
        if (!text) return;

        tasks.push({
            id: Date.now(),
            text: text,
            time: time || null,
            completed: false,
            notified: false
        });

        taskInput.value = '';
        timeInput.value = '';
        updateLocalStorage();
        showTasks(document.querySelector('.task-filters button.active').dataset.filter);
    };

    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') addTask();
    });

    filters.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.task-filters button.active').classList.remove('active');
            button.classList.add('active');
            showTasks(button.dataset.filter);
        });
    });

    clearBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        updateLocalStorage();
        showTasks(document.querySelector('.task-filters button.active').dataset.filter);
    });

    // فحص المهام كل 30 ثانية
    setInterval(checkTaskTimes, 30000);

    // Initial render
    showTasks();
});
