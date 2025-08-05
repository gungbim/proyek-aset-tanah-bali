// File: 🧠 script.js (Versi Final Lengkap dengan Semua Fitur)

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. PERSIAPAN PETA & VARIABEL =====
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    const baseLayers = { "Street": streetLayer, "Satelit": satelliteLayer };
    const map = L.map('map', { center: [-8.409518, 115.188919], zoom: 9.5, layers: [streetLayer] });
    L.control.layers(baseLayers).addTo(map);

    // Menambahkan Kontrol Legenda Peta
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const categories = {
            "Tanah Disewa": "green",
            "Digunakan Sendiri": "blue",
            "Pinjam Pakai": "yellow",
            "Bermasalah": "red"
        };
        div.innerHTML = '<h4>Keterangan Status Tanah</h4>';
        for (const category in categories) {
            div.innerHTML += '<i style="background:' + categories[category] + '"></i> ' + category + '<br>';
        }
        return div;
    };
    legend.addTo(map);

    // Definisi Variabel Elemen HTML
    const noSertipikatSelect = document.getElementById('noSertipikat');
    const kabupatenSelect = document.getElementById('kabupaten');
    const desaSelect = document.getElementById('desa');
    const tanahSelect = document.getElementById('statusTanah');
    const appraisalSelect = document.getElementById('statusAppraisal');
    const kepemilikanSelect = document.getElementById('kepemilikan');
    const resetButton = document.getElementById('resetButton');
    const printButton = document.getElementById('printButton');
    const menuToggle = document.getElementById('menuToggle');
    const searchContainer = document.querySelector('.search-container');
    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportXlsButton = document.getElementById('exportXlsButton');
    
    // Variabel Data dan Marker
    const markers = L.markerClusterGroup();
    let dataAset = [];
    let filteredData = [];

    // Definisi Ikon Berwarna
    const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const yellowIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

    // ===== 2. FUNGSI-FUNGSI UTAMA =====
    function fetchData() {
        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSenU0Fl8Zs2LX-fq1JXcvvKy_KLazQgF8LdWX41uFxb4wTS-aSkaHZDEb0MoTVJMXsAMSDfqUB5E6I/pub?output=csv";
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true, header: true,
            complete: function(results) {
                dataAset = results.data.map(aset => ({ ...aset, lat: parseFloat(aset.lat), lon: parseFloat(aset.lon) }));
                refreshMapDisplay();
                populateStaticDropdowns();
            },
            error: function(error) {
                console.error("Gagal memuat atau membaca file CSV:", error);
                alert("Gagal memuat data aset. Periksa kembali link CSV Anda.");
            }
        });
    }

    function displayMarkers(data) {
        markers.clearLayers();
        data.forEach(aset => {
            if (aset.lat && aset.lon) {
                let markerIcon;
                const status = aset.statustanah ? aset.statustanah.toLowerCase() : "";
                if (status.includes('sewa')) { markerIcon = greenIcon; } 
                else if (status.includes('digunakan')) { markerIcon = blueIcon; }
                else if (status.includes('pinjam pakai')) { markerIcon = yellowIcon; } 
                else if (status.includes('bermasalah')) { markerIcon = redIcon; }
                else { markerIcon = new L.Icon.Default(); }

                const marker = L.marker([aset.lat, aset.lon], { icon: markerIcon });
                marker.bindPopup(`<b>No Sertipikat:</b> ${aset.nosertipikat}<br><b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br><b>Status Tanah:</b> ${aset.statustanah}`);
                markers.addLayer(marker);
            }
        });
        map.addLayer(markers);
    }

    function populateStaticDropdowns() {
        const createUniqueOptions = (element, dataField) => {
            const uniqueValues = [...new Set(dataAset.map(item => item[dataField]))].sort();
            uniqueValues.forEach(value => { if(value) { const option = document.createElement('option'); option.value = value; option.textContent = value; element.appendChild(option); }});
        };
        createUniqueOptions(noSertipikatSelect, 'nosertipikat');
        createUniqueOptions(kabupatenSelect, 'kabupaten');
        createUniqueOptions(tanahSelect, 'statustanah');
        createUniqueOptions(appraisalSelect, 'statusappraisal');
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
            nosertipikat: noSertipikatSelect.value, kabupaten: kabupatenSelect.value,
            desa: desaSelect.value, statustanah: tanahSelect.value,
            statusappraisal: appraisalSelect.value, kepemilikan: kepemilikanSelect.value
        };
        filteredData = dataAset.filter(aset => {
            return Object.keys(filterValues).every(key => !filterValues[key] || aset[key] === filterValues[key]);
        });
        displayMarkers(filteredData);
    }

    // ===== 3. PENGATURAN EVENT LISTENER =====
    const allFilters = [noSertipikatSelect, kabupatenSelect, desaSelect, tanahSelect, appraisalSelect, kepemilikanSelect];
    allFilters.forEach(select => {
        select.addEventListener('change', () => {
            if (select.id === 'kabupaten') { updateDesaDropdown(); }
            refreshMapDisplay();
            if (noSertipikatSelect.value) {
                const target = dataAset.find(aset => aset.nosertipikat === noSertipikatSelect.value);
                if (target) {
                    map.setView([target.lat, target.lon], 18);
                    markers.eachLayer(marker => { if (marker.getLatLng().lat === target.lat && marker.getLatLng().lng === target.lon) { marker.openPopup(); } });
                }
            }
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
        if (filteredData.length === 0) {
            alert("Tidak ada data untuk diekspor. Silakan pilih filter terlebih dahulu atau reset filter.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Laporan Data Aset Tanah", 14, 16);
        const tableColumn = ["No Sertipikat", "Kabupaten", "Desa", "Jenis Tanah", "Status Tanah", "Luas"];
        const tableRows = filteredData.map(item => [item.nosertipikat, item.kabupaten, item.desa, item.jenistanah, item.statustanah, item.luastanah]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save('laporan-aset-tanah.pdf');
    });

    exportXlsButton.addEventListener('click', () => {
        if (filteredData.length === 0) {
            alert("Tidak ada data untuk diekspor. Silakan pilih filter terlebih dahulu atau reset filter.");
            return;
        }
        const headers = "No Sertipikat,Kabupaten,Desa,Jenis Tanah,Status Tanah,Luas,Latitude,Longitude\n";
        const csvRows = filteredData.map(item => `"${item.nosertipikat}","${item.kabupaten}","${item.desa}","${item.jenistanah}","${item.statustanah}","${item.luastanah}","${item.lat}","${item.lon}"`).join("\n");
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