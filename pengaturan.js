/**
 * ============================================================================
 * PENGATURAN.JS
 * File ini menangani logika di halaman "Pengaturan".
 * (Konfigurasi printer thermal, reset database, dan test print)
 * ============================================================================
 */

// ============================================================================
// 1. DEKLARASI VARIABEL (DOM ELEMENTS)
// ============================================================================
const printerSelect = document.getElementById('settings-printer-type');
const printerIpAddress = document.getElementById('settings-printer-ip');
const printerPort = document.getElementById('settings-printer-port');
const printerIpInputGroup = document.getElementById('printer-ip-input-group');
const labelSizeSelect = document.getElementById('settings-label-size');
const testPrintBtn = document.getElementById('test-print-btn');
const totalPrintedEl = document.getElementById('settings-total-printed');
const resetPrintCounterBtn = document.getElementById('reset-print-counter');
const factoryResetDbBtn = document.getElementById('factory-reset-db');

// Supabase DOM Elements
const supabaseStatusDot = document.getElementById('supabase-status-dot');
const supabaseStatusText = document.getElementById('supabase-status-text');

// ============================================================================
// 2. INISIALISASI FORM PENGATURAN PRINTER
// ============================================================================
function initPrinterSettingsForm() {
    if (!printerSelect) return;

    // Load initial values from settings state
    printerSelect.value = state.printSettings.printerType;
    printerIpAddress.value = state.printSettings.printerIpAddress || '';
    if (printerPort) {
        printerPort.value = state.printSettings.printerPort || '9100';
    }
    labelSizeSelect.value = state.printSettings.labelSize;

    if (totalPrintedEl) {
        totalPrintedEl.textContent = state.printSettings.totalPrinted;
    }

    toggleIpInputGroup(state.printSettings.printerType);

    // Watch for selection changes
    printerSelect.addEventListener('change', () => {
        const val = printerSelect.value;
        toggleIpInputGroup(val);
        saveUpdatedPrinterSettings();
    });

    printerIpAddress.addEventListener('input', saveUpdatedPrinterSettings);
    if (printerPort) {
        printerPort.addEventListener('input', saveUpdatedPrinterSettings);
    }
    labelSizeSelect.addEventListener('change', saveUpdatedPrinterSettings);

    // Reset print counter
    if (resetPrintCounterBtn) {
        resetPrintCounterBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus/me-reset total label dicetak menjadi 0?')) {
                state.printSettings.totalPrinted = 0;
                savePrintSettings();
                if (totalPrintedEl) {
                    totalPrintedEl.textContent = '0';
                }
                showToast('Sukses', 'Statistik total label dicetak telah di-reset ke 0.', 'success');
            }
        });
    }

    // Factory reset database
    if (factoryResetDbBtn) {
        factoryResetDbBtn.addEventListener('click', () => {
            const confirmReset = confirm('Apakah Anda yakin ingin menghapus seluruh database? Semua data SOP, riwayat pelabelan, dan pengaturan printer akan dihapus permanen.');
            if (confirmReset) {
                localStorage.clear();
                showToast('Menghapus seluruh database dan memuat ulang...', 'warning');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        });
    }

    // Inisialisasi Status Koneksi Supabase
    if (typeof isSupabaseActive === 'function' && isSupabaseActive()) {
        updateSupabaseStatus(true, 'Terhubung ke Database Cloud (Realtime)');
    } else {
        updateSupabaseStatus(false, 'Menggunakan LocalStorage (Offline / Belum Terhubung)');
    }
}

function updateSupabaseStatus(connected, message) {
    if (!supabaseStatusDot || !supabaseStatusText) return;
    if (connected) {
        supabaseStatusDot.className = 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0';
        supabaseStatusText.textContent = message;
        supabaseStatusText.className = 'text-emerald-600 font-extrabold mt-0.5';
    } else {
        supabaseStatusDot.className = 'w-3 h-3 rounded-full bg-rose-500 shrink-0';
        supabaseStatusText.textContent = message;
        supabaseStatusText.className = 'text-rose-600 font-extrabold mt-0.5';
    }
}

// ============================================================================
// 3. FUNGSI LOGIKA (TOGGLE UI & SIMPAN SETTING)
// ============================================================================
function toggleIpInputGroup(type) {
    if (!printerIpInputGroup) return;
    if (type === 'ip-address') {
        printerIpInputGroup.classList.remove('hidden');
    } else {
        printerIpInputGroup.classList.add('hidden');
    }
}

function saveUpdatedPrinterSettings() {
    state.printSettings.printerType = printerSelect.value;
    state.printSettings.printerIpAddress = printerIpAddress.value.trim();
    if (printerPort) {
        state.printSettings.printerPort = printerPort.value.trim() || '9100';
    }
    state.printSettings.labelSize = labelSizeSelect.value;

    savePrintSettings();
    updatePrinterConnectionDisplay(state.printSettings.printerType);
}

// ============================================================================
// 4. EVENT LISTENERS (TEST PRINT)
// ============================================================================
if (testPrintBtn) {
    testPrintBtn.addEventListener('click', () => {
        const testProduct = {
            id: 'test-print',
            name: 'LABEL TES PRINTER THERMAL',
            category: 'Testing',
            openDate: getOffsetDateString(0),
            shelfLife: 1,
            expiryDate: getOffsetDateString(1),
            notes: 'Sistem'
        };
        openPrintModal(testProduct, 1);
    });
}

// ============================================================================
// 5. INISIALISASI SAAT HALAMAN DIMUAT
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeSupabaseData === 'function') {
        initializeSupabaseData(() => {
            initPrinterSettingsForm();
        });
        
        setupRealtimeSubscriptions((table) => {
            console.log(`AELS Pengaturan: Data '${table}' ter-update. Refreshing UI...`);
            if (table === 'printSettings') {
                if (printerSelect) printerSelect.value = state.printSettings.printerType;
                if (printerIpAddress) printerIpAddress.value = state.printSettings.printerIpAddress || '';
                if (printerPort) printerPort.value = state.printSettings.printerPort || '9100';
                if (labelSizeSelect) labelSizeSelect.value = state.printSettings.labelSize;
                if (totalPrintedEl) totalPrintedEl.textContent = state.printSettings.totalPrinted;
                toggleIpInputGroup(state.printSettings.printerType);
                
                // Perbarui juga status koneksi dan indikator printer global di topbar
                updatePrinterConnectionDisplay(state.printSettings.printerType);
            }
        });
    } else {
        initPrinterSettingsForm();
    }
});

window.refreshLocalUI = function() {
    if (totalPrintedEl) {
        totalPrintedEl.textContent = state.printSettings.totalPrinted;
    }
};