/**
 * ============================================================================
 * CETAK-LABEL.JS 
 * File ini menangani semua logika di halaman "Cetak Label".
 * (Kalkulasi expiry, live preview label, dan form cetak)
 * ============================================================================
 */

// ============================================================================
// 1. DEKLARASI VARIABEL (DOM ELEMENTS)
// ============================================================================
const labelForm = document.getElementById('label-form');
const productSelect = document.getElementById('product-select');
const categorySelect = document.getElementById('category-select');
const openDateInput = document.getElementById('open-date');
const shelfLifeInput = document.getElementById('shelf-life');
const calculatedExpiry = document.getElementById('calculated-expiry');
const baristaSelect = document.getElementById('barista-select');
const printQty = document.getElementById('print-qty');
const autoDeleteTags = document.getElementById('auto-delete-tags');

// Variabel DOM untuk Live Preview Label Thermal
const previewLabelBadge = document.getElementById('preview-label-badge');
const previewLabelName = document.getElementById('preview-label-name');
const previewLabelOpen = document.getElementById('preview-label-open');
const previewLabelExpiry = document.getElementById('preview-label-expiry');
const previewLabelNotes = document.getElementById('preview-label-notes');
const previewLabelBox = document.getElementById('preview-label-box');

// ============================================================================
// 2. FUNGSI-FUNGSI UTAMA (HELPERS & LOGIC)
// ============================================================================

// Mengatur nilai default input tanggal/waktu ke saat i
function setDefaultDateTime() {
    if (!openDateInput) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    openDateInput.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// Populate category selections from Master SOP list
function populateCategoryDropdown() {
    if (!categorySelect) return;
    categorySelect.innerHTML = '<option value="" disabled selected>Pilih Kategori...</option>';
    
    // Get unique categories from masterProducts
    const categories = [...new Set(state.masterProducts.map(p => p.category))].sort();
    
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });
}

// Populate product selections filtered by selected Category
function populateProductDropdown() {
    if (!productSelect) return;
    productSelect.innerHTML = '<option value="" disabled selected>Pilih Produk...</option>';
    
    if (!categorySelect || !categorySelect.value) return;
    
    const selectedCategory = categorySelect.value;
    const filtered = state.masterProducts.filter(p => p.category === selectedCategory);
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach(prod => {
        const opt = document.createElement('option');
        opt.value = prod.id;
        opt.textContent = prod.name;
        productSelect.appendChild(opt);
    });
}

// Handle real-time expiry and live preview updates
function updateCalculatedExpiry() {
    if (!openDateInput || !shelfLifeInput || !calculatedExpiry) return;

    const openVal = openDateInput.value;
    const lifeVal = parseInt(shelfLifeInput.value);
    
    const calculation = performCalculation(openVal, lifeVal);
    
    if (calculation.expiryObj) {
        calculatedExpiry.value = calculation.formatted;
        calculatedExpiry.setAttribute('data-expiry-raw', calculation.expiryStr);
        
        // Update Live Preview fields
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productName = selectedOption && selectedOption.value ? selectedOption.text.split(' (')[0] : 'Nama Produk';
        
        previewLabelName.textContent = productName;
        previewLabelOpen.textContent = formatDateIndo(new Date(openVal));
        previewLabelExpiry.textContent = calculation.formatted;
        previewLabelNotes.textContent = `Barista: ${baristaSelect.value || '-'}`;
        
        // Determine preview status badge
        const status = determineProductStatus(calculation.expiryStr);
        previewLabelBadge.className = "absolute -right-12 -top-4 text-white text-[9px] font-extrabold uppercase px-12 py-3 rotate-45 tracking-widest text-center select-none shadow-sm";
        
        if (status.code === 'expired') {
            previewLabelBadge.classList.add('bg-rose-600');
            previewLabelBadge.textContent = 'EXPIRED';
            previewLabelExpiry.className = "text-[9px] font-black text-rose-600 font-mono tracking-tight";
        } else if (status.code === 'warning') {
            previewLabelBadge.classList.add('bg-amber-500');
            previewLabelBadge.textContent = 'WARNING';
            previewLabelExpiry.className = "text-[9px] font-black text-amber-600 font-mono tracking-tight";
        } else {
            previewLabelBadge.classList.add('bg-emerald-500');
            previewLabelBadge.textContent = 'AMAN';
            previewLabelExpiry.className = "text-[9px] font-black text-emerald-600 font-mono tracking-tight";
        }

        // Preview Box size
        const size = state.printSettings.labelSize;
        if (size === 'size-40-30') {
            previewLabelBox.style.width = "180px";
            previewLabelBox.style.minHeight = "135px";
        } else {
            previewLabelBox.style.width = "220px";
            previewLabelBox.style.minHeight = "150px";
        }
    } else {
        calculatedExpiry.value = '-';
        calculatedExpiry.removeAttribute('data-expiry-raw');
        
        previewLabelName.textContent = 'Nama Produk';
        previewLabelOpen.textContent = '-';
        previewLabelExpiry.textContent = '-';
        previewLabelNotes.textContent = 'Barista: -';
        previewLabelBadge.className = "absolute -right-12 -top-4 bg-emerald-500 text-white text-[9px] font-extrabold uppercase px-12 py-3 rotate-45 tracking-widest text-center select-none shadow-sm";
        previewLabelExpiry.className = "text-[9px] font-black text-emerald-600 font-mono tracking-tight";
    }
}

