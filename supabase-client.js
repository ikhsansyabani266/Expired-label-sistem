/**
 * ============================================================================
 * SUPABASE-CLIENT.JS
 * Inisialisasi Supabase client dan fungsi sinkronisasi data AELS secara realtime.
 * ============================================================================
 */

let supabase = null;
let supabaseUrl = '';
let supabaseKey = '';

// Helper untuk memeriksa status aktif Supabase
function isSupabaseActive() {
    return supabase !== null;
}

// Inisialisasi konfigurasi Supabase dari Vercel API atau LocalStorage
async function initSupabaseClient() {
    if (typeof supabaseJS === 'undefined') {
        console.warn('AELS: Supabase JS library tidak dimuat. Pastikan script CDN Supabase ditambahkan.');
        return;
    }

    const defaultUrl = 'https://xirlfuncchdndlxpzpec.supabase.co';
    const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcmxmdW5jY2hkbmRseHB6cGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0ODcyODQsImV4cCI6MjEwMTA2MzI4NH0.yEaDE1CCXbIFdD0GNNGi4ITI8wanpujwLI7fp3CsdKc';

    // Coba muat dari LocalStorage terlebih dahulu (jika pengguna meng-override secara manual)
    const storedUrl = localStorage.getItem('aels_supabase_url');
    const storedKey = localStorage.getItem('aels_supabase_key');

    if (storedUrl && storedKey) {
        supabaseUrl = storedUrl;
        supabaseKey = storedKey;
        console.log('AELS: Konfigurasi Supabase dimuat dari LocalStorage.');
    } else {
        try {
            // Coba ambil dari Vercel API endpoint
            const response = await fetch('/api/config').catch(() => null);
            if (response && response.ok) {
                const config = await response.json();
                if (config.supabaseUrl && config.supabaseKey) {
                    supabaseUrl = config.supabaseUrl;
                    supabaseKey = config.supabaseKey;
                    console.log('AELS: Konfigurasi Supabase dimuat dari Vercel Environment Variables.');
                }
            }
        } catch (e) {
            console.log('AELS: Gagal memuat Vercel config API.');
        }
    }

    // Gunakan default hardcoded jika tidak ada di LocalStorage atau Vercel Environment Variables
    if (!supabaseUrl || !supabaseKey) {
        supabaseUrl = defaultUrl;
        supabaseKey = defaultKey;
        console.log('AELS: Konfigurasi Supabase dimuat dari Default Hardcoded.');
    }

    // Inisialisasi client
    if (supabaseUrl && supabaseKey) {
        try {
            supabase = supabaseJS.createClient(supabaseUrl, supabaseKey);
            console.log('AELS: Supabase Client berhasil terinisialisasi.');
        } catch (e) {
            console.error('AELS: Gagal menginisialisasi Supabase Client.', e);
        }
    }
}

/**
 * ============================================================================
 * SINKRONISASI DATA (SUPABASE <=> STATE LOCAL)
 * ============================================================================
 */

// 1. Sinkronisasi Master SOP Products
async function syncMasterProducts() {
    if (!isSupabaseActive()) return;

    try {
        const { data, error } = await supabase
            .from('aels_master_products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            // Jika ada data di server, timpa data lokal
            state.masterProducts = data.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                days: item.days
            }));
            localStorage.setItem('aels_master_products', JSON.stringify(state.masterProducts));
        } else {
            // Jika kosong di server, upload data lokal awal
            for (const prod of state.masterProducts) {
                await supabase.from('aels_master_products').insert([{
                    id: prod.id,
                    name: prod.name,
                    category: prod.category,
                    days: prod.days
                }]);
            }
        }
    } catch (err) {
        console.error('AELS: Gagal sinkronisasi master SOP produk.', err);
    }
}

// 2. Sinkronisasi Riwayat Pelabelan (Products)
async function syncProducts() {
    if (!isSupabaseActive()) return;

    try {
        const { data, error } = await supabase
            .from('aels_products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
            state.products = data.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                openDate: item.open_date,
                shelfLife: item.shelf_life,
                expiryDate: item.expiry_date,
                notes: item.notes
            }));
            localStorage.setItem('aels_products', JSON.stringify(state.products));
        }
    } catch (err) {
        console.error('AELS: Gagal sinkronisasi riwayat produk.', err);
    }
}

// 3. Sinkronisasi Daftar Barista
async function syncBaristas() {
    if (!isSupabaseActive()) return;

    try {
        const { data, error } = await supabase
            .from('aels_baristas')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            state.baristas = data.map(item => item.name);
            localStorage.setItem('aels_baristas', JSON.stringify(state.baristas));
        } else {
            // Jika kosong di server, upload data lokal awal
            for (const name of state.baristas) {
                await supabase.from('aels_baristas').insert([{ name }]);
            }
        }
    } catch (err) {
        console.error('AELS: Gagal sinkronisasi baristas.', err);
    }
}

// 4. Sinkronisasi Pengaturan Printer & Total Printed
async function syncPrintSettings() {
    if (!isSupabaseActive()) return;

    try {
        const { data, error } = await supabase
            .from('aels_print_settings')
            .select('*')
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const item = data[0];
            state.printSettings = {
                printerType: item.printer_type,
                printerIpAddress: item.printer_ip_address,
                labelSize: item.label_size,
                totalPrinted: item.total_printed
            };
            localStorage.setItem('aels_print', JSON.stringify(state.printSettings));
            localStorage.setItem('aels_total_printed', state.printSettings.totalPrinted);
        } else {
            // Upload setting saat ini jika database kosong
            await supabase.from('aels_print_settings').insert([{
                id: 1, // ID tunggal untuk setting
                printer_type: state.printSettings.printerType,
                printer_ip_address: state.printSettings.printerIpAddress,
                label_size: state.printSettings.labelSize,
                total_printed: state.printSettings.totalPrinted
            }]);
        }
    } catch (err) {
        console.error('AELS: Gagal sinkronisasi setting printer.', err);
    }
}

