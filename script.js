// File: 🧠 script.js (Versi Final dengan Konversi Data Aman)

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. PERSIAPAN PETA & VARIABEL =====
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    const baseLayers = { "Street": streetLayer, "Satelit": satelliteLayer };
    const map = L.map('map', { center: [-8.409518, 115.188919], zoom: 9.5, layers: [streetLayer] });
    L.control.layers(baseLayers).addTo(map);

    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const categories = { "Sewa": "green", "Digunakan Sendiri": "blue", "Pinjam Pakai": "yellow", "Bermasalah": "red" };
        div.innerHTML = '<h4>Keterangan</h4>';
        for (const category in categories) {
            div.innerHTML += '<i style="background:' + categories[category] + '"></i> ' + category + '<br>';
        }
        return div;
    };
    legend.addTo(map);
    
    // Variabel elemen filter
    const noSertipikatSelect = document.getElementById('noSertipikat');
    const kabupatenSelect = document.getElementById('kabupaten');
    const desaSelect = document.getElementById('desa');
    const kategoriSelect = document.getElementById('kategori');
    const statusPemanfaatanSelect = document.getElementById('statusPemanfaatan');
    const jenisPemanfaatanSelect = document.getElementById('jenisPemanfaatan');
    const resetButton = document.getElementById('resetButton');
    const printButton = document.getElementById('printButton');
    const menuToggle = document.getElementById('menuToggle');
    const searchContainer = document.querySelector('.search-container');
    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportXlsButton = document.getElementById('exportXlsButton');
    
    const markers = L.markerClusterGroup();
    let dataAset = [];
    let filteredData = [];

    const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const yellowIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

    // ===== 2. FUNGSI-FUNGSI UTAMA =====
    function fetchData() {
        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSenU0Fl8Zs2LX-fq1JXcvvKy_KLazQgF8LdWX41uFxb4wTS-aSkaHZDEb_oTVJMXsAMSDfqUB5E6I/pub?output=csv"; 
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // Perubahan di sini: Pastikan results.data adalah array
                let rawData = results.data;
                if (!Array.isArray(rawData)) {
                    rawData = Object.values(rawData);
                }

                dataAset = rawData.filter(aset => aset && aset.nosertipikat && aset.nosertipikat.trim() !== '').map(aset => ({ ...aset, lat: parseFloat(aset.lat), lon: parseFloat(aset.lon) }));
                
                refreshMapDisplay();
                populateStaticDropdowns();
            },
            error: function(error) {
                console.error("Gagal memuat atau membaca file CSV:", error);
                alert("Gagal memuat data aset. Periksa kembali link CSV atau isi Spreadsheet.");
            }
        });
    }

    function displayMarkers(data) {
        markers.clearLayers();
        data.forEach(aset => {
            if (aset.lat && aset.lon) {
                let markerIcon;
                const status = aset.jenispemanfaatan ? aset.jenispemanfaatan.toLowerCase() : "";
                if (status.includes('sewa')) { markerIcon = greenIcon; } 
                else if (status.includes('digunakan sendiri')) { markerIcon = blueIcon; }
                else if (status.includes('pinjam pakai')) { markerIcon = yellowIcon; } 
                else if (status.includes('bermasalah')) { markerIcon = redIcon; }
                else { markerIcon = new L.Icon.Default(); }

                const marker = L.marker([aset.lat, aset.lon], { icon: markerIcon });
                marker.bindPopup(
                    `<b>No Sertipikat:</b> ${aset.nosertipikat}<br>`+
                    `<b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br>`+
                    `<b>Kategori:</b> ${aset.kategori || '-'}<br>`+
                    `<b>Pemanfaatan:</b> ${aset.statuspemanfaatan || '-'}<br>`+
                    `<b>Jenis Pemanfaatan:</b> ${aset.jenispemanfaatan || '-'}`
                );
                markers.addLayer(marker);
            }
        });
        map.addLayer(markers);
    }

    function populateStaticDropdowns() {
        const createUniqueOptions = (element, dataField) => {
            const uniqueValues = [...new Set(dataAset.map(item => item[dataField]))].sort();
            uniqueValues.forEach(value => { if(value && value.trim() !== '' && value.trim() !== '-') { const option = document.createElement('option'); option.value = value; option.textContent = value; element.appendChild(option); }});
        };
        createUniqueOptions(noSertipikatSelect, 'nosertipikat');
        createUniqueOptions(kabupatenSelect, 'kabupaten');
        createUniqueOptions(kategoriSelect, 'kategori');
        createUniqueOptions(statusPemanfaatanSelect, 'statuspemanfaatan');
        createUniqueOptions(jenisPemanfaatanSelect, 'jenispemanfaatan');
    }
    
    function updateDesaDropdown() {
        const selectedKabupaten = kabupatenSelect.value;
        desaSelect.innerHTML = '<option value="">-- Semua Desa --</option>';
        if (selectedKabupaten) {
            const desasInKabupaten = dataAset.filter(item => item.kabupaten === selectedKabupaten);
            const uniqueDesas = [...new Set(desasInKabupaten.map(item => item.desa))].sort();
            uniqueDesas.forEach(desa => { if (desa) { const option = document.createElement('option'); option.value = desa; option.textContent = desa; desaSelect.appendChild(option); }});
        }
    }
    
    function refreshMapDisplay() {
        const filterValues = {
            nosertipikat: noSertipikatSelect.value, 
            kabupaten: kabupatenSelect.value,
            desa: desaSelect.value, 
            kategori: kategoriSelect.value,
            statuspemanfaatan: statusPemanfaatanSelect.value,
            jenispemanfaatan: jenisPemanfaatanSelect.value
        };
        filteredData = dataAset.filter(aset => {
            return Object.keys(filterValues).every(key => !filterValues[key] || aset[key] === filterValues[key]);
        });
        displayMarkers(filteredData);
    }

    const allFilters = [noSertipikatSelect, kabupatenSelect, desaSelect, kategoriSelect, statusPemanfaatanSelect, jenisPemanfaatanSelect];
    allFilters.forEach(select => {
        select.addEventListener('change', () => {
            if (select.id === 'kabupaten') { updateDesaDropdown(); }
            refreshMapDisplay();
        });
    });

    resetButton.addEventListener('click', () => {
        allFilters.forEach(select => select.selectedIndex = 0);
        updateDesaDropdown();
        refreshMapDisplay();
        map.setView([-8.409518, 115.188919], 9.5);
    });
    
    printButton.addEventListener('click', () => window.print());
    menuToggle.addEventListener('click', () => searchContainer.classList.toggle('open'));

    exportPdfButton.addEventListener('click', () => {
        if (filteredData.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Laporan Data Aset Tanah", 14, 16);
        const tableColumn = ["No Sertipikat", "Kabupaten", "Desa", "Kategori", "Jenis Pemanfaatan"];
        const tableRows = filteredData.map(item => [item.nosertipikat, item.kabupaten, item.desa, item.kategori, item.jenispemanfaatan]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save('laporan-aset-tanah.pdf');
    });

    exportXlsButton.addEventListener('click', () => {
        if (filteredData.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
        const headers = Object.keys(filteredData[0]).join(',') + '\n';
        const csvRows = filteredData.map(item => Object.values(item).map(val => `"${val}"`).join(',')).join('\n');
        const csvContent = headers + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "laporan-aset-tanah.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // ===== 4. JALANKAN SEMUANYA! =====
    fetchData();
});