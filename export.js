// js/export.js — Экспорт/Импорт данных
import { storage } from './storage.js';
import { showToast } from './app.js';

export class Exporter {
    async exportToJSON() {
        try {
            const data = await storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `antihero_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Данные экспортированы!');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Ошибка экспорта');
        }
    }

    async importFromFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.version || !data.entries) {
                throw new Error('Invalid file format');
            }
            
            await storage.importData(data);
            showToast('Данные импортированы! Перезагрузите страницу.');
            
            // Reload after delay
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            console.error('Import error:', error);
            showToast('Ошибка импорта файла');
        }
    }

    exportToCSV() {
        storage.getAllEntries().then(entries => {
            const headers = ['date', 'sport', 'nicotine', 'alcohol', 'sleep', 'water', 'mood', 'note'];
            let csv = headers.join(',') + '\n';
            
            for (const [date, entry] of Object.entries(entries)) {
                const row = [
                    date,
                    entry.sport ? 1 : 0,
                    entry.nicotine ? 1 : 0,
                    entry.alcohol ? 1 : 0,
                    entry.sleep ? 1 : 0,
                    entry.water || 0,
                    entry.mood || 0,
                    `"${(entry.note || '').replace(/"/g, '""')}"`
                ];
                csv += row.join(',') + '\n';
            }
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `antihero_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('CSV экспортирован!');
        });
    }
}

export const exporter = new Exporter();
