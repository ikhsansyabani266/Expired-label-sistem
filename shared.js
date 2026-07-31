/**
 * ============================================================================
 * SHARED.JS
 * File ini berisi core logic, state management (LocalStorage), utilitas format, 
 * hingga operasi cetak printer thermal yang digunakan oleh seluruh halaman di AELS.
 * ============================================================================
 */

// ============================================================================
// 1. INITIAL STATE / MOCK DATA DEFAULT (SOP & PRODUK)
// ============================================================================
const DEFAULT_MASTER_PRODUCTS = [
    { id: 'prod-mst-1', name: 'Fresh Milk Greenfields', category: 'Fresh Milk', days: 3 },
    { id: 'prod-mst-2', name: 'Anchor Whipping Cream', category: 'Whipping Cream', days: 2 },
    { id: 'prod-mst-3', name: 'Sirup Vanilla (Monin)', category: 'Sirup', days: 180 },
    { id: 'prod-mst-4', name: 'Sirup Caramel (Denali)', category: 'Sirup', days: 180 },
    { id: 'prod-mst-5', name: 'Saus Karamel (Osterberg)', category: 'Saus / Sauce', days: 90 },
    { id: 'prod-mst-6', name: 'Bubuk Coklat (Java)', category: 'Bubuk Minuman', days: 60 },
    { id: 'prod-mst-7', name: 'Biji Kopi Espresso Blend', category: 'Biji Kopi / Beans', days: 14 }
];

const DEFAULT_PRODUCTS = [];

