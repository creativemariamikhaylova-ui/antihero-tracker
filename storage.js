// js/storage.js — IndexedDB + localStorage
export class Storage {
    constructor() {
        this.dbName = 'antihero_db';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Main data store
                if (!db.objectStoreNames.contains('entries')) {
                    const store = db.createObjectStore('entries', { keyPath: 'date' });
                    store.createIndex('date', 'date', { unique: true });
                }
                
                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Get single entry
    async getEntry(date) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                // Fallback to localStorage
                const raw = localStorage.getItem('antihero_main_data');
                if (raw) {
                    try {
                        const data = JSON.parse(raw);
                        resolve(data[date] || this.getDefaultEntry());
                    } catch {
                        resolve(this.getDefaultEntry());
                    }
                } else {
                    resolve(this.getDefaultEntry());
                }
                return;
            }
            
            const tx = this.db.transaction('entries', 'readonly');
            const store = tx.objectStore('entries');
            const request = store.get(date);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || this.getDefaultEntry());
        });
    }

    // Save single entry
    async saveEntry(entry) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                // Fallback to localStorage
                const raw = localStorage.getItem('antihero_main_data');
                let data = {};
                if (raw) {
                    try { data = JSON.parse(raw); } catch {}
                }
                data[entry.date] = entry;
                localStorage.setItem('antihero_main_data', JSON.stringify(data));
                resolve();
                return;
            }
            
            const tx = this.db.transaction('entries', 'readwrite');
            const store = tx.objectStore('entries');
            const request = store.put(entry);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Get all entries (for analytics)
    async getAllEntries() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                const raw = localStorage.getItem('antihero_main_data');
                if (raw) {
                    try {
                        resolve(JSON.parse(raw));
                    } catch {
                        resolve({});
                    }
                } else {
                    resolve({});
                }
                return;
            }
            
            const tx = this.db.transaction('entries', 'readonly');
            const store = tx.objectStore('entries');
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Get entries for date range
    async getEntriesInRange(startDate, endDate) {
        const entries = await this.getAllEntries();
        const result = {};
        
        for (const [date, entry] of Object.entries(entries)) {
            if (date >= startDate && date <= endDate) {
                result[date] = entry;
            }
        }
        
        return result;
    }

    // Clear all data
    async clearAll() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                localStorage.removeItem('antihero_main_data');
                localStorage.removeItem('antihero_user_exercises');
                resolve();
                return;
            }
            
            const tx = this.db.transaction('entries', 'readwrite');
            const store = tx.objectStore('entries');
            const request = store.clear();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Export all data as JSON
    async exportData() {
        const entries = await this.getAllEntries();
        const exercises = JSON.parse(localStorage.getItem('antihero_user_exercises') || '[]');
        const settings = {
            appIcon: localStorage.getItem('antihero_app_icon') || 'default',
            notifications: localStorage.getItem('antihero_notif') === 'true',
            language: localStorage.getItem('antihero_lang') || 'ru'
        };
        
        return {
            version: '2.0',
            exportDate: new Date().toISOString(),
            entries,
            exercises,
            settings
        };
    }

    // Import data from JSON
    async importData(data) {
        if (data.entries) {
            for (const entry of Object.values(data.entries)) {
                await this.saveEntry(entry);
            }
        }
        
        if (data.exercises) {
            localStorage.setItem('antihero_user_exercises', JSON.stringify(data.exercises));
        }
        
        if (data.settings) {
            if (data.settings.appIcon) localStorage.setItem('antihero_app_icon', data.settings.appIcon);
            if (data.settings.notifications !== undefined) localStorage.setItem('antihero_notif', data.settings.notifications);
            if (data.settings.language) localStorage.setItem('antihero_lang', data.settings.language);
        }
    }

    getDefaultEntry() {
        return {
            sport: false,
            sportDetails: {},
            nicotine: false,
            nicotineCount: 0,
            nicotineNote: "",
            alcohol: false,
            alcoholDrinks: { beer: 0, wine: 0, vodka: 0 },
            sleep: false,
            sleepTime: "23:00",
            wakeupTime: "07:00",
            sleepQuality: 0,
            water: 0,
            waterGoal: 3,
            mood: 0,
            moodTags: [],
            note: "",
            date: ""
        };
    }
}

export const storage = new Storage();
