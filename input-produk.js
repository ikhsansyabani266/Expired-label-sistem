/**
 * ============================================================================
 * INPUT-PRODUK.JS
 * File ini menangani logika di halaman "Input Produk".
 * (Tambah, edit, dan hapus master SOP produk & kategori)
 * ============================================================================
 */

// ============================================================================
// 1. DEKLARASI VARIABEL (DOM ELEMENTS)
// ============================================================================
const sopSettingsTableBody = document.getElementById('sop-table-body');
const addCategoryBtn = document.getElementById('add-category-btn');
const manageCategoryBtn = document.getElementById('manage-category-btn');

// Modal Input Produk
const categoryModal = document.getElementById('category-modal');
const categoryModalForm = document.getElementById('category-modal-form');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryModalId = document.getElementById('category-modal-id');
const modalProdName = document.getElementById('modal-prod-name');
const modalCatSelect = document.getElementById('modal-cat-select');
const newCategoryWrapper = document.getElementById('new-category-wrapper');
const modalNewCatName = document.getElementById('modal-new-cat-name');
const modalCatDays = document.getElementById('modal-cat-days');

// Modal Rename Kategori
const renameCatModal = document.getElementById('rename-cat-modal');
const renameCatForm = document.getElementById('rename-cat-form');
const renameCatSelect = document.getElementById('rename-cat-select');
const renameNewName = document.getElementById('rename-new-name');
const deleteCatBtn = document.getElementById('delete-cat-btn');

// ============================================================================
// 2. FUNGSI UTAMA (RENDER TABEL & DROPDOWN)
// ============================================================================
function getUniqueCategories() {
    const cats = state.masterProducts.map(p => p.category);
    return [...new Set(cats)].sort();
}

// Populate category dropdowns
function populateCategoryDropdowns() {
    const categories = getUniqueCategories();
    
    // For Add/Edit Product Modal
    if (modalCatSelect) {
        modalCatSelect.innerHTML = '<option value="" disabled selected>Pilih Kategori...</option>';
        categories.forEach(cat => {
            modalCatSelect.insertAdjacentHTML('beforeend', `<option value="${cat}">${cat}</option>`);
        });
        modalCatSelect.insertAdjacentHTML('beforeend', '<option value="NEW_CATEGORY_OPTION" class="font-bold text-emerald-600">+ Buat Kategori Baru</option>');
    }

    // For Rename Category Modal
    if (renameCatSelect) {
        renameCatSelect.innerHTML = '<option value="" disabled selected>Pilih Kategori...</option>';
        categories.forEach(cat => {
            renameCatSelect.insertAdjacentHTML('beforeend', `<option value="${cat}">${cat}</option>`);
        });
    }
}

// ============================================================================
// 3. EVENT LISTENERS (MODAL TAMBAH/EDIT PRODUK)
// ============================================================================
if (modalCatSelect) {
    modalCatSelect.addEventListener('change', (e) => {
        if (e.target.value === 'NEW_CATEGORY_OPTION') {
            newCategoryWrapper.classList.remove('hidden');
            modalNewCatName.setAttribute('required', 'required');
            modalNewCatName.focus();
        } else {
            newCategoryWrapper.classList.add('hidden');
            modalNewCatName.removeAttribute('required');
            modalNewCatName.value = '';
        }
    });
}

// Render master SOP table rows
function refreshSopTable() {
    if (!sopSettingsTableBody) return;

    sopSettingsTableBody.innerHTML = '';

    const sorted = [...state.masterProducts].sort((a, b) => a.name.localeCompare(b.name));

    if (sorted.length === 0) {
        sopSettingsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="py-12 text-center text-stone-400 text-xs font-medium">
                    <div class="flex flex-col items-center gap-2">
                        <i class="fa-solid fa-box-open text-2xl text-stone-300"></i>
                        <span>Belum ada data produk. Klik <strong class="text-coffee-600">Tambah SOP</strong> untuk menambahkan.</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    sorted.forEach(mst => {
        const trHTML = `
            <tr class="border-b border-stone-100 hover:bg-stone-50/50 transition-all font-medium text-stone-700">
                <td class="py-3.5 pr-4 px-4 font-extrabold text-stone-850">${mst.name}</td>
                <td class="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-500">${mst.category}</td>
                <td class="py-3.5 px-4">
                    <span class="bg-stone-100 border border-stone-200/40 text-stone-800 font-extrabold font-mono text-[11px] px-2.5 py-0.5 rounded-lg">
                        ${mst.days} Hari
                    </span>
                </td>
                <td class="py-3.5 pl-4 pr-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="editSopItem('${mst.id}')" class="bg-white hover:bg-stone-100 text-coffee-600 border border-stone-200 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm" title="Edit master">
                            <i class="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button onclick="deleteSopItem('${mst.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm" title="Hapus master">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        sopSettingsTableBody.insertAdjacentHTML('beforeend', trHTML);
    });
}

// ============================================================================
// 4. FUNGSI GLOBAL (AKSI TABEL: EDIT & HAPUS SOP)
// ============================================================================
window.editSopItem = function(id) {
    const master = state.masterProducts.find(m => m.id === id);
    if (!master) return;

    populateCategoryDropdowns();
    
    categoryModalTitle.textContent = 'Edit Master Produk';
    categoryModalId.value = master.id;
    modalProdName.value = master.name;
    
    // Set category select
    modalCatSelect.value = master.category;
    newCategoryWrapper.classList.add('hidden');
    modalNewCatName.removeAttribute('required');
    modalNewCatName.value = '';

    modalCatDays.value = master.days;

    if (categoryModal) categoryModal.classList.add('modal-show');
};

window.deleteSopItem = function(id) {
    const master = state.masterProducts.find(m => m.id === id);
    if (!master) return;

    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus "${master.name}" dari Master SOP?`);
    if (confirmDelete) {
        state.masterProducts = state.masterProducts.filter(m => m.id !== id);
        saveMasterProducts();
        refreshSopTable();
        showToast('Terhapus', 'Master produk berhasil dihapus dari SOP.', 'success');
    }
};

// Handler form submit tambah/edit produk
if (categoryModalForm) {
    categoryModalForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = categoryModalId.value;
        const nameVal = modalProdName.value.trim();
        let catVal = modalCatSelect.value;
        
        if (catVal === 'NEW_CATEGORY_OPTION') {
            catVal = modalNewCatName.value.trim();
        }

        const daysVal = parseInt(modalCatDays.value);

        if (!nameVal || !catVal || isNaN(daysVal)) return;

        if (id) {
            const idx = state.masterProducts.findIndex(m => m.id === id);
            if (idx !== -1) {
                state.masterProducts[idx] = { id, name: nameVal, category: catVal, days: daysVal };
                showToast('Tersimpan', `Master SOP "${nameVal}" berhasil diperbarui.`, 'success');
            }
        } else {
            const newMaster = {
                id: 'prod-mst-' + Date.now(),
                name: nameVal,
                category: catVal,
                days: daysVal
            };
            state.masterProducts.push(newMaster);
            showToast('Ditambahkan', `Produk "${nameVal}" berhasil ditambahkan ke SOP.`, 'success');
        }

        saveMasterProducts();
        refreshSopTable();

        if (categoryModal) categoryModal.classList.remove('modal-show');
        categoryModalForm.reset();
    });
}