// Helper to calculate date string offsets for seeding mock data
function getOffsetDateString(daysOffset) {
    const d = new Date();
    d.setTime(d.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// ============================================================================
// 2. MANAJEMEN STATE (LOCALSTORAGE)
// ============================================================================
let state = {
    masterProducts: JSON.parse(localStorage.getItem('aels_master_products')) || DEFAULT_MASTER_PRODUCTS,
    products: JSON.parse(localStorage.getItem('aels_products')) || DEFAULT_PRODUCTS,
    printSettings: JSON.parse(localStorage.getItem('aels_print')) || {
        printerType: 'browser',
        printerIpAddress: '',
        labelSize: 'size-50-30',
        totalPrinted: parseInt(localStorage.getItem('aels_total_printed') || '12')
    },
    baristas: JSON.parse(localStorage.getItem('aels_baristas')) || ['Ikhsan', 'Arwah', 'Syabani', 'Barista Shift']
};

// Save helper functions
function saveMasterProducts(itemToUpsert = null, itemToDeleteId = null) {
    localStorage.setItem('aels_master_products', JSON.stringify(state.masterProducts));
    if (typeof dbSaveMasterProduct === 'function') {
        if (itemToUpsert) dbSaveMasterProduct(itemToUpsert);
        if (itemToDeleteId) dbDeleteMasterProduct(itemToDeleteId);
    }
}
function saveProducts(itemToInsert = null, itemToDeleteId = null, itemToUpdate = null) {
    localStorage.setItem('aels_products', JSON.stringify(state.products));
    if (typeof dbAddProduct === 'function') {
        if (itemToInsert) dbAddProduct(itemToInsert);
        if (itemToDeleteId) dbDeleteProduct(itemToDeleteId);
        if (itemToUpdate) dbUpdateProduct(itemToUpdate);
    }
}
function savePrintSettings() {
    localStorage.setItem('aels_print', JSON.stringify(state.printSettings));
    localStorage.setItem('aels_total_printed', state.printSettings.totalPrinted);
    if (typeof dbSavePrintSettings === 'function') {
        dbSavePrintSettings();
    }
}
function saveBaristas(addedName = null, deletedName = null, oldName = null, newName = null) {
    localStorage.setItem('aels_baristas', JSON.stringify(state.baristas));
    if (typeof dbAddBarista === 'function') {
        if (addedName) dbAddBarista(addedName);
        if (deletedName) dbDeleteBarista(deletedName);
        if (oldName && newName) dbUpdateBarista(oldName, newName);
    }
}

// ============================================================================
// 3. DEKLARASI VARIABEL (DOM ELEMENTS BERSAMA)
// ============================================================================
const currentDatetimeSpan = document.getElementById('current-datetime');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenuClose = document.getElementById('mobile-menu-close');
const mobileNavMenu = document.getElementById('mobile-nav-menu');

const printerStatusIndicator = document.getElementById('printer-status-indicator');
const printerStatusText = document.getElementById('printer-status-text');
const printerStatusBtn = document.getElementById('printer-status-btn');
const printerStatusDropdown = document.getElementById('printer-status-dropdown');
const printerStatusChevron = document.getElementById('printer-status-chevron');
const navPrinterNetworkBtn = document.getElementById('nav-printer-network-btn');
const navPrinterGeneralBtn = document.getElementById('nav-printer-general-btn');

// Print Modal DOMs
const printModal = document.getElementById('print-modal');
const confirmPrintBtn = document.getElementById('confirm-print-btn');
const printLoadingMsg = document.getElementById('print-loading-msg');
const modalLabelName = document.getElementById('modal-label-name');
const modalLabelOpen = document.getElementById('modal-label-open');
const modalLabelExpiry = document.getElementById('modal-label-expiry');
const modalLabelNotes = document.getElementById('modal-label-notes');
const modalLabelBadge = document.getElementById('modal-label-badge');
const modalLabelBox = document.getElementById('modal-label-box');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Current Label Details Cache for printing
let currentLabelData = null;
let printCopies = 1;
let isNewProductPending = false;
let shouldAutoDeletePending = false;

// ============================================================================
// 4. FUNGSI UTILITAS (WAKTU, KALKULASI & FORMAT)
// ============================================================================
function updateLiveClock() {
    if (!currentDatetimeSpan) return;
    const now = new Date();
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayName = daysIndo[now.getDay()];
    const date = now.getDate();
    const monthName = monthsIndo[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    currentDatetimeSpan.innerHTML = `${dayName}, ${date} ${monthName} ${year} — <span class="font-mono text-coffee-700">${hours}:${minutes}:${seconds}</span> WIB`;
}

// Set standard Indonesian Date formatter for label strings
function formatDateIndo(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '-';
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

// Perform central expiry calculation logic
function performCalculation(openDateTimeStr, shelfLifeDays) {
    if (!openDateTimeStr || isNaN(shelfLifeDays)) {
        return { expiryObj: null, expiryStr: '', formatted: '-' };
    }

    const openDate = new Date(openDateTimeStr);
    if (isNaN(openDate.getTime())) {
        return { expiryObj: null, expiryStr: '', formatted: '-' };
    }

    const expiryDate = new Date(openDate.getTime() + (shelfLifeDays * 24 * 60 * 60 * 1000));
    
    const yyyy = expiryDate.getFullYear();
    const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const dd = String(expiryDate.getDate()).padStart(2, '0');
    const hh = String(expiryDate.getHours()).padStart(2, '0');
    const min = String(expiryDate.getMinutes()).padStart(2, '0');
    
    return {
        expiryObj: expiryDate,
        expiryStr: `${yyyy}-${mm}-${dd}T${hh}:${min}`,
        formatted: formatDateIndo(expiryDate)
    };
}

// Evaluate status: Active (safe), Warning (expires in <= 24 hours), or Expired
function determineProductStatus(expiryDateTimeStr) {
    if (!expiryDateTimeStr) return { code: 'expired', label: 'EXPIRED', color: 'expired' };
    
    const expiryDate = new Date(expiryDateTimeStr);
    const now = new Date();

    if (now >= expiryDate) {
        return { code: 'expired', label: 'EXPIRED', color: 'expired' };
    }

    const diffMs = expiryDate.getTime() - now.getTime();
    if (diffMs <= 24 * 60 * 60 * 1000) {
        return { code: 'warning', label: 'DEKAT EXP', color: 'warning' };
    }

    return { code: 'active', label: 'AMAN', color: 'active' };
}

// ============================================================================
// 5. FUNGSI UI (MENU MOBILE & PRINTER STATUS)
// ============================================================================
function setupMobileMenu() {
    if (mobileMenuBtn && mobileNavMenu && mobileMenuClose) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavMenu.classList.remove('hidden');
        });

        mobileMenuClose.addEventListener('click', () => {
            mobileNavMenu.classList.add('hidden');
        });
    }
}

// Adjust status indicator dots based on printer selection
function updatePrinterConnectionDisplay(type) {
    const settingsPrinterStatusText = document.getElementById('settings-printer-status-text');
    const settingsPrinterDot = document.getElementById('settings-printer-dot');

    let statusLabel = 'Ready (Connected)';
    let statusClass = "text-md font-bold text-emerald-600 mt-0.5";
    let indicatorClass = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse";
    let dotClass = "w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse border-2 border-white shadow-md";

    if (type === 'simulated-error') {
        statusLabel = 'Offline / Error';
        statusClass = "text-md font-bold text-rose-600 mt-0.5";
        indicatorClass = "w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping";
        dotClass = "w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping border-2 border-white shadow-md";
    } else if (type === 'ip-address') {
        const ipText = state.printSettings.printerIpAddress || 'IP Kosong';
        statusLabel = `IP Printer: ${ipText}`;
        statusClass = "text-md font-bold text-blue-600 mt-0.5";
        indicatorClass = "w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse";
        dotClass = "w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse border-2 border-white shadow-md";
    }

    if (printerStatusText) printerStatusText.textContent = type === 'simulated-error' ? 'Offline / Error' : (type === 'ip-address' ? `IP: ${state.printSettings.printerIpAddress || 'IP Kosong'}` : 'Ready (Browser)');
    if (printerStatusIndicator) printerStatusIndicator.className = indicatorClass;

    if (settingsPrinterStatusText) {
        settingsPrinterStatusText.textContent = statusLabel;
        settingsPrinterStatusText.className = statusClass;
    }
    if (settingsPrinterDot) settingsPrinterDot.className = dotClass;

    // Update top-bar dropdown status indicators
    const ddNetworkDot = document.getElementById('dd-network-dot');
    const ddNetworkText = document.getElementById('dd-network-text');
    const ddGeneralDot = document.getElementById('dd-general-dot');
    const ddGeneralText = document.getElementById('dd-general-text');

    if (ddNetworkDot && ddNetworkText && ddGeneralDot && ddGeneralText) {
        [ddNetworkDot, ddGeneralDot].forEach(dot => dot.classList.remove('bg-emerald-500', 'bg-rose-500'));
        ddNetworkText.textContent = 'Not Connected';
        ddGeneralText.textContent = 'Not Connected';

        if (type === 'ip-address') {
            ddNetworkDot.classList.add('bg-emerald-500');
            ddNetworkText.textContent = 'Connected';
        }
        if (type !== 'simulated-error') {
            ddGeneralDot.classList.add('bg-emerald-500');
            ddGeneralText.textContent = 'Connected';
        } else {
            ddGeneralDot.classList.add('bg-rose-500');
            ddGeneralText.textContent = 'Not Connected';
        }
    }

    const topbarDot = document.getElementById('topbar-printer-dot');
    if (topbarDot) {
        topbarDot.classList.remove('bg-emerald-500', 'bg-rose-500', 'bg-blue-500');
        if (type === 'simulated-error') topbarDot.classList.add('bg-rose-500');
        else if (type === 'ip-address') topbarDot.classList.add('bg-blue-500');
        else topbarDot.classList.add('bg-emerald-500');
    }
}

// Initialize top-bar printer dropdown
function initPrinterStatusDropdown() {
    if (!printerStatusBtn || !printerStatusDropdown) return;

    printerStatusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !printerStatusDropdown.classList.contains('hidden');
        if (isOpen) {
            printerStatusDropdown.classList.add('hidden');
            printerStatusDropdown.classList.remove('block');
            printerStatusDropdown.classList.remove('opacity-100', 'scale-100');
            printerStatusDropdown.classList.add('opacity-0', 'scale-95');
            printerStatusChevron.classList.remove('rotate-180');
        } else {
            printerStatusDropdown.classList.remove('hidden');
            printerStatusDropdown.classList.add('block');
            setTimeout(() => {
                printerStatusDropdown.classList.remove('opacity-0', 'scale-95');
                printerStatusDropdown.classList.add('opacity-100', 'scale-100');
            }, 10);
            printerStatusChevron.classList.add('rotate-180');
        }
    });

    document.addEventListener('click', (e) => {
        if (!printerStatusDropdown.contains(e.target) && !printerStatusBtn.contains(e.target)) {
            printerStatusDropdown.classList.add('hidden');
            printerStatusDropdown.classList.remove('block');
            printerStatusDropdown.classList.remove('opacity-100', 'scale-100');
            printerStatusDropdown.classList.add('opacity-0', 'scale-95');
            printerStatusChevron.classList.remove('rotate-180');
        }
    });

    if (navPrinterNetworkBtn) {
        navPrinterNetworkBtn.addEventListener('click', () => {
            navigateToPrinterSetting('network');
        });
    }

    if (navPrinterGeneralBtn) {
        navPrinterGeneralBtn.addEventListener('click', () => {
            navigateToPrinterSetting('general');
        });
    }
}

