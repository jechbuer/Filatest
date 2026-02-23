// 📋 Konstanten und Stammdaten

// Tara-Datenbank (Hersteller und deren Leergewichte)
export const TARA_DATABASE = {
    'prusament': { name: 'Prusament', tara: 201, type: 'plastic' },
    'esun': { name: 'eSun', tara: 230, type: 'plastic' },
    'sunlu': { name: 'Sunlu', tara: 140, type: 'plastic' },
    'overture': { name: 'Overture', tara: 237, type: 'plastic' },
    'hatchbox': { name: 'Hatchbox', tara: 235, type: 'plastic' },
    'polyterra': { name: 'PolyTerra', tara: 139, type: 'cardboard' },
    '3djake_eco': { name: '3DJake Eco', tara: 209, type: 'cardboard' },
    'elegoo_card': { name: 'Elegoo Cardboard', tara: 145, type: 'cardboard' },
    'generic_plastic': { name: 'Standard Kunststoff', tara: 220, type: 'plastic' },
    'generic_cardboard': { name: 'Standard Pappe', tara: 145, type: 'cardboard' }
};

// Standard Materialien
export const DEFAULT_MATERIALS = [
    { id: 'pla', name: 'PLA', color: '#4ade80', nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
    { id: 'petg', name: 'PETG', color: '#60a5fa', nozzleTempMin: 230, nozzleTempMax: 250, bedTempMax: 70, bedTempMin: 70 },
    { id: 'abs', name: 'ABS', color: '#f87171', nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },
    { id: 'tpu', name: 'TPU', color: '#fbbf24', nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
    { id: 'asa', name: 'ASA', color: '#a78bfa', nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 },
    { id: 'nylon', name: 'Nylon', color: '#c084fc', nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 },
    { id: 'pc', name: 'PC', color: '#2dd4bf', nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 120 }
];

// Standard Hersteller für Dropdown
export const DEFAULT_BRANDS = [
    { id: 'prusament', name: 'Prusament', tara: 201, type: 'plastic' },
    { id: 'esun', name: 'eSun', tara: 230, type: 'plastic' },
    { id: 'sunlu', name: 'Sunlu', tara: 140, type: 'plastic' },
    { id: 'overture', name: 'Overture', tara: 237, type: 'plastic' },
    { id: 'hatchbox', name: 'Hatchbox', tara: 235, type: 'plastic' },
    { id: 'polyterra', name: 'PolyTerra', tara: 139, type: 'cardboard' },
    { id: '3djake_eco', name: '3DJake Eco', tara: 209, type: 'cardboard' },
    { id: 'elegoo_card', name: 'Elegoo Pappe', tara: 145, type: 'cardboard' },
    { id: 'generic_plastic', name: 'Standard Kunststoff', tara: 220, type: 'plastic' },
    { id: 'generic_cardboard', name: 'Standard Pappe', tara: 145, type: 'cardboard' }
];

// Spulentypen
export const SPOOL_TYPES = {
    plastic: { name: 'Kunststoff', defaultTara: 220, icon: '🔄' },
    cardboard: { name: 'Pappe', defaultTara: 145, icon: '📦' },
    metal: { name: 'Metall', defaultTara: 280, icon: '⚙️' }
};

// App Einstellungen
export const APP_CONFIG = {
    collectionName: 'Filatest',
    masterDataCollections: {
        materials: 'Materials',
        brands: 'Brands',
        spoolTypes: 'SpoolTypes'
    },
    syncInterval: 30000, // 30 Sekunden
    version: '2.0.0'
};

// Hilfsfunktionen
export function getTaraForBrand(brandId) {
    const brand = TARA_DATABASE[brandId];
    return brand ? brand.tara : TARA_DATABASE['generic_plastic'].tara;
}

export function getMaterialColor(materialId) {
    const material = DEFAULT_MATERIALS.find(m => m.id === materialId.toLowerCase());
    return material ? material.color : '#9ca3af';
}
