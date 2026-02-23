// 📋 Verbrauchs-Log Service
// Speichert alle Verbrauchsbuchungen mit Kosten und Projekt-Zuordnung

import { getDb } from '../config/firebase.js';

class ConsumptionLogService {
    constructor() {
        this.collectionName = 'ConsumptionLog';
        this.projectsCollection = 'Projects';
        this.db = null;
    }

    async init() {
        if (!this.db) {
            this.db = getDb();
        }
    }

    // Neue Verbrauchsbuchung erstellen
    async createLogEntry(data) {
        await this.init();
        
        const entry = {
            filamentId: data.filamentId || null,
            material: data.material || 'Unknown',
            color: data.color || 'Unknown',
            brand: data.brand || 'Unknown',
            amount: data.amount || 0,              // Verbrauchte Menge in Gramm
            costPerGram: data.costPerGram || 0,    // Preis pro Gramm
            totalCost: data.totalCost || 0,        // Gesamtkosten für diesen Verbrauch
            project: data.project || null,         // Projekt-Name
            projectId: data.projectId || null,     // Projekt-ID
            note: data.note || '',                 // Notiz/Bemerkung
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            date: new Date().toISOString(),
            barcode: data.barcode || null          // Barcode der Spule
        };

        try {
            const docRef = await this.db.collection(this.collectionName).add(entry);
            console.log('✅ Verbrauch geloggt:', docRef.id, 'Kosten: €', entry.totalCost.toFixed(2));
            return { id: docRef.id, ...entry };
        } catch (error) {
            console.error('❌ Fehler beim Loggen:', error);
            throw error;
        }
    }

    // Alle Logs abrufen (mit optionalen Filtern)
    async getLogs(filters = {}) {
        await this.init();
        
        try {
            let query = this.db.collection(this.collectionName).orderBy('timestamp', 'desc');
            
            // Datum-Filter (von)
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                query = query.where('date', '>=', fromDate.toISOString());
            }
            
            // Datum-Filter (bis)
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                query = query.where('date', '<=', toDate.toISOString());
            }
            
            // Projekt-Filter
            if (filters.project) {
                query = query.where('project', '==', filters.project);
            }
            
            // Material-Filter
            if (filters.material) {
                query = query.where('material', '==', filters.material);
            }
            
            const snapshot = await query.get();
            const logs = [];
            snapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() });
            });
            
            return logs;
        } catch (error) {
            console.error('Fehler beim Abrufen der Logs:', error);
            throw error;
        }
    }

    // Logs mit client-seitiger Filterung (für komplexere Filter)
    async getLogsWithClientFilter(filters = {}) {
        await this.init();
        
        try {
            // Basis-Query: Letzte 1000 Einträge
            const snapshot = await this.db.collection(this.collectionName)
                .orderBy('timestamp', 'desc')
                .limit(1000)
                .get();
            
            let logs = [];
            snapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() });
            });
            
            // Client-seitige Filterung
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom).getTime();
                logs = logs.filter(log => new Date(log.date).getTime() >= fromDate);
            }
            
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                logs = logs.filter(log => new Date(log.date).getTime() <= toDate.getTime());
            }
            
            if (filters.project) {
                logs = logs.filter(log => log.project === filters.project);
            }
            
            if (filters.material) {
                logs = logs.filter(log => log.material === filters.material);
            }
            
            return logs;
        } catch (error) {
            console.error('Fehler beim Abrufen der Logs:', error);
            throw error;
        }
    }

    // Statistiken für Logs berechnen
    async getLogStats(filters = {}) {
        const logs = await this.getLogsWithClientFilter(filters);
        
        const stats = {
            totalEntries: logs.length,
            totalWeight: 0,
            totalCost: 0,
            byMaterial: {},
            byProject: {},
            byMonth: {}
        };
        
        logs.forEach(log => {
            // Gewicht und Kosten summieren
            stats.totalWeight += log.amount || 0;
            stats.totalCost += log.totalCost || 0;
            
            // Nach Material
            const mat = log.material || 'Unknown';
            if (!stats.byMaterial[mat]) {
                stats.byMaterial[mat] = { weight: 0, cost: 0, count: 0 };
            }
            stats.byMaterial[mat].weight += log.amount || 0;
            stats.byMaterial[mat].cost += log.totalCost || 0;
            stats.byMaterial[mat].count += 1;
            
            // Nach Projekt
            const proj = log.project || 'Ohne Projekt';
            if (!stats.byProject[proj]) {
                stats.byProject[proj] = { weight: 0, cost: 0, count: 0 };
            }
            stats.byProject[proj].weight += log.amount || 0;
            stats.byProject[proj].cost += log.totalCost || 0;
            stats.byProject[proj].count += 1;
            
            // Nach Monat
            const month = log.date.substring(0, 7); // YYYY-MM
            if (!stats.byMonth[month]) {
                stats.byMonth[month] = { weight: 0, cost: 0, count: 0 };
            }
            stats.byMonth[month].weight += log.amount || 0;
            stats.byMonth[month].cost += log.totalCost || 0;
            stats.byMonth[month].count += 1;
        });
        
        return { logs, stats };
    }

    // Alle Projekte abrufen (für Filter-Dropdown)
    async getAllProjects() {
        await this.init();
        
        try {
            const snapshot = await this.db.collection(this.projectsCollection)
                .orderBy('name')
                .get();
            
            const projects = [];
            snapshot.forEach(doc => {
                projects.push({ id: doc.id, ...doc.data() });
            });
            
            return projects;
        } catch (error) {
            console.error('Fehler beim Abrufen der Projekte:', error);
            return [];
        }
    }

    // Projekt erstellen
    async createProject(name, description = '') {
        await this.init();
        
        try {
            const data = {
                name,
                description,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await this.db.collection(this.projectsCollection).add(data);
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Fehler beim Erstellen des Projekts:', error);
            throw error;
        }
    }

    // Log als CSV exportieren
    exportToCSV(logs) {
        const headers = ['Datum', 'Material', 'Farbe', 'Marke', 'Menge(g)', 'Kosten(€)', 'Projekt', 'Notiz'];
        
        const rows = logs.map(log => [
            log.date ? new Date(log.date).toLocaleString('de-DE') : '',
            log.material || '',
            log.color || '',
            log.brand || '',
            log.amount || 0,
            (log.totalCost || 0).toFixed(2).replace('.', ','),
            log.project || '',
            `"${(log.note || '').replace(/"/g, '""')}"`
        ]);
        
        const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verbrauchs-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Einzelnen Log-Eintrag löschen
    async deleteLogEntry(id) {
        await this.init();
        
        try {
            await this.db.collection(this.collectionName).doc(id).delete();
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Log-Eintrags:', error);
            throw error;
        }
    }
}

export const consumptionLogService = new ConsumptionLogService();
