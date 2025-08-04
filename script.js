// File: 🧠 script.js (Versi Final dengan Google Sheets)

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

    const noSertipikatSelect = document.getElementById('noSertipikat');
    const kabupatenSelect = document.getElementById('kabupaten');
    const desaSelect = document.getElementById('desa');
    const pemanfaatanSelect = document.getElementById('statusPemanfaatan');
    const appraisalSelect = document.getElementById('statusAppraisal');
    const searchForm = document.getElementById('searchForm');
    const assetMarkers = [];

    // ===== 2. FUNGSI UTAMA UNTUK MENGAMBIL DAN MEMPROSES DATA =====
    async function loadDataAndInitMap() {
        // ID Spreadsheet Anda sudah dimasukkan di sini
        const SPREADSHEET_ID = "1E7F4L9a4QhAvHytlxJRXTiZtSjSj3JeUiRagdGyuuqw"; 
        const url = `https://spreadsheets.google.com/feeds/list/${SPREADSHEET_ID}/od6/public/values?alt=json`;

        try {
            const response = await fetch(url);
            const json = await response.json();
            
            // Konversi data dari format Google Sheets ke format yang kita inginkan
            const dataAset = json.feed.entry.map(entry => ({
                noSertipikat: entry.gsx$nosertipikat.$t,
                kabupaten: entry.gsx$kabupaten.$t,
                desa: entry.gsx$desa.$t,
                kepemilikan: entry.gsx$kepemilikan.$t,
                lat: parseFloat(entry.gsx$lat.$t),
                lon: parseFloat(entry.gsx$lon.$t),
                luasTanah: entry.gsx$luastanah.$t,
                jenisTanah: entry.gsx$jenistanah.$t,
                statusPemanfaatan: entry.gsx$statuspemanfaatan.$t,
                statusAppraisal: entry.gsx$statusappraisal.$t
            }));

            // Setelah data berhasil didapat, jalankan fungsi untuk menampilkan peta dan filter
            displayAllMarkers(dataAset);
            populateDropdowns(dataAset);
            setupFiltering(dataAset);

        } catch (error) {
            console.error("Gagal mengambil data dari Google Sheets:", error);
            alert("Tidak dapat memuat data aset. Periksa kembali koneksi atau pengaturan Spreadsheet.");
        }
    }

    function displayAllMarkers(dataAset) {
        dataAset.forEach(aset => {
            const marker = L.marker([aset.lat, aset.lon]).addTo(map);
            marker.bindPopup(
                `<b>No Sertipikat:</b> ${aset.noSertipikat}<br>` +
                `<b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br>` +
                `<b>Keterangan:</b> ${aset.jenisTanah}<br>` +
                `<b>Pemanfaatan:</b> ${aset.statusPemanfaatan}<br>` +
                `<b>Appraisal:</b> ${aset.statusAppraisal}`
            );
            assetMarkers.push({ aset: aset, marker: marker });
        });
    }

    function populateDropdowns(dataAset) {
        const createUniqueOptions = (element, dataField) => {
            const uniqueValues = [...new Set(dataAset.map(item => item[item.dataField]))].sort();
            uniqueValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                element.appendChild(option);
            });
        };
        createUniqueOptions(noSertipikatSelect, 'noSertipikat');
        createUniqueOptions(kabupatenSelect, 'kabupaten');
        createUniqueOptions(desaSelect, 'desa');
        createUniqueOptions(pemanfaatanSelect, 'statusPemanfaatan');
        createUniqueOptions(appraisalSelect, 'statusAppraisal');
    }

    function setupFiltering(dataAset) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const noSertipikatValue = noSertipikatSelect.value;
            const kabupatenValue = kabupatenSelect.value;
            const desaValue = desaSelect.value;
            const pemanfaatanValue = pemanfaatanSelect.value;
            const appraisalValue = appraisalSelect.value;

            assetMarkers.forEach(item => {
                const aset = item.aset;
                const marker = item.marker;

                const sertipikatMatch = (noSertipikatValue === "") || (aset.noSertipikat === noSertipikatValue);
                const kabupatenMatch = (kabupatenValue === "") || (aset.kabupaten === kabupatenValue);
                const desaMatch = (desaValue === "") || (aset.desa === desaValue);
                const pemanfaatanMatch = (pemanfaatanValue === "") || (aset.statusPemanfaatan === pemanfaatanValue);
                const appraisalMatch = (appraisalValue === "") || (aset.statusAppraisal === appraisalValue);

                if (sertipikatMatch && kabupatenMatch && desaMatch && pemanfaatanMatch && appraisalMatch) {
                    marker.addTo(map);
                } else {
                    marker.removeFrom(map);
                }
            });

            if (noSertipikatValue) {
                const target = assetMarkers.find(item => item.aset.noSertipikat === noSertipikatValue);
                if(target) {
                    map.setView([target.aset.lat, target.aset.lon], 18);
                    target.marker.openPopup();
                }
            }
        });
    }

    // ===== 3. JALANKAN SEMUANYA! =====
    loadDataAndInitMap();

});