// Close modal button handlers
document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (categoryModal) categoryModal.classList.remove('modal-show');
        if (categoryModalForm) categoryModalForm.reset();
        if (newCategoryWrapper) newCategoryWrapper.classList.add('hidden');
    });
});

if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => {
        populateCategoryDropdowns();
        categoryModalTitle.textContent = 'Tambah Master Produk';
        categoryModalId.value = '';
        if (categoryModalForm) categoryModalForm.reset();
        if (newCategoryWrapper) newCategoryWrapper.classList.add('hidden');
        if (modalNewCatName) modalNewCatName.removeAttribute('required');
        if (categoryModal) categoryModal.classList.add('modal-show');
    });
}

// ============================================================================
// 5. EVENT LISTENERS (MODAL KELOLA KATEGORI)
// ============================================================================
if (manageCategoryBtn) {
    manageCategoryBtn.addEventListener('click', () => {
        populateCategoryDropdowns();
        if (renameCatForm) renameCatForm.reset();
        if (renameCatModal) renameCatModal.classList.add('modal-show');
    });
}

document.querySelectorAll('.close-rename-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (renameCatModal) renameCatModal.classList.remove('modal-show');
    });
});

if (renameCatForm) {
    renameCatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const oldCat = renameCatSelect.value;
        const newCat = renameNewName.value.trim();
        
        if (!oldCat || !newCat) return;
        
        let count = 0;
        state.masterProducts.forEach(prod => {
            if (prod.category === oldCat) {
                prod.category = newCat;
                count++;
            }
        });
        
        saveMasterProducts();
        refreshSopTable();
        
        showToast('Kategori Diperbarui', `Berhasil mengubah nama kategori "${oldCat}" menjadi "${newCat}" pada ${count} produk.`, 'success');
        
        if (renameCatModal) renameCatModal.classList.remove('modal-show');
    });
}

if (deleteCatBtn) {
    deleteCatBtn.addEventListener('click', () => {
        const selectedCat = renameCatSelect.value;
        if (!selectedCat) {
            showToast('Peringatan', 'Silakan pilih kategori yang ingin dihapus terlebih dahulu.', 'warning');
            return;
        }

        const confirmDelete = confirm(`PERINGATAN!\n\nApakah Anda yakin ingin menghapus kategori "${selectedCat}"?\nSEMUA PRODUK di dalam kategori ini juga akan terhapus dan tidak bisa dikembalikan.`);
        
        if (confirmDelete) {
            const initialLength = state.masterProducts.length;
            state.masterProducts = state.masterProducts.filter(prod => prod.category !== selectedCat);
            const deletedCount = initialLength - state.masterProducts.length;
            
            saveMasterProducts();
            refreshSopTable();
            
            showToast('Kategori Dihapus', `Kategori "${selectedCat}" dan ${deletedCount} produk di dalamnya berhasil dihapus.`, 'success');
            
            if (renameCatModal) renameCatModal.classList.remove('modal-show');
        }
    });
}

// ============================================================================
// 6. INISIALISASI SAAT HALAMAN DIMUAT
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (typeof initializeSupabaseData === 'function') {
        initializeSupabaseData(() => {
            refreshSopTable();
        });
        
        setupRealtimeSubscriptions((table) => {
            console.log(`AELS Input Produk: Data '${table}' ter-update. Refreshing UI...`);
            if (table === 'masterProducts') {
                refreshSopTable();
            }
        });
    } else {
        refreshSopTable();
    }
});

window.refreshLocalUI = function() {
    refreshSopTable();
};
