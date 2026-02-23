// 💾 Datenbank-Service für Filamente
import { getDb } from '../config/firebase.js';
import { APP_CONFIG } from '../config/constants.js';

class FilamentService {
    constructor() {
        this.collectionName = APP_CONFIG.collectionName;
        this.listeners = [];
    }

    // Alle Filamente laden
    async getAll() {
        try {
            const db = getDb();
            const snapshot = await db.collection(this.collectionName).get();
            const filaments = [];
            snapshot.forEach(doc => {
                filaments.push({ id: doc.id, ...doc.data() });
            });
            return filaments;
        } catch (error) {
            console.error('Fehler beim Laden der Filamente:', error);
            throw error;
        }
    }

    // Einzelnes Filament laden
    async getById(id) {
        try {
            const db = getDb();
            const doc = await db.collection(this.collectionName).doc(id).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Fehler beim Laden des Filaments:', error);
            throw error;
        }
    }

    // Nach Barcode suchen
    async getByBarcode(barcode) {
        try {
            const db = getDb();
            const snapshot = await db.collection(this.collectionName)
                .where('barcode', '==', barcode)
                .get();
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('Fehler beim Suchen nach Barcode:', error);
            throw error;
        }
    }

    // Nach Text suchen (Hersteller, Material, Farbe, Barcode)
    async search(query) {
        try {
            if (!query || query.trim() === '') {
                return this.getAll();
            }
            
            const db = getDb();
            const searchTerm = query.toLowerCase().trim();
            
            // Alle Filamente laden und client-seitig filtern
            // (Firestore hat keine echte Volltextsuche)
            const snapshot = await db.collection(this.collectionName).get();
            const filaments = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const searchableText = [
                    data.Material || '',
                    data.Color || '',
                    data.Manufakturere || '',
                    data.barcode || ''
                ].join(' ').toLowerCase();
                
                if (searchableText.includes(searchTerm)) {
                    filaments.push({ id: doc.id, ...data });
                }
            });
            
            return filaments;
        } catch (error) {
            console.error('Fehler bei der Suche:', error);
            throw error;
        }
    }

    // Neues Filament speichern
    async create(filamentData) {
        try {
            const db = getDb();
            const data = {
                ...filamentData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await db.collection(this.collectionName).add(data);
            return { id: docRef.id, ...data };
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            throw error;
        }
    }

    // Filament aktualisieren
    async update(id, updates) {
        try {
            const db = getDb();
            const data = {
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection(this.collectionName).doc(id).update(data);
            return { id, ...updates };
        } catch (error) {
            console.error('Fehler beim Aktualisieren:', error);
            throw error;
        }
    }

    // Gewicht reduzieren (Verbrauch buchen)
    async consume(id, amount) {
        try {
            const filament = await this.getById(id);
            if (!filament) throw new Error('Filament nicht gefunden');
            
            const newWeight = filament.Weightnetto - amount;
            
            if (newWeight <= 0) {
                await this.delete(id);
                return { deleted: true };
            } else {
                await this.update(id, { Weightnetto: newWeight });
                return { id, newWeight };
            }
        } catch (error) {
            console.error('Fehler beim Buchen des Verbrauchs:', error);
            throw error;
        }
    }

    // Filament löschen
    async delete(id) {
        try {
            const db = getDb();
            await db.collection(this.collectionName).doc(id).delete();
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            throw error;
        }
    }

    // Echtzeit-Updates abonnieren
    onSnapshot(callback) {
        try {
            const db = getDb();
            const unsubscribe = db.collection(this.collectionName)
                .orderBy('Zimestamp', 'desc')
                .onSnapshot(snapshot => {
                    const filaments = [];
                    snapshot.forEach(doc => {
                        filaments.push({ id: doc.id, ...doc.data() });
                    });
                    callback(filaments);
                }, error => {
                    console.error('Snapshot Fehler:', error);
                });
            
            this.listeners.push(unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Fehler beim Einrichten des Listeners:', error);
            throw error;
        }
    }

    // Alle Listener entfernen
    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }

    // Statistiken laden
    async getStats() {
        try {
            const filaments = await this.getAll();
            const total = filaments.length;
            const totalWeight = filaments.reduce((sum, f) => sum + (f.Weightnetto || 0), 0);
            
            // Material-Verteilung
            const byMaterial = {};
            filaments.forEach(f => {
                const mat = f.Material || 'Unbekannt';
                byMaterial[mat] = (byMaterial[mat] || 0) + 1;
            });

            // Gewicht pro Material
            const weightByMaterial = {};
            filaments.forEach(f => {
                const mat = f.Material || 'Unbekannt';
                weightByMaterial[mat] = (weightByMaterial[mat] || 0) + (f.Weightnetto || 0);
            });

            return {
                total,
                totalWeight,
                byMaterial,
                weightByMaterial,
                filaments
            };
        } catch (error) {
            console.error('Fehler beim Laden der Statistiken:', error);
            throw error;
        }
    }

    // Export als JSON
    async export() {
        try {
            const filaments = await this.getAll();
            const data = {
                exportDate: new Date().toISOString(),
                version: APP_CONFIG.version,
                filaments
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `filament-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Fehler beim Exportieren:', error);
            throw error;
        }
    }
}

export const filamentService = new FilamentService();
