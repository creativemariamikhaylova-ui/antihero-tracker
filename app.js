// js/app.js — Главный модуль (рефакторинг)
import { storage } from './storage.js';
import { charts } from './charts.js';
import { exporter } from './export.js';
import { t, setLanguage, getLanguage, applyTranslations } from './i18n.js';

// App State
const state = {
    currentDate: new Date(),
    currentEntry: null,
    userExercises: [],
    appIcon: 'default',
    notifEnabled: false,
    saveTimeout: null,
    deferredPrompt: null
};

// DOM Elements cache
const elements = {};

// Initialize app
async function init() {
    try {
        // Init storage
        await storage.init();
        
        // Load data
        await loadUserData();
        
        // Cache DOM elements
        cacheElements();
        
        // Setup UI
        setupEventListeners();
        setupPWA();
        setupNotifications();
        
        // Load current day
        loadDay(state.currentDate);
        
        // Render components
        renderExercises();
        renderHeatmap();
        renderStats();
        
        // Init charts
        charts.init();
        charts.updateCharts('week');
        
        // Apply translations
        applyTranslations();
        
        console.log('AntiHero initialized');
    } catch (error) {
        console.error('Init error:', error);
    }
}

function cacheElements() {
    elements.currentDay = document.getElementById('currentDay');
    elements.currentMonthYear = document.getElementById('currentMonthYear');
    elements.monthDisplay = document.getElementById('monthDisplay');
    elements.exGrid = document.getElementById('exGrid');
    elements.customEx = document.getElementById('customEx');
    elements.note = document.getElementById('note');
    elements.saveIndicator = document.getElementById('saveIndicator');
    elements.toast = document.getElementById('toast');
}

async function loadUserData() {
    // User exercises
    const exRaw = localStorage.getItem('antihero_user_exercises');
    state.userExercises = exRaw ? JSON.parse(exRaw) : ['КАРДИО', 'ОТЖИМАНИЯ'];
    
    // App icon
    state.appIcon = localStorage.getItem('antihero_app_icon') || 'default';
    updateAppIcon();
    
    // Notifications
    state.notifEnabled = localStorage.getItem('antihero_notif') === 'true';
}

function loadDay(date) {
    const dateKey = formatDateKey(date);
    state.currentDate = date;
    
    // Update display
    updateDateDisplay(date);
    
    // Load entry
    storage.getEntry(dateKey).then(entry => {
        entry.date = dateKey;
        state.currentEntry = entry;
        populateUI(entry);
    });
}