// Navigate to specific printer setting sections
window.navigateToPrinterSetting = function(section) {
    if (printerStatusDropdown) {
        printerStatusDropdown.classList.add('hidden');
        printerStatusDropdown.classList.remove('block');
        printerStatusChevron.classList.remove('rotate-180');
    }

    // If on a different page, redirect to pengaturan.html with search param
    if (!window.location.pathname.includes('pengaturan.html')) {
        window.location.href = `pengaturan.html?focus=${section}`;
        return;
    }

    focusPrinterSetting(section);
};

// Internal function to highlight setting elements on pengaturan.html
function focusPrinterSetting(section) {
    let targetId = '';
    if (section === 'network') targetId = 'printer-ip-input-group';
    else if (section === 'general') targetId = 'settings-printer-status-text';

    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-emerald-100');
            setTimeout(() => el.classList.remove('bg-emerald-100'), 1505);
        }
    }
}

// Check for redirect focal setting on load of pengaturan.html
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const focusSection = params.get('focus');
    if (focusSection && window.location.pathname.includes('pengaturan.html')) {
        setTimeout(() => {
            focusPrinterSetting(focusSection);
        }, 300);
    }
});

// --- CUSTOM TOAST NOTIFICATIONS SYSTEM ---
function showToast(title, message, type = 'info') {
    if (!toastContainer) return;
    const toastId = 'toast-' + Date.now();
    
    let iconClass = 'fa-solid fa-circle-info text-blue-500';
    let borderClass = 'border-l-4 border-l-blue-500';
    if (type === 'success') {
        iconClass = 'fa-solid fa-circle-check text-emerald-500';
        borderClass = 'border-l-4 border-l-emerald-500';
    } else if (type === 'error') {
        iconClass = 'fa-solid fa-circle-exclamation text-rose-500';
        borderClass = 'border-l-4 border-l-rose-500';
    }

    const toastHTML = `
        <div id="${toastId}" class="toast bg-white border border-stone-200/80 p-4 rounded-xl shadow-lg flex gap-3 ${borderClass} transition-all duration-300 pointer-events-auto">
            <div class="text-lg mt-0.5">
                <i class="${iconClass}"></i>
            </div>
            <div class="flex-grow">
                <h5 class="font-extrabold text-stone-850 text-xs uppercase tracking-wider">${title}</h5>
                <p class="text-xs text-stone-500 mt-0.5 leading-snug font-medium">${message}</p>
            </div>
            <button onclick="closeToast('${toastId}')" class="text-stone-400 hover:text-stone-600 self-start">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>
    `;

    toastContainer.insertAdjacentHTML('afterbegin', toastHTML);

    setTimeout(() => {
        closeToast(toastId);
    }, 4500);
}

