// js/i18n.js — Локализация
export const translations = {
    ru: {
        app_title: "ДНЕВНИК АНТИГЕРОЯ",
        app_subtitle: "ТВЁРДЫЙ ВХОД · НИКОТИН · ВАЙБ",
        sport_title: "ТВЁРДЫЙ ВХОД",
        nicotine_title: "НИКОТИН-ПЕРЕРЫВ",
        alcohol_title: "ЖИДКИЙ ВАЙБ",
        sleep_title: "СОН",
        water_title: "ВОДА",
        mood_title: "НАСТРОЕНИЕ",
        done: "ВЫПОЛНЕНО",
        relapsed: "СОРВАЛСЯ",
        drank: "УПОТРЕБИЛ",
        slept: "СПАЛ",
        hydrated: "ГИДРАТАЦИЯ",
        analytics: "АНАЛИТИКА",
        week: "НЕДЕЛЯ",
        month: "МЕСЯЦ",
        year: "ГОД",
        activity_chart: "АКТИВНОСТЬ",
        habits_chart: "ПРИВЫЧКИ",
        streak: "ДНЕЙ ПОДРЯД",
        total_workouts: "ТРЕНИРОВОК",
        best_streak: "РЕКОРД",
        completion: "ВЫПОЛНЕНИЕ",
        year_activity: "АКТИВНОСТЬ ЗА ГОД",
        less: "МЕНЬШЕ",
        more: "БОЛЬШЕ",
        settings: "НАСТРОЙКИ",
        custom_exercises: "СВОИ УПРАЖНЕНИЯ",
        exercise_name_placeholder: "НАЗВАНИЕ",
        app_icon: "ИКОНКА ПРИЛОЖЕНИЯ",
        notifications: "НАПОМИНАНИЯ",
        enable_reminders: "ВКЛЮЧИТЬ НАПОМИНАНИЯ (21:00)",
        data_management: "УПРАВЛЕНИЕ ДАННЫМИ",
        export: "ЭКСПОРТ",
        import: "ИМПОРТ",
        clear: "ОЧИСТИТЬ",
        language: "ЯЗЫК",
        saved: "СОХРАНЕНО",
        install_prompt: "Установить приложение на телефон?",
        install: "УСТАНОВИТЬ",
        later: "ПОЗЖЕ",
        custom_ex_placeholder: "СВОЁ УПРАЖНЕНИЕ",
        note_placeholder: "ЗАМЕТКА",
        nicotine_note_placeholder: "ЗАМЕТКА",
        bedtime: "ОТХОД К СНУ",
        wakeup: "ПОДЪЁМ",
        duration: "ДЛИТЕЛЬНОСТЬ:",
        quality: "КАЧЕСТВО:"
    },
    en: {
        app_title: "ANTIHERO DIARY",
        app_subtitle: "WORKOUT · NICOTINE · VIBES",
        sport_title: "HARD ENTRY",
        nicotine_title: "NICOTINE BREAK",
        alcohol_title: "LIQUID VIBES",
        sleep_title: "SLEEP",
        water_title: "WATER",
        mood_title: "MOOD",
        done: "DONE",
        relapsed: "RELAPSED",
        drank: "DRANK",
        slept: "SLEPT",
        hydrated: "HYDRATED",
        analytics: "ANALYTICS",
        week: "WEEK",
        month: "MONTH",
        year: "YEAR",
        activity_chart: "ACTIVITY",
        habits_chart: "HABITS",
        streak: "DAY STREAK",
        total_workouts: "WORKOUTS",
        best_streak: "BEST STREAK",
        completion: "COMPLETION",
        year_activity: "YEAR ACTIVITY",
        less: "LESS",
        more: "MORE",
        settings: "SETTINGS",
        custom_exercises: "CUSTOM EXERCISES",
        exercise_name_placeholder: "NAME",
        app_icon: "APP ICON",
        notifications: "NOTIFICATIONS",
        enable_reminders: "ENABLE REMINDERS (21:00)",
        data_management: "DATA MANAGEMENT",
        export: "EXPORT",
        import: "IMPORT",
        clear: "CLEAR",
        language: "LANGUAGE",
        saved: "SAVED",
        install_prompt: "Install app on phone?",
        install: "INSTALL",
        later: "LATER",
        custom_ex_placeholder: "CUSTOM EXERCISE",
        note_placeholder: "NOTE",
        nicotine_note_placeholder: "NOTE",
        bedtime: "BEDTIME",
        wakeup: "WAKE UP",
        duration: "DURATION:",
        quality: "QUALITY:"
    },
    uk: {
        app_title: "ЩОДЕННИК АНТІГЕРОЯ",
        app_subtitle: "ТРЕНУВАННЯ · НІКОТИН · ВАЙБ",
        sport_title: "ТВЕРДИЙ ВХІД",
        nicotine_title: "НІКОТИН-ПЕРЕРИВ",
        alcohol_title: "РІДКИЙ ВАЙБ",
        sleep_title: "СОН",
        water_title: "ВОДА",
        mood_title: "НАСТРІЙ",
        done: "ВИКОНАНО",
        relapsed: "ЗРІВСЯ",
        drank: "ВЖИВ",
        slept: "СПАВ",
        hydrated: "ГІДРАТАЦІЯ",
        analytics: "АНАЛІТИКА",
        week: "ТИЖДЕНЬ",
        month: "МІСЯЦЬ",
        year: "РІК",
        activity_chart: "АКТИВНІСТЬ",
        habits_chart: "ЗВИЧКИ",
        streak: "ДНІВ ПОСПІЛ",
        total_workouts: "ТРЕНУВАНЬ",
        best_streak: "РЕКОРД",
        completion: "ВИКОНАННЯ",
        year_activity: "АКТИВНІСТЬ ЗА РІК",
        less: "МЕНШЕ",
        more: "БІЛЬШЕ",
        settings: "НАЛАШТУВАННЯ",
        custom_exercises: "СВОЇ ВПРАВИ",
        exercise_name_placeholder: "НАЗВА",
        app_icon: "ІКОНКА ДОДАТКУ",
        notifications: "НАГАДУВАННЯ",
        enable_reminders: "УВІМКНУТИ НАГАДУВАННЯ (21:00)",
        data_management: "КЕРУВАННЯ ДАНИМИ",
        export: "ЕКСПОРТ",
        import: "ІМПОРТ",
        clear: "ОЧИСТИТИ",
        language: "МОВА",
        saved: "ЗБЕРЕЖЕНО",
        install_prompt: "Встановити додаток на телефон?",
        install: "ВСТАНОВИТИ",
        later: "ПІЗНІШЕ",
        custom_ex_placeholder: "СВОЯ ВПРАВА",
        note_placeholder: "НОТАТКА",
        nicotine_note_placeholder: "НОТАТКА",
        bedtime: "ВІДХІД ДО СНУ",
        wakeup: "ПІДЙОМ",
        duration: "ТРИВАЛІСТЬ:",
        quality: "ЯКІСТЬ:"
    }
};

let currentLang = localStorage.getItem('antihero_lang') || 'ru';

export function t(key) {
    return translations[currentLang]?.[key] || translations['ru'][key] || key;
}

export function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('antihero_lang', lang);
    applyTranslations();
}

export function getLanguage() {
    return currentLang;
}

export function applyTranslations() {
    // Apply to elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Apply to placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}
