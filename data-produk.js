/**
 * ============================================================================
 * DATA-PRODUK.JS
 * File ini menangani logika di halaman "Data Produk".
 * (Filter pencarian, tabel history label, hapus/edit/reprint label)
 * ============================================================================
 */

// ============================================================================
// 1. DEKLARASI VARIABEL (DOM ELEMENTS)
// ============================================================================
const productTableBody = document.getElementById('product-table-body');
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterStatus = document.getElementById('filter-status');
const resetFiltersBtn = document.getElementById('reset-filters');
const tableResultsInfo = document.getElementById('table-results-info');

// Edit Modal DOMs
const editModal = document.getElementById('edit-modal');
const editProductForm = document.getElementById('edit-product-form');
const editProductId = document.getElementById('edit-product-id');
const editProductName = document.getElementById('edit-product-name');
const editProductCategory = document.getElementById('edit-product-category');
const editOpenDate = document.getElementById('edit-open-date');
const editShelfLife = document.getElementById('edit-shelf-life');
const editCalculatedExpiryLabel = document.getElementById('edit-calculated-expiry-label');
const editNotes = document.getElementById('edit-notes');

// ============================================================================
// 2. FUNGSI UTAMA (RENDER TABEL & DROPDOWN)
// ============================================================================
function populateFilterCategories() {
    if (!filterCategory) return;
    
    // Extract unique categories from master list
    const categories = [...new Set(state.masterProducts.map(p => p.category))].sort();
    
    // Keep 'all' option
    filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filterCategory.appendChild(opt);
    });
}

// Populate product category inside Edit modal dropdown
function populateEditCategoryDropdown() {
    if (!editProductCategory) return;
    editProductCategory.innerHTML = '';
    
    const categories = [...new Set(state.masterProducts.map(p => p.category))].sort();
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        editProductCategory.appendChild(opt);
    });
}

// Main Table Renderer
function refreshProductTable() {
    if (!productTableBody) return;

    const query = searchInput.value.toLowerCase().trim();
    const catFilter = filterCategory.value;
    const statusFilter = filterStatus.value;

    let filtered = state.products.filter(prod => {
        // 1. Search Query Match
        const matchQuery = prod.name.toLowerCase().includes(query) || 
                           (prod.category && prod.category.toLowerCase().includes(query)) ||
                           (prod.notes && prod.notes.toLowerCase().includes(query));
        
        // 2. Category Match
        const matchCat = catFilter === 'all' || prod.category === catFilter;
        
        // 3. Status Match
        const status = determineProductStatus(prod.expiryDate);
        const matchStatus = statusFilter === 'all' || status.code === statusFilter;

        return matchQuery && matchCat && matchStatus;
    });

    // Update Counter text
    tableResultsInfo.textContent = `Menampilkan ${filtered.length} produk`;

    productTableBody.innerHTML = '';

    if (filtered.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-12 text-center text-stone-400">
                    <i class="fa-solid fa-box-open text-4xl mb-3 text-stone-300"></i>
                    <p class="text-sm font-medium">Tidak ada data produk ditemukan.</p>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(prod => {
        const status = determineProductStatus(prod.expiryDate);
        
        let badgeHTML = "";
        let rowClass = "";
        if (status.code === 'expired') {
            rowClass = "bg-rose-50/10 hover:bg-rose-50/30";
            badgeHTML = `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 shadow-sm animate-pulse">
                    <i class="w-1.5 h-1.5 rounded-full bg-rose-600"></i> Expired
                </span>
            `;
        } else if (status.code === 'warning') {
            rowClass = "bg-amber-50/10 hover:bg-amber-50/30";
            badgeHTML = `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 shadow-sm animate-pulse">
                    <i class="w-1.5 h-1.5 rounded-full bg-amber-600"></i> Near Expiry
                </span>
            `;
        } else {
            rowClass = "hover:bg-stone-50/60";
            badgeHTML = `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 shadow-sm">
                    <i class="w-1.5 h-1.5 rounded-full bg-emerald-500"></i> Active
                </span>
            `;
        }

        const openObj = new Date(prod.openDate);
        const expiryObj = new Date(prod.expiryDate);

        const trHTML = `
            <tr class="transition-colors border-b border-stone-100 ${rowClass}">
                <td class="py-4 px-5">
                    <div class="font-extrabold text-stone-850 tracking-wide text-sm">${prod.name}</div>
                    <div class="text-[10px] text-stone-400 mt-0.5 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <i class="fa-solid fa-user text-[8px]"></i> Barista: ${prod.notes || '-'}
                    </div>
                </td>
                <td class="py-4 px-5 text-stone-500 text-xs font-bold uppercase tracking-wider">${prod.category || 'Umum'}</td>
                <td class="py-4 px-5 text-stone-600 font-mono text-xs">${formatDateIndo(openObj)}</td>
                <td class="py-4 px-5">
                    <span class="bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">${prod.shelfLife} Hari</span>
                </td>
                <td class="py-4 px-5 font-mono text-xs font-bold ${status.code === 'expired' ? 'text-rose-600' : 'text-stone-700'}">
                    ${formatDateIndo(expiryObj)}
                </td>
                <td class="py-4 px-5 text-center">${badgeHTML}</td>
                <td class="py-4 px-5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="reprintLabeledProduct('${prod.id}')" class="bg-white hover:bg-stone-100 text-stone-700 w-8.5 h-8.5 rounded-xl border border-stone-200 flex items-center justify-center transition-all shadow-sm" title="Reprint label">
                            <i class="fa-solid fa-print text-xs"></i>
                        </button>
                        <button onclick="editLabeledProduct('${prod.id}')" class="bg-white hover:bg-stone-100 text-coffee-600 w-8.5 h-8.5 rounded-xl border border-stone-200 flex items-center justify-center transition-all shadow-sm" title="Edit date data">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button onclick="deleteLabeledProduct('${prod.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 w-8.5 h-8.5 rounded-xl border border-rose-200/60 flex items-center justify-center transition-all shadow-sm" title="Delete label record">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        productTableBody.insertAdjacentHTML('beforeend', trHTML);
    });
}

// ============================================================================
// 3. FUNGSI GLOBAL (AKSI TABEL: REPRINT, DELETE, EDIT)
// ============================================================================
window.reprintLabeledProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    openPrintModal(product);
};

window.deleteLabeledProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus data label "${product.name}"?`);
    if (confirmDelete) {
        state.products = state.products.filter(p => p.id !== productId);
        saveProducts(null, productId);
        refreshProductTable();
        showToast('Terhapus', 'Data pelabelan produk telah dihapus.', 'success');
    }
};

window.editLabeledProduct = function(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    populateEditCategoryDropdown();

    editProductId.value = product.id;
    editProductName.value = product.name;
    editProductCategory.value = product.category || '';
    editOpenDate.value = product.openDate;
    editShelfLife.value = product.shelfLife;
    editNotes.value = product.notes || 'Ikhsan';

    updateEditModalExpiry();

    if (editModal) editModal.classList.add('modal-show');
};

function updateEditModalExpiry() {
    if (!editOpenDate || !editShelfLife || !editCalculatedExpiryLabel) return;
    
    const openVal = editOpenDate.value;
    const lifeVal = parseInt(editShelfLife.value);

    const calculation = performCalculation(openVal, lifeVal);
    editCalculatedExpiryLabel.value = calculation.formatted;
    editCalculatedExpiryLabel.setAttribute('data-expiry-raw', calculation.expiryStr);
}

// ============================================================================
// 4. EVENT LISTENERS (MODAL EDIT & FILTER)
// ============================================================================
[editOpenDate, editShelfLife].forEach(input => {
    if (input) {
        input.addEventListener('input', updateEditModalExpiry);
    }
});

// Edit Form Submission Handler
if (editProductForm) {
    editProductForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editProductId.value;
        const name = editProductName.value.trim();
        const category = editProductCategory.value;
        const openDate = editOpenDate.value;
        const shelfLife = parseInt(editShelfLife.value);
        const expiryDate = editCalculatedExpiryLabel.getAttribute('data-expiry-raw');
        const notes = editNotes.value;

        if (!id || !name || !openDate || isNaN(shelfLife) || !expiryDate) return;

        const index = state.products.findIndex(p => p.id === id);
        if (index !== -1) {
            const updatedProd = {
                ...state.products[index],
                name,
                category,
                openDate,
                shelfLife,
                expiryDate,
                notes
            };
            state.products[index] = updatedProd;
            saveProducts(null, null, updatedProd);
            
            if (editModal) editModal.classList.remove('modal-show');
            refreshProductTable();
            showToast('Tersimpan', 'Data label berhasil diperbarui.', 'success');
        }
    });
}

