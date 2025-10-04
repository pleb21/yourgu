// Application state
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;

// Initialize activities from localStorage, or (first time) with sample data
const defaultActivities = {
    "2025-07-14": ["Ran 3.15 miles", "Read 2 chapters"],
    "2025-07-15": ["Team meeting", "Grocery shopping"],
    "2025-07-16": ["Yoga class"],
    "2025-07-18": ["Date night", "Finished project"]
};
const activities = JSON.parse(localStorage.getItem('activitiesLog')) || {...defaultActivities};


const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// DOM elements
const monthYearElement = document.getElementById('monthYear');
const calendarElement = document.getElementById('calendar');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const modal = document.getElementById('activityModal');
const modalDate = document.getElementById('modalDate');
const activityInput = document.getElementById('activityInput');
const addActivityBtn = document.getElementById('addActivity');
const closeModalBtn = document.getElementById('closeModal');
const activityList = document.getElementById('activityList');

// Utility functions
function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(year, month, day) {
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function isToday(year, month, day) {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
}

function getDateKey(year, month, day) {
    return formatDate(year, month, day);
}

// Calendar rendering
function renderCalendar() {
    calendarElement.innerHTML = '';
    
    // Update month/year display
    monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Add day headers
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendarElement.appendChild(dayHeader);
    });
    
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
        const day = prevMonthDays - firstDay + i + 1;
        
        const cell = createDateCell(prevYear, prevMonth, day, true);
        calendarElement.appendChild(cell);
    }
    
    // Add cells for the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = createDateCell(currentYear, currentMonth, day, false);
        calendarElement.appendChild(cell);
    }
    
    // Add empty cells for days after the last day of the month
    const totalCells = calendarElement.children.length - 7; // Subtract day headers
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 total cells
    
    for (let i = 1; i <= remainingCells && totalCells + i <= 35; i++) {
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        
        const cell = createDateCell(nextYear, nextMonth, i, true);
        calendarElement.appendChild(cell);
    }
}

function createDateCell(year, month, day, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'date-cell';
    cell.tabIndex = 0;
    
    if (isOtherMonth) {
        cell.classList.add('other-month');
    }
    
    if (isToday(year, month, day)) {
        cell.classList.add('today');
    }
    
    const dateKey = getDateKey(year, month, day);
    const dayActivities = activities[dateKey] || [];
    
    if (dayActivities.length > 0) {
        cell.classList.add('has-activities');
    }
    
    // Date number
    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = day;
    cell.appendChild(dateNumber);
    
    // Activity preview
    const activityPreview = document.createElement('div');
    activityPreview.className = 'activity-preview';
    
    // Show first 2 activities as preview
    dayActivities.slice(0, 2).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item-preview';
        activityItem.textContent = activity;
        activityPreview.appendChild(activityItem);
    });
    
    cell.appendChild(activityPreview);
    
    // Activity count badge
    if (dayActivities.length > 0) {
        const countBadge = document.createElement('div');
        countBadge.className = 'activity-count';
        countBadge.textContent = dayActivities.length;
        cell.appendChild(countBadge);
    }
    
    // Event listeners
    cell.addEventListener('click', () => openModal(year, month, day));
    cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(year, month, day);
        }
    });
    
    return cell;
}

// Modal functionality
function openModal(year, month, day) {
    selectedDate = { year, month, day };
    const displayDate = formatDisplayDate(year, month, day);
    modalDate.textContent = `Activities for ${displayDate}`;
    
    renderActivityList();
    modal.style.display = 'flex';
    activityInput.focus();
}

function closeModal() {
    modal.style.display = 'none';
    selectedDate = null;
    activityInput.value = '';
}

function renderActivityList() {
    if (!selectedDate) return;
    
    const dateKey = getDateKey(selectedDate.year, selectedDate.month, selectedDate.day);
    const dayActivities = activities[dateKey] || [];
    
    if (dayActivities.length === 0) {
        activityList.innerHTML = '<div class="empty-state">No activities recorded for this day</div>';
        return;
    }
    
    activityList.innerHTML = '';
    dayActivities.forEach((activity, index) => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <span class="activity-text">${activity}</span>
            <div class="activity-actions">
                <button class="delete-btn" onclick="deleteActivity(${index})" aria-label="Delete activity">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="m19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function addActivity() {
    if (!selectedDate) return;
    
    const activityText = activityInput.value.trim();
    if (!activityText) {
        activityInput.focus();
        return;
    }
    
    const dateKey = getDateKey(selectedDate.year, selectedDate.month, selectedDate.day);
    
    if (!activities[dateKey]) {
        activities[dateKey] = [];
    }
    
    activities[dateKey].push(activityText);
    activityInput.value = '';
    activityInput.focus();

    localStorage.setItem('activitiesLog', JSON.stringify(activities));
    
    renderActivityList();
    renderCalendar(); // Update the calendar to show the new activity
}

function deleteActivity(index) {
    if (!selectedDate) return;
    
    const dateKey = getDateKey(selectedDate.year, selectedDate.month, selectedDate.day);
    const dayActivities = activities[dateKey];
    
    if (dayActivities && index >= 0 && index < dayActivities.length) {
        dayActivities.splice(index, 1);
        
        // Remove the date key if no activities left
        if (dayActivities.length === 0) {
            delete activities[dateKey];
        }
        
        localStorage.setItem('activitiesLog', JSON.stringify(activities));
        
        renderActivityList();
        renderCalendar(); // Update the calendar
    }
}

// Navigation
function navigateMonth(direction) {
    if (direction === 'prev') {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
    } else {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
    renderCalendar();
}

// Event listeners
prevMonthBtn.addEventListener('click', () => navigateMonth('prev'));
nextMonthBtn.addEventListener('click', () => navigateMonth('next'));

addActivityBtn.addEventListener('click', addActivity);

activityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addActivity();
    }
});

closeModalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
    }
});

// Keyboard navigation for calendar
document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'flex') return; // Don't navigate when modal is open
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateMonth('prev');
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateMonth('next');
    }
});

// Initialize the calendar
renderCalendar();

// ---- EXPORT functionality ----
document.getElementById('exportBtn').onclick = function() {
    const dataStr = JSON.stringify(activities, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = "activity_log.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ---- IMPORT functionality ----
document.getElementById('importInput').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result || "{}");
            if (typeof imported === "object" && imported !== null) {
                for (let key in activities) { delete activities[key]; } // clear old
                for (let key in imported) { activities[key] = imported[key]; }
                renderCalendar();
                if (modal.style.display === 'flex') renderActivityList();
                alert("Activity log imported successfully!");
            } else {
                alert("Invalid file format.");
            }
        } catch {
            alert("Error importing file.");
        }
    };
    reader.readAsText(file);
    localStorage.setItem('activitiesLog', JSON.stringify(activities));
};