window.closeToast = function(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('toast-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
};

// --- PRINT OPERATIONS & HANDLERS ---
function handlePrintSuccess() {
    if (isNewProductPending && currentLabelData && currentLabelData.id !== 'test-print') {
        // Run auto-delete if requested
        if (shouldAutoDeletePending) {
            const countBefore = state.products.length;
            state.products = state.products.filter(p => p.name.toLowerCase() !== currentLabelData.name.toLowerCase());
            const countAfter = state.products.length;
            if (countBefore > countAfter) {
                showToast('Auto-Delete Aktif', `Menghapus ${countBefore - countAfter} label lama untuk "${currentLabelData.name}".`, 'info');
            }
        }
        // Save the new product to history
        state.products.unshift(currentLabelData);
        saveProducts(currentLabelData);
        
        // Reset flags
        isNewProductPending = false;
        shouldAutoDeletePending = false;
    }

    state.printSettings.totalPrinted += printCopies;
    savePrintSettings();
    
    // Refresh local UI if relevant
    if (typeof refreshLocalUI === 'function') refreshLocalUI();
    updatePrinterConnectionDisplay(state.printSettings.printerType);
}

window.openPrintModal = function(productData, quantity = 1, isNew = false, autoDelete = false) {
    if (!printModal) return;
    currentLabelData = productData;
    printCopies = quantity;
    isNewProductPending = isNew;
    shouldAutoDeletePending = autoDelete;

    modalLabelName.textContent = productData.name;
    modalLabelNotes.textContent = productData.notes ? `Barista: ${productData.notes}` : 'Barista: -';
    
    const openObj = new Date(productData.openDate);
    const expiryObj = new Date(productData.expiryDate);

    modalLabelOpen.textContent = formatDateIndo(openObj);
    modalLabelExpiry.textContent = formatDateIndo(expiryObj);

    const status = determineProductStatus(productData.expiryDate);
    
    modalLabelBadge.className = "absolute -right-12 -top-4 text-white text-[9px] font-extrabold uppercase px-12 py-3 rotate-45 tracking-widest text-center select-none shadow-sm";
    if (status.code === 'expired') {
        modalLabelBadge.classList.add('bg-rose-600');
        modalLabelBadge.textContent = 'EXPIRED';
        modalLabelExpiry.className = "text-[9px] font-black text-rose-600 font-mono tracking-tight";
    } else if (status.code === 'warning') {
        modalLabelBadge.classList.add('bg-amber-500');
        modalLabelBadge.textContent = 'WARNING';
        modalLabelExpiry.className = "text-[9px] font-black text-amber-600 font-mono tracking-tight";
    } else {
        modalLabelBadge.classList.add('bg-emerald-500');
        modalLabelBadge.textContent = 'AMAN';
        modalLabelExpiry.className = "text-[9px] font-black text-emerald-600 font-mono tracking-tight";
    }

    const size = state.printSettings.labelSize;
    if (size === 'size-40-30') {
        modalLabelBox.style.width = "180px";
        modalLabelBox.style.minHeight = "135px";
    } else {
        modalLabelBox.style.width = "220px";
        modalLabelBox.style.minHeight = "150px";
    }

    printLoadingMsg.classList.add('hidden');
    confirmPrintBtn.disabled = false;
    printModal.classList.add('modal-show');
};

// Shared Event triggers for Print Confirming
if (confirmPrintBtn) {
    confirmPrintBtn.addEventListener('click', () => {
        if (!currentLabelData) return;

        const printerType = state.printSettings.printerType;
        confirmPrintBtn.disabled = true;

        if (printerType === 'simulated-error') {
            printLoadingMsg.classList.remove('hidden');
            setTimeout(() => {
                printLoadingMsg.classList.add('hidden');
                printModal.classList.remove('modal-show');
                confirmPrintBtn.disabled = false;
                showToast('Error Cetak', 'Gagal mencetak: Printer Thermal tidak terdeteksi atau offline!', 'error');
            }, 1500);

        } else if (printerType === 'simulated-success') {
            printLoadingMsg.classList.remove('hidden');
            
            setTimeout(() => {
                printLoadingMsg.classList.add('hidden');
                printModal.classList.remove('modal-show');
                confirmPrintBtn.disabled = false;

                handlePrintSuccess();

                showToast('Cetak Berhasil', `Label untuk "${currentLabelData.name}" berhasil dicetak ke Printer Thermal (${printCopies} kopi).`, 'success');
            }, 1200);

        } else if (printerType === 'ip-address') {
            const ip = state.printSettings.printerIpAddress;
            if (!ip) {
                confirmPrintBtn.disabled = false;
                showToast('Error', 'Alamat IP printer belum diisi!', 'error');
                return;
            }

            printLoadingMsg.classList.remove('hidden');

            const printDataPayload = {
                type: "expired_label",
                printer_ip: ip,
                data: {
                    name: currentLabelData.name,
                    openDate: formatDateIndo(new Date(currentLabelData.openDate)),
                    expiryDate: formatDateIndo(new Date(currentLabelData.expiryDate)),
                    status: determineProductStatus(currentLabelData.expiryDate).label,
                    notes: currentLabelData.notes || '-'
                }
            };

            fetch(`http://${ip}/print`, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(printDataPayload)
            })
            .then(() => {
                setTimeout(() => {
                    printLoadingMsg.classList.add('hidden');
                    printModal.classList.remove('modal-show');
                    confirmPrintBtn.disabled = false;

                    handlePrintSuccess();

                    showToast('Cetak Berhasil', `Data terkirim ke printer dengan IP: ${ip} (${printCopies} kopi).`, 'success');
                }, 800);
            })
            .catch(err => {
                printLoadingMsg.classList.add('hidden');
                confirmPrintBtn.disabled = false;
                showToast('Error Koneksi', `Gagal terhubung ke printer ${ip}. Pastikan printer menyala & IP benar.`, 'error');
            });

        } else {
            // Browser window.print() driver
            const printSection = document.getElementById('print-section');
            if (printSection) {
                printSection.innerHTML = '';
                const status = determineProductStatus(currentLabelData.expiryDate);
                let badgeColorClass = "bg-emerald-500";
                if (status.code === 'expired') badgeColorClass = "bg-rose-600";
                if (status.code === 'warning') badgeColorClass = "bg-amber-500";

                const labelHTML = `
                    <div class="print-label relative">
                        <div class="watermark absolute -right-8 -top-3 text-white ${badgeColorClass} select-none" style="width: 80px; padding: 1px 0; transform: rotate(45deg); font-size: 5px;">
                            ${status.label}
                        </div>
                        <div class="brand">
                            <div class="brand-logo">
                                <span style="font-size: 8px;">AUTO EXPIRED LABEL SISTEM</span>
                                <span style="font-size: 4px; letter-spacing: 0.15em;">COFFEE SHOP</span>
                            </div>
                            <div class="brand-label">
                                <span>EXPIRED LABEL</span>
                            </div>
                        </div>
                        <div class="product-name">
                            ${currentLabelData.name}
                        </div>
                        <div class="dates">
                            <div>
                                <span>Tgl Buka</span>
                                <p>${formatDateIndo(new Date(currentLabelData.openDate))}</p>
                            </div>
                            <div>
                                <span>Kedaluwarsa</span>
                                <p class="${status.code === 'expired' ? 'expiry-date' : ''}">${formatDateIndo(new Date(currentLabelData.expiryDate))}</p>
                            </div>
                        </div>
                        <div class="footer">
                            <span>Barista: ${currentLabelData.notes || '-'}</span>
                            <span>*AELS*</span>
                        </div>
                    </div>
                `;

                for (let i = 0; i < printCopies; i++) {
                    printSection.insertAdjacentHTML('beforeend', labelHTML);
                }

                document.body.className = `print-size-${state.printSettings.labelSize}`;

                const existingPageStyle = document.getElementById('dynamic-page-style');
                if (existingPageStyle) {
                    existingPageStyle.remove();
                }

                let pageSizeRule = '';
                if (state.printSettings.labelSize === 'size-40-30') {
                    pageSizeRule = '@page { size: 40mm 30mm; margin: 0; }';
                } else if (state.printSettings.labelSize === 'size-80-receipt' || state.printSettings.labelSize === 'size-80-30') {
                    pageSizeRule = '@page { size: 80mm 30mm; margin: 0; }';
                } else {
                    pageSizeRule = '@page { size: 50mm 30mm; margin: 0; }';
                }

                const dynamicPageStyle = document.createElement('style');
                dynamicPageStyle.id = 'dynamic-page-style';
                dynamicPageStyle.appendChild(document.createTextNode(pageSizeRule));
                document.head.appendChild(dynamicPageStyle);

                handlePrintSuccess();

                printModal.classList.remove('modal-show');
                confirmPrintBtn.disabled = false;

                setTimeout(() => {
                    window.print();
                }, 150);
            }
        }
    });
}

// Close buttons binding
document.querySelectorAll('.close-print-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (printModal) printModal.classList.remove('modal-show');
    });
});