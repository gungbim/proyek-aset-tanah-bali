// File: 🧠 script.js (Versi Final dengan Filter Dinamis & Marker Cluster)

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. PERSIAPAN PETA & VARIABEL =====
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    const baseLayers = { "Street": streetLayer, "Satelit": satelliteLayer };
    const map = L.map('map', {
        center: [-8.409518, 115.188919],
        zoom: 9.5,
        layers: [streetLayer]
    });
    L.control.layers(baseLayers).addTo(map);

    // Variabel untuk elemen-elemen filter
    const noSertipikatSelect = document.getElementById('noSertipikat');
    const kabupatenSelect = document.getElementById('kabupaten');
    const desaSelect = document.getElementById('desa');
    const pemanfaatanSelect = document.getElementById('statusPemanfaatan');
    const appraisalSelect = document.getElementById('statusAppraisal');
    const searchForm = document.getElementById('searchForm');

    // Inisialisasi Grup Marker Cluster
    const markers = L.markerClusterGroup();
    let dataAset = []; // Akan diisi setelah data diambil

    // ===== 2. FUNGSI-FUNGSI UTAMA =====

    // Mengambil data dari Google Sheets
    function fetchData() {
        console.log("Mengambil data dari Google Sheets...");
        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSenU0Fl8Zs2LX-fq1JXcvvKy_KLazQgF8LdWX41uFxb4wTS-aSkaHZDEb0MoTVJMXsAMSDfqUB5E6I/pub?output=csv";

        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: function(results) {
                // Simpan data aset yang sudah bersih
                dataAset = results.data.map(aset => ({
                    ...aset,
                    lat: parseFloat(aset.lat),
                    lon: parseFloat(aset.lon)
                }));
                
                // Setelah data siap, tampilkan semuanya
                refreshMapDisplay();
                populateStaticDropdowns();
            },
            error: function(error) {
                console.error("Gagal memuat atau membaca file CSV:", error);
                alert("Gagal memuat data aset. Periksa kembali link CSV Anda.");
            }
        });
    }

    // Menampilkan marker (sekarang menggunakan cluster)
    function displayMarkers(filteredData) {
        markers.clearLayers(); // Bersihkan layer cluster yang lama
        filteredData.forEach(aset => {
            if (aset.lat && aset.lon) {
                const marker = L.marker([aset.lat, aset.lon]);
                marker.bindPopup(
                    `<b>No Sertipikat:</b> ${aset.nosertipikat}<br>`+
                    `<b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br>`+
                    `<b>Keterangan:</b> ${aset.jenistanah}<br>`+
                    `<b>Pemanfaatan:</b> ${aset.statuspemanfaatan}<br>`+
                    `<b>Appraisal:</b> ${aset.statusappraisal}`
                );
                markers.addLayer(marker); // Tambahkan marker ke GRUP CLUSTER
            }
        });
        map.addLayer(markers); // Tambahkan grup cluster ke peta
    }

    // Mengisi dropdown yang tidak dinamis
    function populateStaticDropdowns() {
        const createUniqueOptions = (element, dataField) => {
            const uniqueValues = [...new Set(dataAset.map(item => item[dataField]))].sort();
            uniqueValues.forEach(value => {
                if(value) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    element.appendChild(option);
                }
            });
        };
        createUniqueOptions(noSertipikatSelect, 'nosertipikat');
        createUniqueOptions(kabupatenSelect, 'kabupaten');
        createUniqueOptions(pemanfaatanSelect, 'statuspemanfaatan');
        createUniqueOptions(appraisalSelect, 'statusappraisal');
    }
    
    // FITUR BARU: Mengisi dropdown Desa berdasarkan Kabupaten yang dipilih
    function updateDesaDropdown() {
        const selectedKabupaten = kabupatenSelect.value;
        desaSelect.innerHTML = '<option value="">-- Semua Desa --</option>'; // Reset dropdown desa

        if (selectedKabupaten) {
            const desasInKabupaten = dataAset.filter(item => item.kabupaten === selectedKabupaten);
            const uniqueDesas = [...new Set(desasInKabupaten.map(item => item.desa))].sort();
            uniqueDesas.forEach(desa => {
                if (desa) {
                    const option = document.createElement('option');
                    option.value = desa;
                    option.textContent = desa;
                    desaSelect.appendChild(option);
                }
            });
        }
    }
    
    // Memperbarui tampilan peta berdasarkan semua filter
    function refreshMapDisplay() {
        // Ambil nilai dari semua filter
        const noSertipikatValue = noSertipikatSelect.value;
        const kabupatenValue = kabupatenSelect.value;
        const desaValue = desaSelect.value;
        const pemanfaatanValue = pemanfaatanSelect.value;
        const appraisalValue = appraisalSelect.value;
        const kepemilikanValue = document.getElementById('kepemilikan').value;
        
        // Filter data utama berdasarkan nilai form
        let filteredData = dataAset.filter(aset => {
            const sertipikatMatch = !noSertipikatValue || aset.nosertipikat === noSertipikatValue;
            const kabupatenMatch = !kabupatenValue || aset.kabupaten === kabupatenValue;
            const desaMatch = !desaValue || aset.desa === desaValue;
            const pemanfaatanMatch = !pemanfaatanValue || aset.statuspemanfaatan === pemanfaatanValue;
            const appraisalMatch = !appraisalValue || aset.statusappraisal === appraisalValue;
            const kepemilikanMatch = !kepemilikanValue || aset.kepemilikan === kepemilikanValue;
            return sertipikatMatch && kabupatenMatch && desaMatch && pemanfaatanMatch && appraisalMatch && kepemilikanMatch;
        });
        
        displayMarkers(filteredData);
    }

    // ===== 3. PENGATURAN EVENT LISTENER =====
    
    // Listener untuk dropdown kabupaten (Filter Desa Dinamis)
    kabupatenSelect.addEventListener('change', updateDesaDropdown);

    // Listener untuk form pencarian
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        refreshMapDisplay(); // Terapkan semua filter
        
        // Jika no sertipikat spesifik dipilih, zoom ke sana
        const noSertipikatValue = noSertipikatSelect.value;
        if (noSertipikatValue) {
            const target = dataAset.find(aset => aset.nosertipikat === noSertipikatValue);
            if (target) {
                map.setView([target.lat, target.lon], 18);
                // Buka popup marker yang sesuai
                markers.eachLayer(marker => {
                    // Cek jika koordinat marker sama dengan data target
                    if (marker.getLatLng().lat === target.lat && marker.getLatLng().lng === target.lon) {
                        marker.openPopup();
                    }
                });
            }
        }
    });

    // ===== 4. JALANKAN SEMUANYA! =====
    fetchData();

});