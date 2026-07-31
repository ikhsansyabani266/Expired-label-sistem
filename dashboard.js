/**
 * ============================================================================
 * DASHBOARD.JS
 * File ini menangani semua logika di halaman "Dashboard".
 * (Kalkulasi statistik dan list alert produk hampir/sudah kedaluwarsa)
 * ============================================================================
 */

// ============================================================================
// 1. DEKLARASI VARIABEL (DOM ELEMENTS)
// ============================================================================
const statActiveCount = document.getElementById('stat-active-count');
const statWarningCount = document.getElementById('stat-warning-count');
const statExpiredCount = document.getElementById('stat-expired-count');
const statPrintedCount = document.getElementById('stat-printed-count');
const dashboardAlertsList = document.getElementById('dashboard-alerts-list');
const alertBadgeWarning = document.getElementById('alert-badge-warning');
const alertBadgeExpired = document.getElementById('alert-badge-expired');

// ============================================================================
// 2. FUNGSI UTAMA (REFRESH DATA DASHBOARD)
// ============================================================================
function refreshDashboard() {
    if (!statActiveCount) return; // Guard

    let active = 0;
    let warning = 0;
    let expired = 0;

    state.products.forEach(prod => {
        const status = determineProductStatus(prod.expiryDate);
        if (status.code === 'expired') {
            expired++;
        } else if (status.code === 'warning') {
            warning++;
        } else {
            active++;
        }
    });

    statActiveCount.textContent = active;
    statWarningCount.textContent = warning;
    statExpiredCount.textContent = expired;
    statPrintedCount.textContent = state.printSettings.totalPrinted;

    // Split products into warning and expired lists
    const warningProducts = state.products
        .filter(prod => determineProductStatus(prod.expiryDate).code === 'warning')
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const expiredProducts = state.products
        .filter(prod => determineProductStatus(prod.expiryDate).code === 'expired')
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    // Update badge counts
    if (alertBadgeWarning) {
        alertBadgeWarning.textContent = `${warningProducts.length} Hampir Expired`;
        alertBadgeWarning.className = warningProducts.length > 0
            ? "bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider animate-pulse"
            : "bg-stone-100 text-stone-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider";
    }
    if (alertBadgeExpired) {
        alertBadgeExpired.textContent = `${expiredProducts.length} Sudah Expired`;
        alertBadgeExpired.className = expiredProducts.length > 0
            ? "bg-rose-100 text-rose-600 text-xs px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider animate-pulse"
            : "bg-stone-100 text-stone-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider";
    }

    // Render alerts list
    dashboardAlertsList.innerHTML = '';

    if (warningProducts.length === 0 && expiredProducts.length === 0) {
        dashboardAlertsList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-stone-400">
                <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-2xl mb-3 shadow-inner">
                    <i class="fa-regular fa-face-smile"></i>
                </div>
                <p class="text-sm font-semibold">Semua aman!</p>
                <p class="text-xs text-stone-400 mt-1">Tidak ada produk yang kedaluwarsa atau perlu perhatian.</p>
            </div>
        `;
    } else {
        // Helper to build a single alert card HTML
        function buildAlertCard(prod, statusCode) {
            const expDateObj = new Date(prod.expiryDate);
            const now = new Date();
            const timeDiff = expDateObj.getTime() - now.getTime();
            let countdownText = "";

            if (timeDiff < 0) {
                const hoursAgo = Math.abs(Math.floor(timeDiff / (1000 * 60 * 60)));
                if (hoursAgo < 24) {
                    countdownText = `Sudah Kedaluwarsa ${hoursAgo} jam lalu! Hapus & Buang!`;
                } else {
                    const daysAgo = Math.floor(hoursAgo / 24);
                    countdownText = `Sudah Kedaluwarsa ${daysAgo} hari lalu! Hapus & Buang!`;
                }
            } else {
                const minutesLeft = Math.floor(timeDiff / (1000 * 60));
                if (minutesLeft < 60) {
                    countdownText = `Segera kedaluwarsa dalam ${minutesLeft} menit!`;
                } else {
                    const hoursLeft = Math.floor(minutesLeft / 60);
                    countdownText = `Segera kedaluwarsa dalam ${hoursLeft} jam!`;
                }
            }

            const cardClass = statusCode === 'expired'
                ? "border-l-4 border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/60"
                : "border-l-4 border-l-amber-500 bg-amber-50/30 hover:bg-amber-50/60";
            const iconHTML = statusCode === 'expired'
                ? `<div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-md flex-shrink-0"><i class="fa-solid fa-skull-crossbones"></i></div>`
                : `<div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-md flex-shrink-0 animate-pulse"><i class="fa-solid fa-triangle-exclamation"></i></div>`;
            const countdownColor = statusCode === 'expired' ? 'text-rose-700' : 'text-amber-700';

            return `
                <div class="p-4 rounded-xl border border-stone-200/50 flex items-center justify-between gap-3 mb-2.5 ${cardClass} transition-all duration-200">
                    <div class="flex items-center gap-3 min-w-0">
                        ${iconHTML}
                        <div class="min-w-0">
                            <span class="font-extrabold text-stone-900 block text-sm tracking-wide leading-snug truncate">${prod.name}</span>
                            <span class="text-[11px] font-bold ${countdownColor} block mt-0.5">${countdownText}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <span class="font-mono text-xs text-stone-500 font-bold bg-white/80 border border-stone-200/40 px-2 py-1 rounded hidden sm:inline">
                            EXP: ${formatDateIndo(expDateObj)}
                        </span>
                        <div class="flex gap-1">
                            <button onclick="reprintLabel('${prod.id}')" class="bg-white hover:bg-stone-100 text-stone-700 w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center transition-all shadow-sm" title="Print label">
                                <i class="fa-solid fa-print text-xs"></i>
                            </button>
                            <button onclick="deleteProduct('${prod.id}')" class="bg-rose-500 hover:bg-rose-600 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm" title="Hapus & buang">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // --- Section: Hampir Kedaluwarsa ---
        const warningSectionHTML = `
            <div class="mb-5">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h4 class="font-extrabold text-amber-700 text-sm uppercase tracking-wider">Hampir Kedaluwarsa</h4>
                    <span class="ml-auto bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">${warningProducts.length} produk</span>
                </div>
                ${warningProducts.length === 0
                    ? `<p class="text-xs text-stone-400 font-medium pl-1 py-2">Tidak ada produk yang hampir kedaluwarsa.</p>`
                    : warningProducts.map(p => buildAlertCard(p, 'warning')).join('')
                }
            </div>
        `;

        // --- Section: Sudah Kedaluwarsa ---
        const expiredSectionHTML = `
            <div>
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-skull-crossbones"></i>
                    </div>
                    <h4 class="font-extrabold text-rose-700 text-sm uppercase tracking-wider">Sudah Kedaluwarsa</h4>
                    <span class="ml-auto bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">${expiredProducts.length} produk</span>
                </div>
                ${expiredProducts.length === 0
                    ? `<p class="text-xs text-stone-400 font-medium pl-1 py-2">Tidak ada produk yang sudah kedaluwarsa.</p>`
                    : expiredProducts.map(p => buildAlertCard(p, 'expired')).join('')
                }
            </div>
        `;

        dashboardAlertsList.insertAdjacentHTML('beforeend', `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                ${warningSectionHTML}
                <div class="lg:border-l lg:border-stone-100 lg:pl-5">
                    ${expiredSectionHTML}
                </div>
            </div>
        `);
    }
}

// ============================================================================
// 3. FUNGSI GLOBAL (AKSI DARI LIST ALERT)
// ============================================================================
window.reprintLabel = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    openPrintModal(product);
};

window.deleteProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus data pelabelan produk "${product.name}"?`);
    if (confirmDelete) {
        state.products = state.products.filter(p => p.id !== productId);
        saveProducts(null, productId);
        refreshDashboard();
        showToast('Success', 'Data produk berhasil dihapus', 'success');
    }
};

// ============================================================================
// 4. INISIALISASI SAAT HALAMAN DIMUAT
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeSupabaseData === 'function') {
        initializeSupabaseData(() => {
            refreshDashboard();
            updatePrinterConnectionDisplay(state.printSettings.printerType);
        });
        setupRealtimeSubscriptions((table) => {
            console.log(`AELS Dashboard: Data '${table}' ter-update. Refreshing UI...`);
            refreshDashboard();
            updatePrinterConnectionDisplay(state.printSettings.printerType);
        });
    } else {
        refreshDashboard();
    }

    // Reset Dashboard Total Printed Button Event
    const resetDashboardPrintedBtn = document.getElementById('reset-dashboard-printed');
    if (resetDashboardPrintedBtn) {
        resetDashboardPrintedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Apakah Anda yakin ingin menghapus/me-reset total label dicetak menjadi 0?')) {
                state.printSettings.totalPrinted = 0;
                savePrintSettings();
                if (statPrintedCount) {
                    statPrintedCount.textContent = 0;
                }
                showToast('Sukses', 'Statistik total label dicetak telah di-reset ke 0.', 'success');
            }
        });
    }
});

window.refreshLocalUI = refreshDashboard;