// ============================================================================
// 3. EVENT LISTENERS (REAKSI TERHADAP INPUT USER)
// ============================================================================

// Reaksi ketika Kategori diubah
if (categorySelect) {
    categorySelect.addEventListener('change', () => {
        populateProductDropdown();
        if (shelfLifeInput) shelfLifeInput.value = '';
        updateCalculatedExpiry();
    });
}

// React when product selection changes
if (productSelect) {
    productSelect.addEventListener('change', () => {
        const prodId = productSelect.value;
        const masterProduct = state.masterProducts.find(m => m.id === prodId);
        if (masterProduct) {
            shelfLifeInput.value = masterProduct.days;
            updateCalculatedExpiry();
        }
    });
}

// Attach listeners for preview updating
[openDateInput, shelfLifeInput, baristaSelect].forEach(input => {
    if (input) {
        input.addEventListener('input', updateCalculatedExpiry);
    }
});

// Event ketika tombol "PROSES LABEL & CETAK" ditekan
if (labelForm) {
    labelForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const prodId = productSelect.value;
        const openVal = openDateInput.value;
        const lifeVal = parseInt(shelfLifeInput.value);
        const rawExpiry = calculatedExpiry.getAttribute('data-expiry-raw');
        const notesVal = baristaSelect.value;
        const qtyVal = parseInt(printQty.value) || 1;

        if (!prodId || !openVal || isNaN(lifeVal) || !rawExpiry) {
            showToast('Form Tidak Valid', 'Mohon lengkapi semua input sebelum memproses label.', 'error');
            return;
        }

        const masterProduct = state.masterProducts.find(m => m.id === prodId);
        const nameVal = masterProduct ? masterProduct.name : 'Produk Custom';
        const catVal = masterProduct ? masterProduct.category : 'Umum';

        // Prepare new labeled product data (will be saved only on successful print)
        const newProduct = {
            id: 'prod-' + Date.now(), // Generate ID now
            name: nameVal,
            category: catVal,
            openDate: openVal,
            shelfLife: lifeVal,
            expiryDate: rawExpiry,
            notes: notesVal
        };

        // Trigger open print modal (from shared.js), passing new product data and flags
        openPrintModal(newProduct, qtyVal, true, autoDeleteTags.checked);

        // Reset Form elements (but keep default settings)
        labelForm.reset();
        setDefaultDateTime();
        if (categorySelect) categorySelect.value = '';
        populateProductDropdown();
        if (productSelect) productSelect.value = '';
        if (shelfLifeInput) shelfLifeInput.value = '';
        if (calculatedExpiry) {
            calculatedExpiry.value = '-';
            calculatedExpiry.removeAttribute('data-expiry-raw');
        }
        if (printQty) printQty.value = '1';
        if (baristaSelect) baristaSelect.value = '';
        
        updateCalculatedExpiry();
    });
}

// ============================================================================
// 4. MANAJEMEN BARISTA (FITUR TAMBAH/EDIT/HAPUS BARISTA)
// ============================================================================

const manageBaristaBtn = document.getElementById('manage-barista-btn');
const baristaModal = document.getElementById('barista-modal');
const addBaristaForm = document.getElementById('add-barista-form');
const newBaristaInput = document.getElementById('new-barista-input');
const baristaListContainer = document.getElementById('barista-list-container');

function renderBaristaDropdown() {
    if (!baristaSelect) return;
    // Save current selected value if any
    const currentValue = baristaSelect.value;
    
    baristaSelect.innerHTML = '<option value="" disabled selected>Pilih Barista...</option>';
    
    state.baristas.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        baristaSelect.appendChild(opt);
    });
    
    // Restore selection if it still exists
    if (currentValue && state.baristas.includes(currentValue)) {
        baristaSelect.value = currentValue;
    } else {
        baristaSelect.value = '';
    }
}

