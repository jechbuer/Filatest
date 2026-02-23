// 📚 Stammdaten-Service (Materials, Hersteller, etc. in Firebase)
import { getDb } from '../config/firebase.js';
import { APP_CONFIG, DEFAULT_MATERIALS, DEFAULT_BRANDS, SPOOL_TYPES } from '../config/constants.js';

class MasterDataService {
    constructor() {
        this.db = null;
        this.collections = APP_CONFIG.masterDataCollections;
        this.cache = {
            materials: null,
            brands: null,
            spoolTypes: null
        };
        this.lastFetch = {
            materials: null,
            brands: null,
            spoolTypes: null
        };
        this.cacheDuration = 5 * 60 * 1000; // 5 Minuten Cache
    }

    async init() {
        if (!this.db) {
            this.db = getDb();
        }
    }

    // Cache prüfen
    isCacheValid(key) {
        if (!this.cache[key] || !this.lastFetch[key]) return false;
        return (Date.now() - this.lastFetch[key]) < this.cacheDuration;
    }

    // ==================== MATERIALIEN ====================

    // Materialien aus Firebase laden (oder initialisieren)
    async getMaterials(forceRefresh = false) {
        await this.init();
        
        if (!forceRefresh && this.isCacheValid('materials')) {
            return this.cache.materials;
        }

        try {
            const snapshot = await this.db.collection(this.collections.materials).get();
            
            // Wenn keine Materialien existieren, initialisieren
            if (snapshot.empty) {
                await this.initializeMaterials();
                return this.cache.materials;
            }

            const materials = [];
            snapshot.forEach(doc => {
                materials.push({ id: doc.id, ...doc.data() });
            });

            this.cache.materials = materials;
            this.lastFetch.materials = Date.now();
            return materials;
        } catch (error) {
            console.error('Fehler beim Laden der Materialien:', error);
            // Fallback auf Defaults
            return DEFAULT_MATERIALS;
        }
    }

    // Standard-Materialien in Firebase initialisieren
    async initializeMaterials() {
        const batch = this.db.batch();
        
        DEFAULT_MATERIALS.forEach(material => {
            const docRef = this.db.collection(this.collections.materials).doc(material.id);
            batch.set(docRef, {
                ...material,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isDefault: true
            });
        });

        await batch.commit();
        this.cache.materials = DEFAULT_MATERIALS;
        this.lastFetch.materials = Date.now();
        console.log('✅ Materialien initialisiert');
    }

    // Neues Material hinzufügen
    async addMaterial(materialData) {
        await this.init();
        const docRef = this.db.collection(this.collections.materials).doc();
        const data = {
            ...materialData,
            id: docRef.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isDefault: false
        };
        await docRef.set(data);
        this.cache.materials = null; // Cache invalidieren
        return data;
    }

    // Material aktualisieren
    async updateMaterial(id, updates) {
        await this.init();
        await this.db.collection(this.collections.materials).doc(id).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        this.cache.materials = null;
    }

    // ==================== HERSTELLER ====================

    // Hersteller aus Firebase laden
    async getBrands(forceRefresh = false) {
        await this.init();
        
        if (!forceRefresh && this.isCacheValid('brands')) {
            return this.cache.brands;
        }

        try {
            const snapshot = await this.db.collection(this.collections.brands).get();
            
            if (snapshot.empty) {
                await this.initializeBrands();
                return this.cache.brands;
            }

            const brands = [];
            snapshot.forEach(doc => {
                brands.push({ id: doc.id, ...doc.data() });
            });

            this.cache.brands = brands;
            this.lastFetch.brands = Date.now();
            return brands;
        } catch (error) {
            console.error('Fehler beim Laden der Hersteller:', error);
            return DEFAULT_BRANDS;
        }
    }

