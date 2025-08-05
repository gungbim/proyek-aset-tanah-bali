// File: 🧠 script.js (Versi dengan Status Tanah)

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

    // Variabel elemen filter (diperbarui)
    const noSertipikatSelect = document.getElementById('noSertipikat');
    const kabupatenSelect = document.getElementById('kabupaten');
    const desaSelect = document.getElementById('desa');
    const tanahSelect = document.getElementById('statusTanah'); // Diubah dari pemanfaatanSelect
    const appraisalSelect = document.getElementById('statusAppraisal');
    const searchForm = document.getElementById('searchForm');
    
    const markers = L.markerClusterGroup();
    let dataAset = [];

    // Definisi ikon berwarna
    const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const blueIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const yellowIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
    const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

    // ===== 2. FUNGSI-FUNGSI UTAMA =====
    
    function fetchData() {
        const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSenU0Fl8Zs2LX-fq1JXcvvKy_KLazQgF8LdWX41uFxb4wTS-aSkaHZDEb0MoTVJMXsAMSDfqUB5E6I/pub?output=csv";
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: function(results) {
                dataAset = results.data.map(aset => ({ ...aset, lat: parseFloat(aset.lat), lon: parseFloat(aset.lon) }));
                refreshMapDisplay();
                populateStaticDropdowns();
            }
        });
    }

    function displayMarkers(filteredData) {
        markers.clearLayers();
        filteredData.forEach(aset => {
            if (aset.lat && aset.lon) {
                
                // Logika Ikon Marker (diperbarui ke aset.statustanah)
                let markerIcon;
                const status = aset.statustanah ? aset.statustanah.toLowerCase() : "";

                if (status.includes('sewa')) { markerIcon = greenIcon; } 
                else if (status.includes('digunakan')) { markerIcon = blueIcon; }
                else if (status.includes('pinjam pakai')) { markerIcon = yellowIcon; } 
                else if (status.includes('bermasalah')) { markerIcon = redIcon; }
                else { markerIcon = new L.Icon.Default(); }

                const marker = L.marker([aset.lat, aset.lon], { icon: markerIcon });
                
                marker.bindPopup(
                    `<b>No Sertipikat:</b> ${aset.nosertipikat}<br>`+
                    `<b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br>`+
                    `<b>Status Tanah:</b> ${aset.statustanah}` // Diubah
                );
                markers.addLayer(marker);
            }
        });
        map.addLayer(markers);
    }
    
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
        createUniqueOptions(tanahSelect, 'statustanah'); // Diubah
        createUniqueOptions(appraisalSelect, 'statusappraisal');
    }
    
    function updateDesaDropdown() {
        const selectedKabupaten = kabupatenSelect.value;
        desaSelect.innerHTML = '<option value="">-- Semua Desa --</option>';
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
    
    function refreshMapDisplay() {
        const noSertipikatValue = noSertipikatSelect.value;
        const kabupatenValue = kabupatenSelect.value;
        const desaValue = desaSelect.value;
        const tanahValue = tanahSelect.value; // Diubah
        const appraisalValue = appraisalSelect.value;
        const kepemilikanValue = document.getElementById('kepemilikan').value;
        
        let filteredData = dataAset.filter(aset => {
            const sertipikatMatch = !noSertipikatValue || aset.nosertipikat === noSertipikatValue;
            const kabupatenMatch = !kabupatenValue || aset.kabupaten === kabupatenValue;
            const desaMatch = !desaValue || aset.desa === desaValue;
            const tanahMatch = !tanahValue || aset.statustanah === tanahValue; // Diubah
            const appraisalMatch = !appraisalValue || aset.statusappraisal === appraisalValue;
            const kepemilikanMatch = !kepemilikanValue || aset.kepemilikan === kepemilikanValue;
            return sertipikatMatch && kabupatenMatch && desaMatch && tanahMatch && appraisalMatch && kepemilikanMatch;
        });
        displayMarkers(filteredData);
    }

    // ===== 3. PENGATURAN EVENT LISTENER =====
    kabupatenSelect.addEventListener('change', updateDesaDropdown);

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        refreshMapDisplay();
        
        const noSertipikatValue = noSertipikatSelect.value;
        if (noSertipikatValue) {
            const target = dataAset.find(aset => aset.nosertipikat === noSertipikatValue);
            if (target) {
                map.setView([target.lat, target.lon], 18);
                markers.eachLayer(marker => {
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