function updateDateDisplay(date) {
    const months = ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'];
    
    elements.currentDay.textContent = date.getDate();
    elements.currentMonthYear.textContent = `${months[date.getMonth()]} ${date.getFullYear()}`;
    elements.monthDisplay.textContent = `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function populateUI(entry) {
    // Exercises
    const details = entry.sportDetails || {};
    document.querySelectorAll('.ex-btn').forEach(btn => {
        const exName = btn.dataset.exercise;
        if (exName) {
            btn.classList.toggle('active', !!details[exName]);
        }
    });
    
    // Custom exercise
    elements.customEx.value = details.custom || '';
    
    // Note
    elements.note.value = entry.note || '';
    
    // Nicotine
    document.getElementById('nicotineCount').textContent = entry.nicotineCount || 0;
    updateNicotineStatus(entry.nicotine);
    
    // Alcohol
    updateDrinkCounter(entry.alcoholDrinks);
    updateAlcoholStatus(entry.alcohol);
    
    // Sleep
    document.getElementById('sleepTime').value = entry.sleepTime || '23:00';
    document.getElementById('wakeupTime').value = entry.wakeupTime || '07:00';
    updateSleepDuration();
    updateSleepQuality(entry.sleepQuality);
    updateSleepStatus(entry.sleep);
    
    // Water
    updateWaterProgress(entry.water, entry.waterGoal);
    updateWaterStatus(entry.water >= entry.waterGoal);
    
    // Mood
    updateMoodSelection(entry.mood);
    updateMoodTags(entry.moodTags);
    
    // Tracker cards
    document.getElementById('sportCard').classList.toggle('completed', entry.sport);
    document.getElementById('nicotineStatus').closest('.tracker-card').classList.toggle('completed', entry.nicotine);
    document.getElementById('alcoholStatus').closest('.tracker-card').classList.toggle('completed', entry.alcohol);
    document.getElementById('sleepStatus').closest('.tracker-card').classList.toggle('completed', entry.sleep);
    document.getElementById('waterStatus').closest('.tracker-card').classList.toggle('completed', entry.water >= entry.waterGoal);
}

function renderExercises() {
    const container = elements.exGrid;
    if (!container) return;
    
    container.innerHTML = '';
    
    const stdExercises = [
        ['press', 'ПРЕСС', 'fa-heartbeat'],
        ['arms', 'РУКИ', 'fa-hand-fist'],
        ['pullups', 'ПОДТЯГ', 'fa-arrow-up'],
        ['legs', 'НОГИ', 'fa-person-walking'],
        ['cardio', 'КАРДИО', 'fa-heart']
    ];
    
    for (const [key, label, icon] of stdExercises) {
        container.appendChild(createExerciseButton(key, label, icon));
    }
    
    for (const ex of state.userExercises) {
        container.appendChild(createExerciseButton(ex, ex, 'fa-tag'));
    }
}

function createExerciseButton(key, label, icon) {
    const btn = document.createElement('div');
    btn.className = 'ex-btn';
    btn.dataset.exercise = key;
    btn.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
    btn.addEventListener('click', () => toggleExercise(key, btn));
    return btn;
}

function toggleExercise(key, btn) {
    btn.classList.toggle('active');
    haptic();
    scheduleSave();
}

function updateNicotineStatus(active) {
    const status = document.getElementById('nicotineStatus');
    status.innerHTML = `<i class="${active ? 'fas' : 'far'} fa-circle"></i>`;
    document.getElementById('nicotineCard').classList.toggle('completed', active);
}

function updateAlcoholStatus(active) {
    const status = document.getElementById('alcoholStatus');
    status.innerHTML = `<i class="${active ? 'fas' : 'far'} fa-circle"></i>`;
    document.getElementById('alcoholCard').classList.toggle('completed', active);
}

function updateDrinkCounter(drinks) {
    drinks = drinks || { beer: 0, wine: 0, vodka: 0 };
    document.querySelectorAll('.drink-item').forEach(item => {
        const type = item.dataset.type;
        item.querySelector('span').textContent = drinks[type] || 0;
    });
}

function updateSleepStatus(active) {
    const status = document.getElementById('sleepStatus');
    status.innerHTML = `<i class="${active ? 'fas' : 'far'} fa-circle"></i>`;
    document.getElementById('sleepCard').classList.toggle('completed', active);
}

function updateSleepDuration() {
    const sleepTime = document.getElementById('sleepTime').value || '23:00';
    const wakeupTime = document.getElementById('wakeupTime').value || '07:00';
    
    const [sleepH, sleepM] = sleepTime.split(':').map(Number);
    const [wakeH, wakeM] = wakeupTime.split(':').map(Number);
    
    let duration = (wakeH * 60 + wakeM) - (sleepH * 60 + sleepM);
    if (duration < 0) duration += 24 * 60;
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    document.getElementById('sleepDuration').textContent = minutes > 0 ? `${hours}ч${minutes}м` : `${hours}ч`;
}

function updateSleepQuality(quality) {
    const stars = document.querySelectorAll('#qualityStars i');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < quality);
    });
}

function updateWaterProgress(current, goal) {
    const fill = document.getElementById('waterFill');
    const goalEl = document.getElementById('waterGoal');
    const percentage = Math.min((current / goal) * 100, 100);
    
    fill.style.width = `${percentage}%`;
    goalEl.textContent = `${current}/${goal}Л`;
}

function updateWaterStatus(active) {
    const status = document.getElementById('waterStatus');
    status.innerHTML = `<i class="${active ? 'fas' : 'far'} fa-circle"></i>`;
    document.getElementById('waterCard').classList.toggle('completed', active);
}

function updateMoodSelection(mood) {
    const buttons = document.querySelectorAll('.mood-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
    });
    
    const moodDisplay = document.getElementById('moodDisplay');
    const moodEmojis = ['', '😫', '😐', '🙂', '😊', '🤩'];
    moodDisplay.textContent = mood ? moodEmojis[mood] || '—' : '—';
}

function updateMoodTags(tags) {
    tags = tags || [];
    document.querySelectorAll('.mood-tag').forEach(tag => {
        tag.classList.toggle('selected', tags.includes(tag.dataset.tag));
    });
}

function renderHeatmap() {
    const container = document.getElementById('heatmapGrid');
    if (!container) return;
    
    container.innerHTML = '';
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Calculate offset for first day
    let offset = startOfYear.getDay();
    if (offset === 0) offset = 7;
    
    // Create weeks
    for (let week = 0; week < 53; week++) {
        const weekCol = document.createElement('div');
        weekCol.className = 'heatmap-col';
        
        for (let day = 0; day < 7; day++) {
            const cellIndex = week * 7 + day - offset + 1;
            const cell = document.createElement('div');
            cell.className = 'heat-cell';
            
            if (cellIndex > 0 && cellIndex <= 365) {
                const date = new Date(startOfYear);
                date.setDate(startOfYear.getDate() + cellIndex - 1);
                const dateKey = formatDateKey(date);
                
                // Check entry level
                storage.getEntry(dateKey).then(entry => {
                    let level = 0;
                    if (entry.sport) level++;
                    if (entry.water >= entry.waterGoal) level++;
                    if (entry.mood >= 4) level++;
                    cell.setAttribute('data-level', Math.min(level, 5));
                });
            }
            
            weekCol.appendChild(cell);
        }
        
        container.appendChild(weekCol);
    }
}

function renderStats() {
    storage.getAllEntries().then(entries => {
        // Calculate streak
        let streak = 0;
        let currentDate = new Date();
        
        while (true) {
            const dateKey = formatDateKey(currentDate);
            const entry = entries[dateKey];
            
            if (entry && entry.sport) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        document.getElementById('streakCount').textContent = streak;
        
        // Total workouts
        const totalWorkouts = Object.values(entries).filter(e => e.sport).length;
        document.getElementById('totalWorkouts').textContent = totalWorkouts;
        
        // Best streak (simplified)
        let bestStreak = 0;
        let tempStreak = 0;
        const dates = Object.keys(entries).sort();
        
        for (let i = 0; i < dates.length; i++) {
            if (entries[dates[i]]?.sport) {
                tempStreak++;
                bestStreak = Math.max(bestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        
        document.getElementById('bestStreak').textContent = bestStreak;
        
        // Completion rate (this month)
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        let completed = 0;
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (entries[dateKey]?.sport) completed++;
        }
        
        const rate = Math.round((completed / daysInMonth) * 100);
        document.getElementById('completionRate').textContent = `${rate}%`;
    });
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('prevDayBtn').addEventListener('click', () => changeDay(-1));
    document.getElementById('nextDayBtn').addEventListener('click', () => changeDay(1));
    document.getElementById('monthClickable').addEventListener('click', openModal);
    
    // Modals
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('modalPrevMonth').addEventListener('click', () => changeModalMonth(-1));
    document.getElementById('modalNextMonth').addEventListener('click', () => changeModalMonth(1));
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    
    // Inputs
    elements.customEx.addEventListener('input', scheduleSave);
    elements.note.addEventListener('input', scheduleSave);
    
    // Nicotine
    document.getElementById('nicotineToggle').addEventListener('click', toggleNicotine);
    document.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', () => adjustNicotine(btn.dataset.action));
    });
    document.getElementById('nicotineNote').addEventListener('input', scheduleSave);
    
    // Alcohol
    document.getElementById('alcoholToggle').addEventListener('click', toggleAlcohol);
    document.querySelectorAll('.drink-btn').forEach(btn => {
        btn.addEventListener('click', () => selectDrink(btn.dataset.type));
    });
    
    // Sleep
    document.getElementById('sleepToggle').addEventListener('click', toggleSleep);
    document.getElementById('sleepTime').addEventListener('change', () => { updateSleepDuration(); scheduleSave(); });
    document.getElementById('wakeupTime').addEventListener('change', () => { updateSleepDuration(); scheduleSave(); });
    document.querySelectorAll('#qualityStars i').forEach(star => {
        star.addEventListener('click', () => setSleepQuality(parseInt(star.dataset.rating)));
    });
    
    // Water
    document.querySelectorAll('.water-btn').forEach(btn => {
        btn.addEventListener('click', () => addWater(parseFloat(btn.dataset.amount)));
    });
    document.getElementById('waterToggle').addEventListener('click', toggleWater);
    
    // Mood
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => setMood(parseInt(btn.dataset.mood)));
    });
    document.querySelectorAll('.mood-tag').forEach(tag => {
        tag.addEventListener('click', () => toggleMoodTag(tag.dataset.tag));
    });
    
    // Settings
    document.getElementById('addExerciseBtn').addEventListener('click', addExercise);
    document.getElementById('notificationToggle').addEventListener('click', toggleNotifications);
    
    // Export/Import
    document.getElementById('exportDataBtn').addEventListener('click', () => exporter.exportToJSON());
    document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importFileInput').click());
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        if (e.target.files[0]) exporter.importFromFile(e.target.files[0]);
    });
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    
    // Language
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Analytics tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            charts.updateCharts(btn.dataset.tab);
        });
    });
}

// Navigation
function changeDay(delta) {
    const newDate = new Date(state.currentDate);
    newDate.setDate(state.currentDate.getDate() + delta);
    loadDay(newDate);
    haptic();
}

function changeModalMonth(delta) {
    // Implementation for modal month navigation
    haptic();
}

function openModal() {
    document.getElementById('monthModal').style.display = 'block';
    renderModalTrackers();
    haptic();
}

function closeModal() {
    document.getElementById('monthModal').style.display = 'none';
}

function openSettings() {
    renderExercisesList();
    renderIconPreview();
    document.getElementById('settingsModal').style.display = 'block';
    haptic();
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Tracker toggles
function toggleNicotine() {
    state.currentEntry.nicotine = !state.currentEntry.nicotine;
    updateNicotineStatus(state.currentEntry.nicotine);
    scheduleSave();
    haptic();
}

function adjustNicotine(action) {
    const countEl = document.getElementById('nicotineCount');
    let count = state.currentEntry.nicotineCount || 0;
    
    if (action === 'increase') count++;
    else if (action === 'decrease' && count > 0) count--;
    
    countEl.textContent = count;
    state.currentEntry.nicotineCount = count;
    scheduleSave();
    haptic();
}

function toggleAlcohol() {
    state.currentEntry.alcohol = !state.currentEntry.alcohol;
    updateAlcoholStatus(state.currentEntry.alcohol);
    scheduleSave();
    haptic();
}

function selectDrink(type) {
    const current = state.currentEntry.alcoholDrinks || { beer: 0, wine: 0, vodka: 0 };
    current[type] = (current[type] || 0) + 1;
    state.currentEntry.alcoholDrinks = current;
    updateDrinkCounter(current);
    state.currentEntry.alcohol = true;
    updateAlcoholStatus(true);
    scheduleSave();
    haptic();
}

function toggleSleep() {
    state.currentEntry.sleep = !state.currentEntry.sleep;
    updateSleepStatus(state.currentEntry.sleep);
    scheduleSave();
    haptic();
}

function setSleepQuality(rating) {
    state.currentEntry.sleepQuality = rating;
    updateSleepQuality(rating);
    scheduleSave();
    haptic();
}

function addWater(amount) {
    state.currentEntry.water = (state.currentEntry.water || 0) + amount;
    updateWaterProgress(state.currentEntry.water, state.currentEntry.waterGoal || 3);
    state.currentEntry.waterGoal = state.currentEntry.waterGoal || 3;
    scheduleSave();
    haptic();
}

function toggleWater() {
    const goal = state.currentEntry.waterGoal || 3;
    updateWaterStatus(state.currentEntry.water >= goal);
    // No need to toggle, just show current status
}

function setMood(rating) {
    state.currentEntry.mood = rating;
    updateMoodSelection(rating);
    scheduleSave();
    haptic();
}

function toggleMoodTag(tag) {
    const tags = state.currentEntry.moodTags || [];
    const index = tags.indexOf(tag);
    
    if (index === -1) {
        tags.push(tag);
    } else {
        tags.splice(index, 1);
    }
    
    state.currentEntry.moodTags = tags;
    updateMoodTags(tags);
    scheduleSave();
    haptic();
}

// Save functions
function scheduleSave() {
    if (state.saveTimeout) {
        clearTimeout(state.saveTimeout);
    }
    
    state.saveTimeout = setTimeout(() => {
        saveEntry();
    }, 500);
}

async function saveEntry() {
    // Gather exercise data
    const details = { custom: elements.customEx.value.trim() };
    document.querySelectorAll('.ex-btn.active').forEach(btn => {
        const key = btn.dataset.exercise;
        if (key) details[key] = true;
    });
    
    state.currentEntry.sportDetails = details;
    state.currentEntry.sport = Object.keys(details).length > 1 || details.custom;
    state.currentEntry.note = elements.note.value;
    
    await storage.saveEntry(state.currentEntry);
    showSaveIndicator();
    
    // Update stats
    renderStats();
}

// Settings
function renderExercisesList() {
    const container = document.getElementById('customExercisesList');
    container.innerHTML = '';
    
    for (const ex of state.userExercises) {
        const item = document.createElement('div');
        item.className = 'custom-ex-item';
        item.innerHTML = `
            <span><i class="fas fa-tag"></i> ${ex}</span>
            <span class="delete-ex" data-ex="${ex}"><i class="fas fa-trash"></i></span>
        `;
        container.appendChild(item);
    }
    
    document.querySelectorAll('.delete-ex').forEach(btn => {
        btn.addEventListener('click', () => {
            state.userExercises = state.userExercises.filter(e => e !== btn.dataset.ex);
            localStorage.setItem('antihero_user_exercises', JSON.stringify(state.userExercises));
            renderExercisesList();
            renderExercises();
            haptic();
        });
    });
}

function addExercise() {
    const input = document.getElementById('newExerciseName');
    const name = input.value.trim();
    
    if (name && !state.userExercises.includes(name)) {
        state.userExercises.push(name);
        localStorage.setItem('antihero_user_exercises', JSON.stringify(state.userExercises));
        renderExercisesList();
        renderExercises();
        input.value = '';
        haptic();
    }
}

const ICONS = [
    { id: 'default', char: 'fa-plus-circle' },
    { id: 'skull', char: 'fa-skull' },
    { id: 'bolt', char: 'fa-bolt' },
    { id: 'target', char: 'fa-bullseye' },
    { id: 'fire', char: 'fa-fire' }
];

function renderIconPreview() {
    const container = document.getElementById('iconPreview');
    container.innerHTML = '';
    
    for (const icon of ICONS) {
        const option = document.createElement('div');
        option.className = 'icon-option' + (state.appIcon === icon.id ? ' selected' : '');
        option.innerHTML = `<i class="fas ${icon.char}"></i>`;
        option.addEventListener('click', () => {
            state.appIcon = icon.id;
            localStorage.setItem('antihero_app_icon', icon.id);
            updateAppIcon();
            renderIconPreview();
            haptic();
        });
        container.appendChild(option);
    }
}

function updateAppIcon() {
    const icon = ICONS.find(i => i.id === state.appIcon) || ICONS[0];
    document.getElementById('logo').innerHTML = `
        <i class="fas ${icon.char}"></i>
        <i class="fas ${icon.char}"></i>
        <i class="fas ${icon.char}"></i>
    `;
}

function toggleNotifications() {
    state.notifEnabled = !state.notifEnabled;
    localStorage.setItem('antihero_notif', state.notifEnabled);
    
    const toggle = document.getElementById('notificationToggle');
    toggle.classList.toggle('active', state.notifEnabled);
    toggle.querySelector('.toggle-knob').style.left = state.notifEnabled ? '26px' : '3px';
    
    if (state.notifEnabled) {
        setupNotifications();
    }
    
    haptic();
}

// PWA
function setupPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        
        document.getElementById('installPrompt').style.display = 'block';
        
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (state.deferredPrompt) {
                state.deferredPrompt.prompt();
                const result = await state.deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    document.getElementById('installPrompt').style.display = 'none';
                }
                state.deferredPrompt = null;
            }
        });
        
        document.getElementById('installDismiss').addEventListener('click', () => {
            document.getElementById('installPrompt').style.display = 'none';
        });
    });
}

// Notifications
function setupNotifications() {
    if (!state.notifEnabled) return;
    
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
    
    // Schedule daily reminder at 21:00
    const now = new Date();
    const reminder = new Date();
    reminder.setHours(21, 0, 0, 0);
    
    let delay = reminder - now;
    if (delay < 0) delay += 24 * 60 * 60 * 1000;
    
    setTimeout(() => {
        if (state.notifEnabled && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('АНТИГЕРОЙ', { body: 'Не забудь отметить день!' });
        }
        
        // Repeat daily
        setInterval(() => {
            if (state.notifEnabled && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('АНТИГЕРОЙ', { body: 'Не забудь отметить день!' });
            }
        }, 24 * 60 * 60 * 1000);
    }, delay);
}

// Clear data
async function clearAllData() {
    if (confirm('Вы уверены? Все данные будут удалены!')) {
        await storage.clearAll();
        localStorage.removeItem('antihero_user_exercises');
        showToast('Данные очищены');
        setTimeout(() => location.reload(), 1000);
    }
}

// Utility functions
function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function haptic() {
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
}

function showSaveIndicator() {
    const indicator = elements.saveIndicator;
    indicator.classList.add('show');
    setTimeout(() => indicator.classList.remove('show'), 1000);
}

window.showToast = function(message) {
    const toast = elements.toast;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

function renderModalTrackers() {
    // Implementation for modal calendar view
}

// Modal calendar rendering
function renderModalCal(category, year, month, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Weekdays header
    const weekdays = document.createElement('div');
    weekdays.className = 'weekdays';
    ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].forEach(day => {
        const el = document.createElement('div');
        el.className = 'weekday';
        el.textContent = day;
        weekdays.appendChild(el);
    });
    container.appendChild(weekdays);
    
    // Calendar grid
    const calendar = document.createElement('div');
    calendar.className = 'mini-calendar';
    
    const firstDay = new Date(year, month, 1);
    let offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    for (let i = 0; i < 42; i++) {
        const tile = document.createElement('div');
        tile.className = 'day-tile';
        
        let day, currentMonth = true, y = year, m = month;
        
        if (i < offset) {
            currentMonth = false;
            day = prevMonthDays - (offset - i - 1);
            m--;
            if (m < 0) { m = 11; y--; }
        } else if (i >= offset + daysInMonth) {
            currentMonth = false;
            day = i - (offset + daysInMonth) + 1;
            m++;
            if (m > 11) { m = 0; y++; }
        } else {
            day = i - offset + 1;
        }
        
        if (!currentMonth) tile.classList.add('empty');
        
        const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        tile.textContent = day;
        
        // Check if today
        const today = new Date();
        if (currentMonth && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            tile.classList.add('today');
        }
        
        // Check if active
        storage.getEntry(dateKey).then(entry => {
            let active = false;
            if (category === 'sport') active = entry.sport;
            if (category === 'nicotine') active = entry.nicotine;
            if (category === 'alcohol') active = entry.alcohol;
            if (category === 'sleep') active = entry.sleep;
            if (category === 'water') active = entry.water >= entry.waterGoal;
            if (category === 'mood') active = entry.mood > 0;
            
            if (active) tile.classList.add('active');
        });
        
        if (currentMonth) {
            tile.addEventListener('click', () => {
                state.currentDate = new Date(y, m, day);
                loadDay(state.currentDate);
                closeModal();
                haptic();
            });
        }
        
        calendar.appendChild(tile);
    }
    
    container.appendChild(calendar);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