/**
 * ============================================================================
 * OPERASI DATABASE ASYNC (DIJALANKAN DARI PERUBAHAN UI)
 * ============================================================================
 */

// Menambahkan atau memperbarui Master SOP
async function dbSaveMasterProduct(prod) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_master_products')
            .upsert({
                id: prod.id,
                name: prod.name,
                category: prod.category,
                days: prod.days
            });
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menyimpan master SOP.', err);
    }
}

// Menghapus Master SOP
async function dbDeleteMasterProduct(id) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_master_products')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menghapus master SOP.', err);
    }
}

// Menambahkan Riwayat Pelabelan Baru
async function dbAddProduct(prod) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_products')
            .insert({
                id: prod.id,
                name: prod.name,
                category: prod.category,
                open_date: prod.openDate,
                shelf_life: prod.shelfLife,
                expiry_date: prod.expiryDate,
                notes: prod.notes
            });
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menambahkan riwayat produk.', err);
    }
}

// Mengedit Riwayat Pelabelan
async function dbUpdateProduct(prod) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_products')
            .update({
                name: prod.name,
                category: prod.category,
                open_date: prod.openDate,
                shelf_life: prod.shelfLife,
                expiry_date: prod.expiryDate,
                notes: prod.notes
            })
            .eq('id', prod.id);
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal mengupdate riwayat produk.', err);
    }
}

// Menghapus Riwayat Pelabelan
async function dbDeleteProduct(id) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_products')
            .delete()
            .eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menghapus riwayat produk.', err);
    }
}

// Memulihkan/Menghapus seluruh riwayat produk (Reset database riwayat saja)
async function dbResetProducts() {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_products')
            .delete()
            .neq('id', 'dummy'); // Hapus semua baris
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal mereset tabel produk.', err);
    }
}

// Menambah Barista
async function dbAddBarista(name) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_baristas')
            .insert({ name });
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menambah barista.', err);
    }
}

// Mengedit Barista
async function dbUpdateBarista(oldName, newName) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_baristas')
            .update({ name: newName })
            .eq('name', oldName);
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal mengupdate barista.', err);
    }
}

// Menghapus Barista
async function dbDeleteBarista(name) {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_baristas')
            .delete()
            .eq('name', name);
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menghapus barista.', err);
    }
}

// Mengupdate Pengaturan Printer & Total Printed
async function dbSavePrintSettings() {
    if (!isSupabaseActive()) return;
    try {
        const { error } = await supabase
            .from('aels_print_settings')
            .upsert({
                id: 1,
                printer_type: state.printSettings.printerType,
                printer_ip_address: state.printSettings.printerIpAddress,
                label_size: state.printSettings.labelSize,
                total_printed: state.printSettings.totalPrinted
            });
        if (error) throw error;
    } catch (err) {
        console.error('AELS DB: Gagal menyimpan setting printer.', err);
    }
}

/**
 * ============================================================================
 * REALTIME SUBSCRIPTION (SYNC ANTAR TAB / CLIENT SECARA LANGSUNG)
 * ============================================================================
 */
function setupRealtimeSubscriptions(onDataChangeCallback) {
    if (!isSupabaseActive()) return;

    // Subs tabel products (riwayat label)
    supabase.channel('public:aels_products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'aels_products' }, async () => {
            await syncProducts();
            if (typeof onDataChangeCallback === 'function') onDataChangeCallback('products');
        })
        .subscribe();

    // Subs tabel master_products (SOP)
    supabase.channel('public:aels_master_products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'aels_master_products' }, async () => {
            await syncMasterProducts();
            if (typeof onDataChangeCallback === 'function') onDataChangeCallback('masterProducts');
        })
        .subscribe();

    // Subs tabel baristas
    supabase.channel('public:aels_baristas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'aels_baristas' }, async () => {
            await syncBaristas();
            if (typeof onDataChangeCallback === 'function') onDataChangeCallback('baristas');
        })
        .subscribe();

    // Subs tabel print_settings
    supabase.channel('public:aels_print_settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'aels_print_settings' }, async () => {
            await syncPrintSettings();
            if (typeof onDataChangeCallback === 'function') onDataChangeCallback('printSettings');
        })
        .subscribe();
}

/**
 * Inisialisasi awal sinkronisasi data dari Supabase saat load
 */
async function initializeSupabaseData(onFinishCallback) {
    // Jalankan inisialisasi client asinkron terlebih dahulu
    await initSupabaseClient();

    if (!isSupabaseActive()) {
        if (typeof onFinishCallback === 'function') onFinishCallback();
        return;
    }

    console.log('AELS: Memulai sinkronisasi data Supabase...');
    
    // Jalankan semua sync secara berurutan atau paralel
    await Promise.all([
        syncMasterProducts(),
        syncProducts(),
        syncBaristas(),
        syncPrintSettings()
    ]);

    console.log('AELS: Sinkronisasi data Supabase selesai.');
    if (typeof onFinishCallback === 'function') onFinishCallback();
}