function renderBaristaListModal() {
    if (!baristaListContainer) return;
    baristaListContainer.innerHTML = '';

    if (state.baristas.length === 0) {
        baristaListContainer.innerHTML = '<li class="p-4 text-center text-xs text-stone-400">Belum ada data barista.</li>';
        return;
    }

    state.baristas.forEach((name, index) => {
        const li = document.createElement('li');
        li.className = "flex items-center justify-between p-4 hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors";
        
        li.innerHTML = `
            <span class="text-sm font-bold text-stone-700">${name}</span>
            <div class="flex items-center gap-2">
                <button type="button" onclick="editBarista(${index})" class="text-coffee-600 hover:text-coffee-700 bg-coffee-50 hover:bg-coffee-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="Edit">
                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                </button>
                <button type="button" onclick="deleteBarista(${index})" class="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="Hapus">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        baristaListContainer.appendChild(li);
    });
}

// Global functions for inline onclick handlers
window.editBarista = function(index) {
    const oldName = state.baristas[index];
    const newName = prompt('Ubah nama barista:', oldName);
    
    if (newName !== null && newName.trim() !== '') {
        const trimmed = newName.trim();
        if (state.baristas.includes(trimmed) && trimmed !== oldName) {
            showToast('Gagal', 'Nama barista sudah ada di daftar.', 'error');
            return;
        }
        
        state.baristas[index] = trimmed;
        saveBaristas(null, null, oldName, trimmed);
        renderBaristaListModal();
        renderBaristaDropdown();
        showToast('Berhasil', 'Nama barista berhasil diubah.', 'success');
        
        updateCalculatedExpiry();
    }
};

window.deleteBarista = function(index) {
    const name = state.baristas[index];
    const confirmed = confirm(`Apakah Anda yakin ingin menghapus "${name}" dari daftar?`);
    if (confirmed) {
        state.baristas.splice(index, 1);
        saveBaristas(null, name);
        renderBaristaListModal();
        renderBaristaDropdown();
        showToast('Terhapus', `Barista "${name}" berhasil dihapus.`, 'success');
        
        updateCalculatedExpiry();
    }
};

if (manageBaristaBtn) {
    manageBaristaBtn.addEventListener('click', () => {
        renderBaristaListModal();
        if (baristaModal) baristaModal.classList.add('modal-show');
    });
}

document.querySelectorAll('.close-barista-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (baristaModal) baristaModal.classList.remove('modal-show');
    });
});

if (addBaristaForm) {
    addBaristaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = newBaristaInput.value.trim();
        if (!newName) return;
        
        if (state.baristas.includes(newName)) {
            showToast('Gagal', 'Nama barista tersebut sudah ada.', 'error');
            return;
        }
        
        state.baristas.push(newName);
        saveBaristas(newName);
        
        newBaristaInput.value = '';
        renderBaristaListModal();
        renderBaristaDropdown();
        showToast('Ditambahkan', `Barista "${newName}" berhasil ditambahkan.`, 'success');
    });
}

// ============================================================================
// 5. INISIALISASI SAAT HALAMAN DIMUAT (ON LOAD)
// ============================================================================

// Pemicu awal saat web selesai dimuat
window.addEventListener('DOMContentLoaded', () => {
    setDefaultDateTime();
    
    if (typeof initializeSupabaseData === 'function') {
        initializeSupabaseData(() => {
            populateCategoryDropdown();
            populateProductDropdown();
            renderBaristaDropdown();
            updateCalculatedExpiry();
            updatePrinterConnectionDisplay(state.printSettings.printerType);
        });
        
        setupRealtimeSubscriptions((table) => {
            console.log(`AELS Cetak Label: Data '${table}' ter-update. Refreshing UI...`);
            populateCategoryDropdown();
            populateProductDropdown();
            renderBaristaDropdown();
            updateCalculatedExpiry();
            updatePrinterConnectionDisplay(state.printSettings.printerType);
        });
    } else {
        populateCategoryDropdown();
        populateProductDropdown();
        renderBaristaDropdown();
        updateCalculatedExpiry();
    }
});

// Implement target function for reprint/confirm trigger updates
window.refreshLocalUI = function() {
    populateCategoryDropdown();
    populateProductDropdown();
    renderBaristaDropdown();
    updateCalculatedExpiry();
};