// Close Edit Modal buttons
document.querySelectorAll('.close-edit-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (editModal) editModal.classList.remove('modal-show');
    });
});

// Filters event listeners
if (searchInput) searchInput.addEventListener('input', refreshProductTable);
if (filterCategory) filterCategory.addEventListener('change', refreshProductTable);
if (filterStatus) filterStatus.addEventListener('change', refreshProductTable);

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterCategory) filterCategory.value = 'all';
        if (filterStatus) filterStatus.value = 'all';
        refreshProductTable();
        showToast('Reset Filter', 'Semua pencarian dan filter telah direset.', 'info');
    });
}

// ============================================================================
// 5. FITUR LAINNYA (RESTORE DATA BAWAAN)
// ============================================================================
const restoreDefaultDataBtn = document.getElementById('restore-default-data');
if (restoreDefaultDataBtn) {
    restoreDefaultDataBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin memulihkan semua data riwayat pelabelan ke data bawaan?')) {
            state.products = [
                {
                    id: 'prod-1',
                    name: 'Fresh Milk Greenfields 1L',
                    category: 'Fresh Milk',
                    openDate: getOffsetDateString(-1),
                    shelfLife: 3,
                    expiryDate: getOffsetDateString(2),
                    notes: 'Ikhsan'
                },
                {
                    id: 'prod-2',
                    name: 'Anchor Whipping Cream',
                    category: 'Whipping Cream',
                    openDate: getOffsetDateString(-1.9),
                    shelfLife: 2,
                    expiryDate: getOffsetDateString(0.1),
                    notes: 'Kemal'
                },
                {
                    id: 'prod-3',
                    name: 'Monin Syrup Vanilla',
                    category: 'Sirup',
                    openDate: getOffsetDateString(-32),
                    shelfLife: 30,
                    expiryDate: getOffsetDateString(-2),
                    notes: 'Riski'
                }
            ];
            saveProducts();
            refreshProductTable();
            showToast('Data Dipulihkan', 'Data riwayat pelabelan berhasil dikembalikan ke data bawaan.', 'success');
        }
    });
}

// ============================================================================
// 6. INISIALISASI SAAT HALAMAN DIMUAT
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeSupabaseData === 'function') {
        initializeSupabaseData(() => {
            populateFilterCategories();
            refreshProductTable();
        });
        
        setupRealtimeSubscriptions((table) => {
            console.log(`AELS Data Produk: Data '${table}' ter-update. Refreshing UI...`);
            populateFilterCategories();
            refreshProductTable();
        });
    } else {
        populateFilterCategories();
        refreshProductTable();
    }
});
