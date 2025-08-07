// File: 🧠 dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    
    const DASHBOARD_CONTAINER = document.getElementById('dashboard-container');
    
    // URL CSV data aset utama Anda
    const URL_CSV_ASET_UTAMA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSenU0Fl8Zs2LX-fq1JXcvvKy_KLazQgF8LdWX41uFxb4wTS-aSkaHZDEb0MoTVJMXsAMSDfqUB5E6I/pub?output=csv";
    
    // URL CSV data kronologi Anda yang baru
    const URL_CSV_KRONOLOGI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeBRIWD9ivUUtq8JjEDK8Q3oVEBieaBnSgNfRKoBrKQ9pe_-I4FLWXRrL5ugPcgWEmOVDFdA7vKLSu/pub?output=csv";

    // Fungsi untuk mengambil file CSV
    function fetchCSV(url) {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                complete: results => resolve(results.data),
                error: error => reject(error)
            });
        });
    }

    // Ambil kedua data secara bersamaan
    Promise.all([
        fetchCSV(URL_CSV_ASET_UTAMA),
        fetchCSV(URL_CSV_KRONOLOGI)
    ])
    .then(([dataAset, dataKronologi]) => {
        DASHBOARD_CONTAINER.innerHTML = ''; // Hapus tulisan "Memuat data..."

        // 1. Filter aset yang statusnya 'bermasalah'
        const asetBermasalah = dataAset.filter(aset => 
            aset.statustanah && aset.statustanah.toLowerCase().includes('bermasalah')
        );

        if (asetBermasalah.length === 0) {
            DASHBOARD_CONTAINER.innerHTML = '<h3>Tidak ada data aset bermasalah yang ditemukan.</h3>';
            return;
        }

        // 2. Untuk setiap aset bermasalah, tampilkan datanya dan tabel kronologinya
        asetBermasalah.forEach(aset => {
            const card = document.createElement('div');
            card.className = 'aset-card';

            // Filter data kronologi yang sesuai dengan no sertipikat
            const kronologiTerkait = dataKronologi.filter(k => k.nosertipikat === aset.nosertipikat);
            
            let kronologiHtml = '<tr><td colspan="4">Tidak ada data kronologi.</td></tr>';
            if (kronologiTerkait.length > 0) {
                kronologiHtml = kronologiTerkait.map(k => `
                    <tr>
                        <td>${k.tanggal || '-'}</td>
                        <td>${k.judulkegiatan || '-'}</td>
                        <td>${k.keterangan || '-'}</td>
                        <td>${k.linkdokumen ? `<a href="${k.linkdokumen}" target="_blank">Lihat Dokumen</a>` : '-'}</td>
                    </tr>
                `).join('');
            }
            
            card.innerHTML = `
                <h3>No Sertipikat: ${aset.nosertipikat}</h3>
                <p>
                    <b>Lokasi:</b> ${aset.desa}, ${aset.kabupaten}<br>
                    <b>Jenis Tanah:</b> ${aset.jenistanah}
                </p>
                <h4>Detail Kronologi:</h4>
                <table class="kronologi-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Judul Kegiatan/Dokumen</th>
                            <th>Keterangan</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${kronologiHtml}
                    </tbody>
                </table>
            `;
            DASHBOARD_CONTAINER.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Gagal memuat data:", error);
        DASHBOARD_CONTAINER.innerHTML = '<h3>Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.</h3>';
    });
});