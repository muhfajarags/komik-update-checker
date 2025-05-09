document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        document.getElementById('initialLoader').style.opacity = '0';
        setTimeout(function () {
            document.getElementById('initialLoader').style.display = 'none';
        }, 500);
    }, 2000);

    fetchLastScan();

    document.getElementById('checkBtn').addEventListener('click', checkUpdates);
    document.getElementById('addMangaBtn').addEventListener('click', addNewManga);

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            const targetId = e.target.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);
            targetPane.classList.remove('slide-up');
            void targetPane.offsetWidth;
            targetPane.classList.add('slide-up');
        });
    });
});

function fetchLastScan() {
    const mangaList = document.getElementById('mangaList');
    mangaList.innerHTML = createLoadingCardsSkeleton();

    fetch('/get_last_scan')
        .then(response => response.json())
        .then(data => {
            if (data.timestamp) {
                updateUI(data);
            } else {
                mangaList.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4>Belum Ada Data Komik</h4>
                        <p>Klik tombol "Periksa Update" untuk memindai komik.</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching last scan:', error);
            mangaList.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h4>Terjadi Kesalahan</h4>
                    <p>Gagal memuat data. Silakan coba lagi.</p>
                </div>
            `;
        });
}

function createLoadingCardsSkeleton() {
    let skeletonHtml = '';
    for (let i = 0; i < 6; i++) {
        skeletonHtml += `
            <div class="col">
                <div class="card h-100" aria-hidden="true">
                    <div class="card-img-top-container">
                        <div class="placeholder-glow" style="height:100%; background:#eee;"></div>
                    </div>
                    <div class="card-body">
                        <h5 class="manga-title placeholder-glow">
                            <span class="placeholder col-7"></span>
                            <span class="placeholder col-4"></span>
                        </h5>
                        <p class="card-text placeholder-glow">
                            <span class="placeholder col-6"></span>
                        </p>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <span class="placeholder btn btn-sm btn-outline-primary disabled col-5"></span>
                        <span class="placeholder btn btn-sm btn-outline-success disabled col-5"></span>
                    </div>
                </div>
            </div>
        `;
    }
    return skeletonHtml;
}

function checkUpdates() {
    const checkBtn = document.getElementById('checkBtn');
    const loading = document.getElementById('loading');
    const mangaList = document.getElementById('mangaList');

    checkBtn.disabled = true;
    checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Memeriksa...';
    loading.classList.remove('d-none');
    mangaList.innerHTML = createLoadingCardsSkeleton();

    fetch('/check_updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setTimeout(() => {
                    updateUI(data);
                    if (data.updates.length > 0) {
                        showUpdateAlert(data.updates.length);
                    }
                }, 1000);
            } else {
                console.error('Error checking updates:', data.error);
                showErrorAlert('Terjadi kesalahan saat memeriksa pembaruan: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorAlert('Terjadi kesalahan: ' + error);
        })
        .finally(() => {
            setTimeout(() => {
                checkBtn.disabled = false;
                checkBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Periksa Update';
                loading.classList.add('d-none');
            }, 1000);
        });
}

function showErrorAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        <strong><i class="fas fa-exclamation-triangle me-2"></i>Error!</strong>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.container').prepend(alert);
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

function addNewManga() {
    const urlInput = document.getElementById('mangaUrl');
    const url = urlInput.value.trim();
    const addMangaBtn = document.getElementById('addMangaBtn');

    if (!url) {
        alert('Silakan masukkan URL komik');
        return;
    }

    if (!url.startsWith('https://komiku.id/manga/')) {
        alert('URL harus dari komiku.id/manga/');
        return;
    }

    addMangaBtn.disabled = true;
    addMangaBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Menambahkan...';

    fetch('/add_manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success alert-dismissible fade show';
                successAlert.setAttribute('role', 'alert');
                successAlert.innerHTML = `
                    <strong><i class="fas fa-check-circle me-2"></i>Berhasil!</strong>
                    Komik berhasil ditambahkan ke daftar pantauan.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                document.querySelector('.container').prepend(successAlert);
                setTimeout(() => {
                    successAlert.classList.remove('show');
                    setTimeout(() => successAlert.remove(), 300);
                }, 3000);
                urlInput.value = '';
                const addModal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
                addModal.hide();
                setTimeout(() => {
                    checkUpdates();
                }, 500);
            } else {
                showErrorAlert('Gagal menambahkan komik atau komik sudah ada dalam daftar.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorAlert('Terjadi kesalahan: ' + error);
        })
        .finally(() => {
            addMangaBtn.disabled = false;
            addMangaBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Tambahkan';
        });
}

function updateUI(data) {
    const timestampInfo = document.getElementById('timestampInfo');
    if (data.timestamp) {
        timestampInfo.classList.add('animate__animated', 'animate__fadeIn');
        timestampInfo.innerHTML = `<i class="fas fa-clock me-2"></i>Pemindaian terakhir: ${data.timestamp}`;
        setTimeout(() => {
            timestampInfo.classList.remove('animate__animated', 'animate__fadeIn');
        }, 1000);
    }

    const mangaList = document.getElementById('mangaList');
    const updateList = document.getElementById('updateList');
    const noUpdates = document.getElementById('noUpdates');
    const updateCount = document.getElementById('updateCount');

    mangaList.innerHTML = '';
    updateList.innerHTML = '';

    updateCount.textContent = data.updates.length;
    if (data.updates.length > 0) {
        updateCount.classList.add('animate__animated', 'animate__heartBeat');
        setTimeout(() => {
            updateCount.classList.remove('animate__animated', 'animate__heartBeat');
        }, 1000);
    }

    noUpdates.classList.toggle('d-none', data.updates.length > 0);

    if (data.all_manga.length === 0) {
        mangaList.innerHTML = `
            <div class="col-12 text-center py-5 fade-in">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4>Tidak Ada Komik</h4>
                <p>Tambahkan komik menggunakan tombol "Tambah Komik".</p>
            </div>
        `;
    } else {
        data.all_manga.forEach((manga, index) => {
            const hasUpdate = data.updates.some(update => update.title === manga.title);
            const card = document.createElement('div');
            card.className = 'col';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            let coverImg = manga.cover || '/static/default_cover.png';
            card.innerHTML = `
                <div class="card h-100">
                    ${hasUpdate ? `<span class="badge bg-danger badge-update">+${data.updates.find(u => u.title === manga.title).new_chapters} Chapter Baru</span>` : ''}
                    <div class="card-img-top-container">
                        <img src="${coverImg}" class="card-img-top" alt="${manga.title}" onerror="this.src='/static/default_cover.png';">
                        <div class="card-img-overlay"></div>
                    </div>
                    <div class="card-body">
                        <h5 class="manga-title">${manga.title}</h5>
                        <p class="card-text"><i class="fas fa-layer-group me-2"></i>Chapter Terbaru: <span class="fw-bold">${manga.latest_chapter}</span></p>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <a href="${manga.manga_url}" class="btn btn-sm btn-outline-primary" target="_blank"><i class="fas fa-info-circle me-1"></i>Detail</a>
                        <a href="${manga.chapter_url}" class="btn btn-sm btn-outline-success" target="_blank"><i class="fas fa-book-reader me-1"></i>Baca Terbaru</a>
                    </div>
                </div>
            `;
            mangaList.appendChild(card);
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);

            if (hasUpdate) {
                const updateData = data.updates.find(u => u.title === manga.title);
                const updateCard = document.createElement('div');
                updateCard.className = 'col';
                updateCard.style.opacity = '0';
                updateCard.style.transform = 'translateY(20px)';
                updateCard.innerHTML = `
                    <div class="card h-100">
                        <span class="badge bg-danger badge-update">+${updateData.new_chapters} Chapter Baru</span>
                        <div class="card-img-top-container">
                            <img src="${coverImg}" class="card-img-top" alt="${manga.title}" onerror="this.src='/static/default_cover.png';">
                            <div class="card-img-overlay"></div>
                        </div>
                        <div class="card-body">
                            <h5 class="manga-title">${manga.title}</h5>
                            <p class="card-text"><i class="fas fa-layer-group me-2"></i>Chapter Terbaru: <span class="fw-bold">${manga.latest_chapter}</span></p>
                            <p class="card-text small text-muted">Tertinggal sejak Chapter ${updateData.last_read_chapter}</p>
                        </div>
                        <div class="card-footer d-flex justify-content-between">
                            <a href="${manga.manga_url}" class="btn btn-sm btn-outline-primary" target="_blank"><i class="fas fa-info-circle me-1"></i>Detail</a>
                            <a href="javascript:void(0)" class="btn btn-sm btn-outline-success" onclick="markAsRead('${manga.title}', ${updateData.first_unread_chapter}, '${updateData.unread_chapter_url}')"><i class="fas fa-book-reader me-1"></i>Lanjutkan Membaca</a>
                        </div>
                    </div>
                `;
                updateList.appendChild(updateCard);
                setTimeout(() => {
                    updateCard.style.transition = 'all 0.5s ease';
                    updateCard.style.opacity = '1';
                    updateCard.style.transform = 'translateY(0)';
                }, 100 * index);
            }
        });
    }
}

function showUpdateAlert(count) {
    const updateAlert = document.getElementById('updateAlert');
    const updateAlertMessage = document.getElementById('updateAlertMessage');
    updateAlertMessage.textContent = ` Ditemukan ${count} komik yang memiliki chapter baru!`;
    updateAlert.classList.add('show', 'animate__animated', 'animate__shakeX');
    setTimeout(() => {
        updateAlert.classList.remove('animate__animated', 'animate__shakeX');
    }, 1000);
    setTimeout(() => {
        updateAlert.classList.remove('show');
        setTimeout(() => {
            updateAlert.classList.remove('animate__animated');
        }, 300);
    }, 5000);
}

function markAsRead(title, chapter, link) {
    fetch('/mark_as_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, chapter: chapter })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`Berhasil menandai "${title}" sebagai dibaca hingga chapter ${chapter}`);
            } else {
                console.error('Error marking as read:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

    window.open(link, '_blank');
}