    // Standard-Hersteller initialisieren
    async initializeBrands() {
        const batch = this.db.batch();
        
        DEFAULT_BRANDS.forEach(brand => {
            const docRef = this.db.collection(this.collections.brands).doc(brand.id);
            batch.set(docRef, {
                ...brand,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isDefault: true
            });
        });

        await batch.commit();
        this.cache.brands = DEFAULT_BRANDS;
        this.lastFetch.brands = Date.now();
        console.log('✅ Hersteller initialisiert');
    }

    // Neuen Hersteller hinzufügen
    async addBrand(brandData) {
        await this.init();
        const docRef = this.db.collection(this.collections.brands).doc();
        const data = {
            ...brandData,
            id: docRef.id,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isDefault: false
        };
        await docRef.set(data);
        this.cache.brands = null;
        return data;
    }

    // Hersteller aktualisieren
    async updateBrand(id, updates) {
        await this.init();
        await this.db.collection(this.collections.brands).doc(id).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        this.cache.brands = null;
    }

    // Hersteller löschen
    async deleteBrand(id) {
        await this.init();
        await this.db.collection(this.collections.brands).doc(id).delete();
        this.cache.brands = null;
    }

    // ==================== SPULENTYPEN ====================

    // Spulentypen laden
    async getSpoolTypes(forceRefresh = false) {
        await this.init();
        
        if (!forceRefresh && this.isCacheValid('spoolTypes')) {
            return this.cache.spoolTypes;
        }

        try {
            const snapshot = await this.db.collection(this.collections.spoolTypes).get();
            
            if (snapshot.empty) {
                await this.initializeSpoolTypes();
                return this.cache.spoolTypes;
            }

            const types = [];
            snapshot.forEach(doc => {
                types.push({ id: doc.id, ...doc.data() });
            });

            this.cache.spoolTypes = types;
            this.lastFetch.spoolTypes = Date.now();
            return types;
        } catch (error) {
            console.error('Fehler beim Laden der Spulentypen:', error);
            return Object.entries(SPOOL_TYPES).map(([id, data]) => ({ id, ...data }));
        }
    }

    // Spulentypen initialisieren
    async initializeSpoolTypes() {
        const batch = this.db.batch();
        
        Object.entries(SPOOL_TYPES).forEach(([id, data]) => {
            const docRef = this.db.collection(this.collections.spoolTypes).doc(id);
            batch.set(docRef, {
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isDefault: true
            });
        });

        await batch.commit();
        this.cache.spoolTypes = Object.entries(SPOOL_TYPES).map(([id, data]) => ({ id, ...data }));
        this.lastFetch.spoolTypes = Date.now();
        console.log('✅ Spulentypen initialisiert');
    }

    // ==================== HILFSFUNKTIONEN ====================

    // Material-Optionen für Dropdown
    async getMaterialOptions() {
        const materials = await this.getMaterials();
        return materials.map(m => ({
            value: m.name,
            text: m.name,
            color: m.color
        }));
    }

    // Hersteller-Optionen gruppiert nach Typ
    async getBrandOptions() {
        const brands = await this.getBrands();
        const grouped = {
            plastic: brands.filter(b => b.type === 'plastic'),
            cardboard: brands.filter(b => b.type === 'cardboard'),
            other: brands.filter(b => !b.type || (b.type !== 'plastic' && b.type !== 'cardboard'))
        };
        return grouped;
    }

    // Tara für Hersteller abrufen
    async getTaraForBrand(brandId) {
        const brands = await this.getBrands();
        const brand = brands.find(b => b.id === brandId);
        return brand ? brand.tara : 220;
    }

    // Alle Stammdaten auf einmal laden
    async loadAllMasterData() {
        const [materials, brands, spoolTypes] = await Promise.all([
            this.getMaterials(),
            this.getBrands(),
            this.getSpoolTypes()
        ]);
        
        return { materials, brands, spoolTypes };
    }

    // Cache leeren
    clearCache() {
        this.cache = { materials: null, brands: null, spoolTypes: null };
        this.lastFetch = { materials: null, brands: null, spoolTypes: null };
    }
}

export const masterDataService = new MasterDataService();
