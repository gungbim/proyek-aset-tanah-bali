// File: 🧠 script.js (Versi Final dengan CSV)

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
    const kepemilikanSelect = document.getElementById('kepemilikan'); // Ditambahkan untuk filter
    const searchForm = document.getElementById('searchForm');
    const assetMarkers = [];

    // ===== 2. FUNGSI UTAMA UNTUK MENGAMBIL DATA CSV =====
    function loadDataAndInitMap() {
        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSenU0Fl8Zs2LX-fq1JXcvvKy_KLazQgF8LdWX41uFxb4wTS-aSkaHZDEb0MoTVJMXsAMSDfqUB5E6I/pub?output=csv";

        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: function(results) {
                const dataAset = results.data;
                
                dataAset.forEach(aset => {
                    aset.lat = parseFloat(aset.lat);
                    aset.lon = parseFloat(aset.lon);
                });

                displayAllMarkers(dataAset);
                populateDropdowns(dataAset);
                setupFiltering();
            },
            error: function(error) {
                console.error("Gagal memuat atau membaca file CSV:", error);
                alert("Gagal memuat data aset. Periksa kembali link CSV Anda.");
            }
        });
    }

    function displayAllMarkers(dataAset) {
        dataAset.forEach(aset => {
            if (aset.lat && aset.lon) {
                const marker = L.marker([aset.lat, aset.lon]).addTo(map);
                marker.bindPopup(
                    `<b>No Sertipikat:</b> ${aset.nosertipikat}<br>`+
                    `<b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br>`+
                    `<b>Keterangan:</b> ${aset.jenistanah}<br>`+
                    `<b>Pemanfaatan:</b> ${aset.statuspemanfaatan}<br>`+
                    `<b>Appraisal:</b> ${aset.statusappraisal}`
                );
                assetMarkers.push({ aset: aset, marker: marker });
            }
        });
    }

    function populateDropdowns(dataAset) {
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
        createUniqueOptions(desaSelect, 'desa');
        createUniqueOptions(pemanfaatanSelect, 'statuspemanfaatan');
        createUniqueOptions(appraisalSelect, 'statusappraisal');
    }

    function setupFiltering() {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const noSertipikatValue = noSertipikatSelect.value;
            const kabupatenValue = kabupatenSelect.value;
            const desaValue = desaSelect.value;
            const pemanfaatanValue = pemanfaatanSelect.value;
            const appraisalValue = appraisalSelect.value;
            const kepemilikanValue = kepemilikanSelect.value;

            assetMarkers.forEach(item => {
                const aset = item.aset;
                const marker = item.marker;

                const sertipikatMatch = (noSertipikatValue === "") || (aset.nosertipikat === noSertipikatValue);
                const kabupatenMatch = (kabupatenValue === "") || (aset.kabupaten === kabupatenValue);
                const desaMatch = (desaValue === "") || (aset.desa === desaValue);
                const pemanfaatanMatch = (pemanfaatanValue === "") || (aset.statuspemanfaatan === pemanfaatanValue);
                const appraisalMatch = (appraisalValue === "") || (aset.statusappraisal === appraisalValue);
                const kepemilikanMatch = (kepemilikanValue === "") || (aset.kepemilikan === kepemilikanValue);

                if (sertipikatMatch && kabupatenMatch && desaMatch && pemanfaatanMatch && appraisalMatch && kepemilikanMatch) {
                    marker.addTo(map);
                } else {
                    marker.removeFrom(map);
                }
            });

            if (noSertipikatValue) {
                const target = assetMarkers.find(item => item.aset.nosertipikat === noSertipikatValue);
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