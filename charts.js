// js/charts.js — Chart.js графики
import { storage } from './storage.js';

export class Charts {
    constructor() {
        this.activityChart = null;
        this.habitsChart = null;
        this.colors = {
            sport: '#BBEF1F',
            nicotine: '#FF0055',
            alcohol: '#EFF8FF',
            sleep: '#9b59b6',
            water: '#3498db',
            mood: '#f39c12'
        };
    }

    init() {
        this.initActivityChart();
        this.initHabitsChart();
    }

    initActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        this.activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Активность',
                    data: [],
                    backgroundColor: this.colors.sport,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0D0303',
                        titleColor: '#BBEF1F',
                        bodyColor: '#EFF8FF',
                        borderColor: '#2a0a0a',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a8a8a', font: { size: 8 } }
                    },
                    y: {
                        grid: { color: '#2a0a0a' },
                        ticks: { color: '#8a8a8a', stepSize: 1 },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    initHabitsChart() {
        const ctx = document.getElementById('habitsChart');
        if (!ctx) return;

        this.habitsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Спорт', 'Никотин', 'Алкоголь'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [this.colors.sport, this.colors.nicotine, this.colors.alcohol],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8a8a8a',
                            font: { size: 8 },
                            padding: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0D0303',
                        titleColor: '#BBEF1F',
                        bodyColor: '#EFF8FF'
                    }
                }
            }
        });
    }

    async updateCharts(period = 'week') {
        const today = new Date();
        let startDate, labels;

        switch (period) {
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                labels = this.getWeekLabels(startDate);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                labels = this.getMonthLabels(today.getMonth());
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                labels = this.getYearLabels();
                break;
        }

        const startKey = this.formatDate(startDate);
        const endKey = this.formatDate(today);
        const entries = await storage.getEntriesInRange(startKey, endKey);

        // Update activity chart
        const activityData = labels.map(label => {
            const entry = entries[label.key];
            return entry ? this.calculateActivityScore(entry) : 0;
        });

        this.activityChart.data.labels = labels.map(l => l.display);
        this.activityChart.data.datasets[0].data = activityData;
        this.activityChart.update('none');

        // Update habits chart (month only)
        if (period === 'month') {
            let sport = 0, nicotine = 0, alcohol = 0;
            
            for (const entry of Object.values(entries)) {
                if (entry.sport) sport++;
                if (entry.nicotine) nicotine++;
                if (entry.alcohol) alcohol++;
            }

            this.habitsChart.data.datasets[0].data = [sport, nicotine, alcohol];
            this.habitsChart.update('none');
        }
    }

    calculateActivityScore(entry) {
        let score = 0;
        if (entry.sport) score += 3;
        if (entry.sleep && entry.sleepQuality >= 3) score += 1;
        if (entry.water >= entry.waterGoal) score += 1;
        if (entry.mood >= 4) score += 1;
        return score;
    }

    getWeekLabels(startDate) {
        const labels = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dayNames = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
            labels.push({
                key: this.formatDate(date),
                display: dayNames[date.getDay()]
            });
        }
        return labels;
    }

    getMonthLabels(month) {
        const labels = [];
        const daysInMonth = new Date(new Date().getFullYear(), month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            labels.push({
                key: `${new Date().getFullYear()}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                display: String(i)
            });
        }
        return labels;
    }

    getYearLabels() {
        const labels = [];
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        for (let i = 0; i < 12; i++) {
            labels.push({
                key: String(i),
                display: months[i]
            });
        }
        return labels;
    }

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    destroy() {
        if (this.activityChart) {
            this.activityChart.destroy();
            this.activityChart = null;
        }
        if (this.habitsChart) {
            this.habitsChart.destroy();
            this.habitsChart = null;
        }
    }
}

export const charts = new Charts();
