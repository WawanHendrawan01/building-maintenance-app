// Check if user is logged in
function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Redirect ke login page
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Get current user info
const currentUser = checkLogin();

// Handle sidebar toggle
const sidebarToggle = document.getElementById('sidebar-toggle');
const layout = document.querySelector('.layout');
let sidebarCollapsed = false;

sidebarToggle?.addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    if (sidebarCollapsed) {
        layout.classList.add('sidebar-collapsed');
    } else {
        layout.classList.remove('sidebar-collapsed');
    }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
});

// Display user info
if (currentUser) {
    document.getElementById('user-info').textContent = `${currentUser.name} (${currentUser.role.toUpperCase()})`;
    document.getElementById('logout-btn').style.display = 'block';
}

// Handle section navigation
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

// Data storage
let dailyReports = [];
let monthlyReports = [];
let trainingRecords = [];
let projects = [];
let attendanceSchedules = [];
let maintenanceSchedules = [];
// For import preview
let __utility_parsed = null;

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Jika ini dropdown toggle, jangan lanjut ke section
        if (item.classList.contains('dropdown-toggle')) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(item);
            return;
        }

        e.preventDefault();
        
        // Hapus class active dari semua nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Tambah class active ke nav item yang diklik
        item.classList.add('active');
        
        // Hapus class active dari semua sections
        sections.forEach(section => section.classList.remove('active'));
        
        // Tampilkan section yang sesuai
        const sectionId = item.getAttribute('href').substring(1);
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});

// Handle dropdown toggle
function toggleDropdown(element) {
    const key = element.getAttribute('data-toggle');
    if (!key) return;

    // coba dua kemungkinan id: key + '-menu' atau key
    const idsToTry = [key + '-menu', key];
    let submenu = null;
    
    for (const id of idsToTry) {
        const found = document.getElementById(id);
        if (found) {
            submenu = found;
            break;
        }
    }
    
    if (!submenu) return;
    
    // Toggle show class
    if (submenu.classList.contains('show')) {
        submenu.classList.remove('show');
    } else {
        // Close other siblings first
        const parent = submenu.parentElement;
        if (parent) {
            const siblings = parent.querySelectorAll('.submenu.show');
            siblings.forEach(sibling => {
                if (sibling !== submenu) {
                    sibling.classList.remove('show');
                }
            });
        }
        submenu.classList.add('show');
    }
}

// Handle submenu items
const submenuItems = document.querySelectorAll('.submenu .nav-item');
submenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Hapus class active dari semua nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        submenuItems.forEach(nav => nav.classList.remove('active'));
        
        // Tambah class active ke item yang diklik
        item.classList.add('active');
        
        // Hapus class active dari semua sections
        sections.forEach(section => section.classList.remove('active'));
        
        // Tampilkan section yang sesuai
        const sectionId = item.getAttribute('href').substring(1);
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});

// Update dashboard summary
function updateDashboardSummary() {
    const elTotalDaily = document.getElementById('total-daily');
    if (elTotalDaily) elTotalDaily.textContent = (Array.isArray(dailyReports) ? dailyReports.length : 0);

    const elTotalMonthly = document.getElementById('total-monthly');
    if (elTotalMonthly) elTotalMonthly.textContent = (Array.isArray(monthlyReports) ? monthlyReports.length : 0);

    const elTotalTraining = document.getElementById('total-training');
    if (elTotalTraining) {
        const manualCount = (typeof trainingManualRecords !== 'undefined' && Array.isArray(trainingManualRecords)) ? trainingManualRecords.length : (Array.isArray(trainingRecords) ? trainingRecords.length : 0);
        elTotalTraining.textContent = manualCount;
    }

    const elTotalProjects = document.getElementById('total-projects');
    if (elTotalProjects) {
        const projCount = (typeof projectRecords !== 'undefined' && Array.isArray(projectRecords)) ? projectRecords.length : (Array.isArray(projects) ? projects.length : 0);
        elTotalProjects.textContent = projCount;
    }
}

// Add Daily Report (untuk Utility, Water Heater, etc)
function addDailyReport(type, data) {
    dailyReports.push({
        id: Date.now(),
        type: type,
        date: new Date().toISOString().split('T')[0],
        data: data,
        timestamp: new Date()
    });
    updateDashboardSummary();
}

// Add Monthly Report
function addMonthlyReport(data) {
    monthlyReports.push({
        id: Date.now(),
        data: data,
        timestamp: new Date()
    });
    updateDashboardSummary();
}

// Add Training Record
function addTrainingRecord(data) {
    trainingRecords.push({
        id: Date.now(),
        data: data,
        timestamp: new Date()
    });
    updateDashboardSummary();
}

// Add Project
function addProject(data) {
    projects.push({
        id: Date.now(),
        data: data,
        timestamp: new Date()
    });
    updateDashboardSummary();
}

// Set home as active on page load
window.addEventListener('DOMContentLoaded', () => {
    // Set Home as active
    const homeLink = document.querySelector('a[href="#home"]');
    if (homeLink) {
        homeLink.classList.add('active');
    }
    // Load sample data only if empty
    if (dailyReports.length === 0 && monthlyReports.length === 0 && trainingRecords.length === 0 && projects.length === 0) {
        loadSampleData();
    }
    // Load persisted utility reports if any
    const stored = localStorage.getItem('daily_utility_reports');
    if (stored) {
        try {
            const arr = JSON.parse(stored);
            arr.forEach(it => {
                dailyReports.push({ id: it.id || Date.now(), type: 'Utility', date: it.date || (new Date()).toISOString().split('T')[0], data: it.data || it, timestamp: new Date(it.timestamp || Date.now()) });
            });
        } catch (e) {
            console.warn('Failed to parse stored utility reports', e);
        }
    }
    updateDashboardSummary();
    // Wire up all section initializers
    try {
        initUtilityImportUI();
        initAttendanceScheduleUI();
        initMaintenanceScheduleUI();
        initTrainingScheduleUI();
        initDailyOverviewUI();
        // Re-render all manual section summaries/histories
        renderUtilityServerSummary();
        renderUtilityServerHistory();
        renderUtilityPumpSummary();
        renderUtilityPumpHistory();
        renderLobbySummary();
        renderLobbyHistory();
        renderKitchenSummary();
        renderKitchenHistory();
        renderRooftopSummary();
        renderRooftopHistory();
        renderLiftRoomSummary();
        renderLiftRoomHistory();
        renderLvmdpSummary();
        renderLvmdpHistory();
        renderSwimmingPoolSummary();
        renderSwimmingPoolHistory();
        renderPumpRoomSummary();
        renderPumpRoomHistory();
        renderProjectTable();
        renderProjectHistory();
        renderTrainingTable();
        renderTrainingHistory();
    } catch (e) {
        console.warn('UI init error', e);
    }
});

// Initialize Utility import UI
function initUtilityImportUI() {
    const fileInput = document.getElementById('utility-file');
    const previewBtn = document.getElementById('utility-preview-btn');
    const importBtn = document.getElementById('utility-import-btn');
    const previewDiv = document.getElementById('utility-preview');
    const previewTable = document.getElementById('utility-preview-table');

    if (!fileInput || !previewBtn || !importBtn || !previewDiv) return;

    previewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Pilih file Excel/CSV terlebih dahulu.');
            return;
        }
        const file = fileInput.files[0];
        readWorkbookFromFile(file, (json) => {
            __utility_parsed = json;
            renderUtilityPreview(json, previewTable);
            previewDiv.style.display = 'block';
            importBtn.disabled = false;
        }, (err) => {
            console.error(err);
            alert('Gagal membaca file. Pastikan format xlsx/xls/csv benar.');
        });
    });

    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!__utility_parsed || !Array.isArray(__utility_parsed) || __utility_parsed.length === 0) {
            alert('Tidak ada data untuk diimport. Lakukan preview terlebih dahulu.');
            return;
        }
        const mapped = mapUtilityRows(__utility_parsed);
        // merge with existing stored
        const existing = JSON.parse(localStorage.getItem('daily_utility_reports') || '[]');
        const toStore = existing.concat(mapped.map(m => ({ id: m.id, date: m.date, data: m.data, timestamp: m.timestamp })));
        localStorage.setItem('daily_utility_reports', JSON.stringify(toStore));

        // add to in-memory dailyReports
        mapped.forEach(m => dailyReports.push({ id: m.id, type: 'Utility', date: m.date, data: m.data, timestamp: new Date(m.timestamp) }));
        updateDashboardSummary();
        alert('Import berhasil: ' + mapped.length + ' baris ditambahkan.');
        importBtn.disabled = true;
    });
}

// Initialize Attendance Schedule import UI
function initAttendanceScheduleUI() {
    const nameInput = document.getElementById('attendance-name');
    const dateInput = document.getElementById('attendance-date');
    const shiftInput = document.getElementById('attendance-shift');
    const statusInput = document.getElementById('attendance-status');
    const notesInput = document.getElementById('attendance-notes');
    const submitBtn = document.getElementById('attendance-submit-btn');
    const searchInput = document.getElementById('attendance-search');
    const tbody = document.getElementById('attendance-tbody');
    const historyTbody = document.getElementById('attendance-history-tbody');
    const exportBtn = document.getElementById('attendance-export-btn');

    // Set today's date as default
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Load existing attendance schedules
    loadAttendanceSchedules();

    // Handle export PDF
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportAttendanceToPDF();
        });
    }

    // Handle manual input
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!nameInput.value.trim()) {
                alert('Nama karyawan harus diisi!');
                return;
            }
            if (!dateInput.value) {
                alert('Tanggal harus diisi!');
                return;
            }
            if (!shiftInput.value) {
                alert('Shift harus dipilih!');
                return;
            }
            if (!statusInput.value) {
                alert('Status kehadiran harus dipilih!');
                return;
            }

            const newAttendance = {
                id: Date.now(),
                name: nameInput.value.trim(),
                date: dateInput.value,
                shift: shiftInput.value,
                status: statusInput.value,
                notes: notesInput.value.trim(),
                timestamp: new Date().toISOString()
            };

            attendanceSchedules.push(newAttendance);
            localStorage.setItem('attendance_schedules', JSON.stringify(attendanceSchedules));
            
            // Clear form
            nameInput.value = '';
            shiftInput.value = '';
            statusInput.value = '';
            notesInput.value = '';
            dateInput.valueAsDate = new Date();
            
            alert('Absensi berhasil disimpan!');
            displayAttendanceTableByPeriod(tbody, 'today');
            displayAttendanceHistory(historyTbody);
        });
    }

    // Handle search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            displayAttendanceHistory(historyTbody, query);
        });
    }
}

// Load attendance schedules from localStorage
function loadAttendanceSchedules() {
    const stored = localStorage.getItem('attendance_schedules');
    if (stored) {
        try {
            attendanceSchedules = JSON.parse(stored);
        } catch (e) {
            console.warn('Failed to parse stored attendance schedules', e);
            attendanceSchedules = [];
        }
    }
    const tbody = document.getElementById('attendance-tbody');
    const historyTbody = document.getElementById('attendance-history-tbody');
    if (tbody) displayAttendanceTableByPeriod(tbody, 'today');
    if (historyTbody) displayAttendanceHistory(historyTbody);
}

// Filter attendance by period
let attendanceCurrentPeriod = 'today';

function filterAttendanceByPeriod(period) {
    const tbody = document.getElementById('attendance-tbody');
    displayAttendanceTableByPeriod(tbody, period);
}

function filterAttendanceBySelect() {
    const select = document.getElementById('attendance-period-select');
    if (!select) return;
    const period = select.value;
    filterAttendanceByPeriod(period);
}

function filterAttendanceByCustomDate() {
    const customDate = document.getElementById('attendance-custom-date').value;
    if (!customDate) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    const tbody = document.getElementById('attendance-tbody');
    displayAttendanceTableByDate(tbody, customDate);
}

// Display attendance by period
function displayAttendanceTableByPeriod(tbody, period = 'today') {
    if (!tbody) return;
    
    const today = new Date();
    let filteredData = [];
    
    if (period === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        filteredData = attendanceSchedules.filter(item => item.date === todayStr);
    } else if (period === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredData = attendanceSchedules.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= weekStart && itemDate <= weekEnd;
        });
    } else if (period === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        filteredData = attendanceSchedules.filter(item => item.date >= monthStart && item.date <= monthEnd);
    } else if (period === 'year') {
        const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const yearEnd = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        filteredData = attendanceSchedules.filter(item => item.date >= yearStart && item.date <= yearEnd);
    }
    
    displayAttendanceTableRender(tbody, filteredData);
}

// Display attendance by specific date
function displayAttendanceTableByDate(tbody, date) {
    if (!tbody) return;
    const filteredData = attendanceSchedules.filter(item => item.date === date);
    displayAttendanceTableRender(tbody, filteredData);
}

// Render attendance table
function displayAttendanceTableRender(tbody, data) {
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">Tidak ada data untuk periode ini.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    data.forEach((item, index) => {
        const statusColor = item.status === 'Hadir' ? '#28a745' : 
                           item.status === 'Cuti' ? '#ffc107' : 
                           item.status === 'Sakit' ? '#dc3545' :
                           item.status === 'Izin' ? '#17a2b8' : '#6c757d';
        
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        row.innerHTML = `
            <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.date}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.shift}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">
                <span style="color: ${statusColor}; font-weight: 600; background-color: ${statusColor}20; padding: 4px 8px; border-radius: 4px;">
                    ${item.status}
                </span>
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.notes || '-'}</td>
            <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                <button class="btn btn-small" onclick="deleteAttendanceSchedule(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Export attendance to PDF
function exportAttendanceToPDF() {
    const filteredData = attendanceSchedules;
    if (filteredData.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    // Create HTML table for PDF
    let html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center; color: #667eea;">Laporan Absensi Karyawan</h1>
            <p style="text-align: center; color: #666;">Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #667eea; color: white;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">No</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Nama</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Tanggal</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Shift</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Status</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    filteredData.forEach((item, index) => {
        html += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.shift}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.status}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.notes || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = html;
    
    const opt = {
        margin: 10,
        filename: 'Laporan_Absensi_' + new Date().getTime() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// Display attendance history as table
function displayAttendanceHistory(tbody, searchQuery = '') {
    if (!tbody) return;
    
    let filteredData = attendanceSchedules;
    if (searchQuery) {
        filteredData = attendanceSchedules.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchQuery);
            const dateMatch = item.date.includes(searchQuery);
            return nameMatch || dateMatch;
        });
    }
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">Tidak ada data.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    filteredData.forEach((item, index) => {
        const statusColor = item.status === 'Hadir' ? '#28a745' : 
                           item.status === 'Cuti' ? '#ffc107' : 
                           item.status === 'Sakit' ? '#dc3545' :
                           item.status === 'Izin' ? '#17a2b8' : '#6c757d';
        
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        row.innerHTML = `
            <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.date}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.shift}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">
                <span style="color: ${statusColor}; font-weight: 600; background-color: ${statusColor}20; padding: 4px 8px; border-radius: 4px;">
                    ${item.status}
                </span>
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.notes || '-'}</td>
            <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                <button class="btn btn-small" onclick="deleteAttendanceSchedule(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Delete attendance schedule
function deleteAttendanceSchedule(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        attendanceSchedules = attendanceSchedules.filter(s => s.id !== id);
        localStorage.setItem('attendance_schedules', JSON.stringify(attendanceSchedules));
        const tbody = document.getElementById('attendance-tbody');
        const historyTbody = document.getElementById('attendance-history-tbody');
        if (tbody) displayAttendanceTableByPeriod(tbody, 'today');
        if (historyTbody) displayAttendanceHistory(historyTbody);
    }
}

// Initialize Maintenance Schedule import UI
function initMaintenanceScheduleUI() {
    const dateInput = document.getElementById('maintenance-date');
    const activityInput = document.getElementById('maintenance-activity');
    const picInput = document.getElementById('maintenance-pic');
    const statusInput = document.getElementById('maintenance-status');
    const notesInput = document.getElementById('maintenance-notes');
    const submitBtn = document.getElementById('maintenance-submit-btn');
    const searchInput = document.getElementById('maintenance-search');
    const tbody = document.getElementById('maintenance-tbody');
    const historyTbody = document.getElementById('maintenance-history-tbody');
    const exportBtn = document.getElementById('maintenance-export-btn');

    // Set today's date as default
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Load existing maintenance schedules
    loadMaintenanceSchedules();

    // Handle export PDF
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportMaintenanceToPDF();
        });
    }

    // Handle manual input
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!dateInput.value) {
                alert('Tanggal harus diisi!');
                return;
            }
            if (!activityInput.value.trim()) {
                alert('Aktivitas harus diisi!');
                return;
            }
            if (!picInput.value.trim()) {
                alert('PIC harus diisi!');
                return;
            }
            if (!statusInput.value) {
                alert('Status harus dipilih!');
                return;
            }

            const newMaintenance = {
                id: Date.now(),
                date: dateInput.value,
                activity: activityInput.value.trim(),
                pic: picInput.value.trim(),
                status: statusInput.value,
                notes: notesInput.value.trim(),
                timestamp: new Date().toISOString()
            };

            maintenanceSchedules.push(newMaintenance);
            localStorage.setItem('maintenance_schedules', JSON.stringify(maintenanceSchedules));
            
            // Clear form
            dateInput.valueAsDate = new Date();
            activityInput.value = '';
            picInput.value = '';
            statusInput.value = '';
            notesInput.value = '';
            
            alert('Maintenance berhasil disimpan!');
            displayMaintenanceTable(tbody);
            displayMaintenanceHistory(historyTbody);
        });
    }

    // Handle search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            displayMaintenanceHistory(historyTbody, query);
        });
    }
}

// Filter maintenance by period
function filterMaintenanceByPeriod(period) {
    const tbody = document.getElementById('maintenance-tbody');
    displayMaintenanceTableByPeriod(tbody, period);
}

function filterMaintenanceBySelect() {
    const select = document.getElementById('maintenance-period-select');
    if (!select) return;
    const period = select.value;
    filterMaintenanceByPeriod(period);
}

function filterMaintenanceByCustomDate() {
    const customDate = document.getElementById('maintenance-custom-date').value;
    if (!customDate) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    const tbody = document.getElementById('maintenance-tbody');
    displayMaintenanceTableByDate(tbody, customDate);
}

// Display maintenance by period
function displayMaintenanceTableByPeriod(tbody, period = 'today') {
    if (!tbody) return;
    
    const today = new Date();
    let filteredData = [];
    
    if (period === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        filteredData = maintenanceSchedules.filter(item => item.date === todayStr);
    } else if (period === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredData = maintenanceSchedules.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= weekStart && itemDate <= weekEnd;
        });
    } else if (period === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        filteredData = maintenanceSchedules.filter(item => item.date >= monthStart && item.date <= monthEnd);
    } else if (period === 'year') {
        const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        const yearEnd = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        filteredData = maintenanceSchedules.filter(item => item.date >= yearStart && item.date <= yearEnd);
    }
    
    displayMaintenanceTableRender(tbody, filteredData);
}

// Display maintenance by specific date
function displayMaintenanceTableByDate(tbody, date) {
    if (!tbody) return;
    const filteredData = maintenanceSchedules.filter(item => item.date === date);
    displayMaintenanceTableRender(tbody, filteredData);
}

// Render maintenance table
function displayMaintenanceTableRender(tbody, data) {
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">Tidak ada data untuk periode ini.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    data.forEach((item, index) => {
        const statusColor = item.status === 'Selesai' ? '#28a745' : 
                           item.status === 'Ongoing' ? '#007bff' : 
                           item.status === 'Scheduled' ? '#ffc107' : '#6c757d';
        
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        row.innerHTML = `
            <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.date}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.activity}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.pic}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">
                <span style="color: ${statusColor}; font-weight: 600; background-color: ${statusColor}20; padding: 4px 8px; border-radius: 4px;">
                    ${item.status}
                </span>
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.notes || '-'}</td>
            <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                <button class="btn btn-small" onclick="deleteMaintenanceSchedule(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display maintenance history as table
function displayMaintenanceHistory(tbody, searchQuery = '') {
    if (!tbody) return;
    
    let filteredData = maintenanceSchedules;
    if (searchQuery) {
        filteredData = maintenanceSchedules.filter(item => {
            const activityMatch = item.activity.toLowerCase().includes(searchQuery);
            const dateMatch = item.date.includes(searchQuery);
            return activityMatch || dateMatch;
        });
    }
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">Tidak ada data.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    filteredData.forEach((item, index) => {
        const statusColor = item.status === 'Selesai' ? '#28a745' : 
                           item.status === 'Ongoing' ? '#007bff' : 
                           item.status === 'Scheduled' ? '#ffc107' : '#6c757d';
        
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        row.innerHTML = `
            <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.date}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.activity}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.pic}</td>
            <td style="padding: 12px; border: 1px solid #ddd;">
                <span style="color: ${statusColor}; font-weight: 600; background-color: ${statusColor}20; padding: 4px 8px; border-radius: 4px;">
                    ${item.status}
                </span>
            </td>
            <td style="padding: 12px; border: 1px solid #ddd;">${item.notes || '-'}</td>
            <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                <button class="btn btn-small" onclick="deleteMaintenanceSchedule(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Delete maintenance schedule
function deleteMaintenanceSchedule(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        maintenanceSchedules = maintenanceSchedules.filter(s => s.id !== id);
        localStorage.setItem('maintenance_schedules', JSON.stringify(maintenanceSchedules));
        const tbody = document.getElementById('maintenance-tbody');
        const historyTbody = document.getElementById('maintenance-history-tbody');
        if (tbody) displayMaintenanceTableByPeriod(tbody, 'today');
        if (historyTbody) displayMaintenanceHistory(historyTbody);
    }
}

// Load maintenance schedules from localStorage
function loadMaintenanceSchedules() {
    const stored = localStorage.getItem('maintenance_schedules');
    if (stored) {
        try {
            maintenanceSchedules = JSON.parse(stored);
        } catch (e) {
            console.warn('Failed to parse stored maintenance schedules', e);
            maintenanceSchedules = [];
        }
    }
    const tbody = document.getElementById('maintenance-tbody');
    const historyTbody = document.getElementById('maintenance-history-tbody');
    if (tbody) displayMaintenanceTableByPeriod(tbody, 'today');
    if (historyTbody) displayMaintenanceHistory(historyTbody);
}

// Initialize Training Schedule UI
function initTrainingScheduleUI() {
    const nameInput = document.getElementById('training-name');
    const dateInput = document.getElementById('training-date');
    const durationInput = document.getElementById('training-duration');
    const picInput = document.getElementById('training-pic');
    const statusInput = document.getElementById('training-status');
    const notesInput = document.getElementById('training-notes');
    const submitBtn = document.getElementById('training-submit-btn');
    const searchInput = document.getElementById('training-search');
    const tbody = document.getElementById('training-tbody');
    const historyTbody = document.getElementById('training-history-tbody');
    const periodSelect = document.getElementById('training-period-select');

    // Set today's date as default
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Load existing training schedules
    let trainingSchedules = JSON.parse(localStorage.getItem('training_schedule_records') || '[]');

    function loadTrainingSchedules() {
        const stored = localStorage.getItem('training_schedule_records');
        if (stored) {
            try {
                trainingSchedules = JSON.parse(stored);
            } catch (e) {
                console.warn('Failed to parse stored training schedules', e);
                trainingSchedules = [];
            }
        }
        if (tbody) displayTrainingTableByPeriod(tbody, 'today');
        if (historyTbody) displayTrainingHistory(historyTbody);
    }

    function displayTrainingTableByPeriod(tbody, period = 'today') {
        if (!tbody) return;
        
        const today = new Date();
        let filteredData = [];
        
        if (period === 'today') {
            const todayStr = today.toISOString().split('T')[0];
            filteredData = trainingSchedules.filter(item => item.date === todayStr);
        } else if (period === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            filteredData = trainingSchedules.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= weekStart && itemDate <= weekEnd;
            });
        } else if (period === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
            filteredData = trainingSchedules.filter(item => item.date >= monthStart && item.date <= monthEnd);
        } else if (period === 'year') {
            const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            const yearEnd = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
            filteredData = trainingSchedules.filter(item => item.date >= yearStart && item.date <= yearEnd);
        }
        
        displayTrainingTableRender(tbody, filteredData);
    }

    function displayTrainingTableRender(tbody, data) {
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">Tidak ada data untuk periode ini.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #ddd';
            row.innerHTML = `
                <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.date}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.duration}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.pic}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.status}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                    <button class="btn btn-small" onclick="deleteTrainingSchedule(${item.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function displayTrainingHistory(tbody, searchQuery = '') {
        if (!tbody) return;
        
        let filteredData = trainingSchedules;
        if (searchQuery) {
            filteredData = trainingSchedules.filter(item => {
                const nameMatch = item.name.toLowerCase().includes(searchQuery);
                const dateMatch = item.date.includes(searchQuery);
                return nameMatch || dateMatch;
            });
        }
        
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #999;">Tidak ada data.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        filteredData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #ddd';
            row.innerHTML = `
                <td style="padding: 12px; border: 1px solid #ddd;">${index + 1}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.date}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.duration}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.pic}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.status}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                    <button class="btn btn-small" onclick="deleteTrainingSchedule(${item.id})">Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    loadTrainingSchedules();

    // Handle manual input
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!nameInput.value.trim()) {
                alert('Nama training harus diisi!');
                return;
            }
            if (!dateInput.value) {
                alert('Tanggal harus diisi!');
                return;
            }
            if (!picInput.value.trim()) {
                alert('PIC harus diisi!');
                return;
            }
            if (!statusInput.value) {
                alert('Status harus dipilih!');
                return;
            }

            const newTraining = {
                id: Date.now(),
                name: nameInput.value.trim(),
                date: dateInput.value,
                duration: durationInput.value.trim(),
                pic: picInput.value.trim(),
                status: statusInput.value,
                notes: notesInput.value.trim(),
                timestamp: new Date().toISOString()
            };

            trainingSchedules.push(newTraining);
            localStorage.setItem('training_schedule_records', JSON.stringify(trainingSchedules));
            
            // Clear form
            nameInput.value = '';
            dateInput.valueAsDate = new Date();
            durationInput.value = '';
            picInput.value = '';
            statusInput.value = '';
            notesInput.value = '';
            
            alert('Training berhasil disimpan!');
            displayTrainingTableByPeriod(tbody, 'today');
            displayTrainingHistory(historyTbody);
        });
    }

    // Handle search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            displayTrainingHistory(historyTbody, query);
        });
    }

    // Handle period filter
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            displayTrainingTableByPeriod(tbody, e.target.value);
        });
    }
}

// Delete training schedule
function deleteTrainingSchedule(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        let trainingSchedules = JSON.parse(localStorage.getItem('training_schedule_records') || '[]');
        trainingSchedules = trainingSchedules.filter(s => s.id !== id);
        localStorage.setItem('training_schedule_records', JSON.stringify(trainingSchedules));
        const tbody = document.getElementById('training-tbody');
        const historyTbody = document.getElementById('training-history-tbody');
        if (tbody) location.reload();
        if (historyTbody) location.reload();
    }
}

// Initialize Daily Overview UI
function initDailyOverviewUI() {
    const historyBtn = document.getElementById('daily-overview-history-btn');
    const historySection = document.getElementById('daily-overview-history-section');
    
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            if (historySection.style.display === 'none' || !historySection.style.display) {
                historySection.style.display = 'block';
                historyBtn.textContent = '📊 Hide History';
            } else {
                historySection.style.display = 'none';
                historyBtn.textContent = '📋 History';
            }
        });
    }
}

// Export maintenance to PDF
function exportMaintenanceToPDF() {
    const filteredData = maintenanceSchedules;
    if (filteredData.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    // Create HTML table for PDF
    let html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center; color: #667eea;">Laporan Schedule Maintenance</h1>
            <p style="text-align: center; color: #666;">Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #667eea; color: white;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">No</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Tanggal</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Aktivitas</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">PIC</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Status</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    filteredData.forEach((item, index) => {
        html += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.activity}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.pic}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.status}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.notes || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = html;
    
    const opt = {
        margin: 10,
        filename: 'Laporan_Maintenance_' + new Date().getTime() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// Read workbook from file using SheetJS
function readWorkbookFromFile(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const sheet = workbook.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            onSuccess(json);
        } catch (err) {
            onError(err);
        }
    };
    reader.onerror = function(err) { onError(err); };
    reader.readAsArrayBuffer(file);
}

// Render preview: first 5 rows
function renderUtilityPreview(json, container) {
    container.innerHTML = '';
    if (!json || json.length === 0) {
        container.innerHTML = '<div>Tidak ada data.</div>';
        return;
    }
    const cols = Object.keys(json[0]);
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    cols.forEach(c => { const th = document.createElement('th'); th.textContent = c; trh.appendChild(th); });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    json.slice(0,5).forEach(row => {
        const tr = document.createElement('tr');
        cols.forEach(c => { const td = document.createElement('td'); td.textContent = row[c]; tr.appendChild(td); });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

// Map rows to internal structure
function mapUtilityRows(json) {
    if (!json || json.length === 0) return [];
    const headers = Object.keys(json[0]);
    // detect columns
    function findKey(regex) {
        const re = new RegExp(regex, 'i');
        return headers.find(h => re.test(h));
    }
    const dateKey = findKey('^date$|tanggal');
    const shiftKey = findKey('shift');
    const inspectorKey = findKey('inspector|nama');
    const notesKey = findKey('note|catatan|remark');

    const checklistKeys = headers.filter(h => [dateKey, shiftKey, inspectorKey, notesKey].indexOf(h) === -1);

    const mapped = json.map(row => {
        const id = Date.now() + Math.floor(Math.random()*1000);
        const dateVal = dateKey ? row[dateKey] : (new Date()).toISOString().split('T')[0];
        const dataObj = {
            shift: shiftKey ? row[shiftKey] : '',
            inspector: inspectorKey ? row[inspectorKey] : (currentUser ? currentUser.name : 'Unknown'),
            notes: notesKey ? row[notesKey] : '',
            items: checklistKeys.map(k => ({ label: k, value: row[k] }))
        };
        return { id, date: dateVal, data: dataObj, timestamp: new Date().toISOString() };
    });
    return mapped;
}

// Load sample data
function loadSampleData() {
    // Sample daily reports
    dailyReports = [
        { id: 1, type: 'Utility', date: '2025-12-01', timestamp: new Date() },
        { id: 2, type: 'Water Heater', date: '2025-12-02', timestamp: new Date() },
        { id: 3, type: 'Genset Area', date: '2025-12-03', timestamp: new Date() }
    ];
    
    // Sample monthly reports
    monthlyReports = [
        { id: 1, data: 'November Report', timestamp: new Date() },
        { id: 2, data: 'October Report', timestamp: new Date() }
    ];
    
    // Sample training records
    trainingRecords = [
        { id: 1, data: 'Safety Training', timestamp: new Date() },
        { id: 2, data: 'Equipment Training', timestamp: new Date() }
    ];
    
    // Sample projects
    projects = [
        { id: 1, data: 'Upgrade System A', timestamp: new Date() },
        { id: 2, data: 'Maintenance Project', timestamp: new Date() },
        { id: 3, data: 'Installation Project', timestamp: new Date() }
    ];
}

// --- DAILY SECTION LOGIC ---
// Utility - Server Room
let utilityServerReports = JSON.parse(localStorage.getItem('utility_server_reports') || '[]');
function saveUtilityServerReport() {
    const date = document.getElementById('utility-server-date').value;
    const condition = document.getElementById('utility-server-condition').value;
    const clean = document.getElementById('utility-server-clean').value;
    const notes = document.getElementById('utility-server-notes').value;
    if (!date || !condition || !clean) { alert('Semua field wajib diisi!'); return; }
    utilityServerReports.push({ id: Date.now(), date, condition, clean, notes });
    localStorage.setItem('utility_server_reports', JSON.stringify(utilityServerReports));
    renderUtilityServerSummary();
    renderUtilityServerHistory();
    document.getElementById('utility-server-date').value = '';
    document.getElementById('utility-server-condition').value = '';
    document.getElementById('utility-server-clean').value = '';
    document.getElementById('utility-server-notes').value = '';
}
function renderUtilityServerSummary() {
    document.getElementById('utility-server-summary').textContent = utilityServerReports.length;
}
function renderUtilityServerHistory(query = '') {
    const tbody = document.querySelector('#utility-server-history-table tbody');
    let data = utilityServerReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.condition}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-server-submit')?.addEventListener('click', saveUtilityServerReport);
document.getElementById('utility-server-history-search')?.addEventListener('input', e => renderUtilityServerHistory(e.target.value));
renderUtilityServerSummary();
renderUtilityServerHistory();

// Utility - Stand Meter
let utilityStandMeterReports = JSON.parse(localStorage.getItem('utility_stand_meter_reports') || '[]');
function saveUtilityStandMeterReport() {
    const date = document.getElementById('utility-stand-meter-date').value;
    const reading = document.getElementById('utility-stand-meter-reading').value;
    const condition = document.getElementById('utility-stand-meter-condition').value;
    const notes = document.getElementById('utility-stand-meter-notes').value;
    if (!date || !reading || !condition) { alert('Semua field wajib diisi!'); return; }
    utilityStandMeterReports.push({ id: Date.now(), date, reading: parseFloat(reading), condition, notes });
    localStorage.setItem('utility_stand_meter_reports', JSON.stringify(utilityStandMeterReports));
    renderUtilityStandMeterSummary();
    renderUtilityStandMeterHistory();
    document.getElementById('utility-stand-meter-date').value = '';
    document.getElementById('utility-stand-meter-reading').value = '';
    document.getElementById('utility-stand-meter-condition').value = '';
    document.getElementById('utility-stand-meter-notes').value = '';
}
function renderUtilityStandMeterSummary() {
    document.getElementById('utility-stand-meter-summary').textContent = utilityStandMeterReports.length;
}
function renderUtilityStandMeterHistory(query = '') {
    const tbody = document.querySelector('#utility-stand-meter-history-table tbody');
    let data = utilityStandMeterReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.reading.toFixed(2)}</td><td>${r.condition}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-stand-meter-submit')?.addEventListener('click', saveUtilityStandMeterReport);
document.getElementById('utility-stand-meter-search')?.addEventListener('input', e => renderUtilityStandMeterHistory(e.target.value));
renderUtilityStandMeterSummary();
renderUtilityStandMeterHistory();

// Utility - Pump Room
let utilityPumpReports = JSON.parse(localStorage.getItem('utility_pump_reports') || '[]');
function saveUtilityPumpReport() {
    const date = document.getElementById('utility-pump-date').value;
    const condition = document.getElementById('utility-pump-condition').value;
    const clean = document.getElementById('utility-pump-clean').value;
    const notes = document.getElementById('utility-pump-notes').value;
    if (!date || !condition || !clean) { alert('Semua field wajib diisi!'); return; }
    utilityPumpReports.push({ id: Date.now(), date, condition, clean, notes });
    localStorage.setItem('utility_pump_reports', JSON.stringify(utilityPumpReports));
    renderUtilityPumpSummary();
    renderUtilityPumpHistory();
    document.getElementById('utility-pump-date').value = '';
    document.getElementById('utility-pump-condition').value = '';
    document.getElementById('utility-pump-clean').value = '';
    document.getElementById('utility-pump-notes').value = '';
}
function renderUtilityPumpSummary() {
    document.getElementById('utility-pump-summary').textContent = utilityPumpReports.length;
}
function renderUtilityPumpHistory(query = '') {
    const tbody = document.querySelector('#utility-pump-history-table tbody');
    let data = utilityPumpReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.condition}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-pump-submit')?.addEventListener('click', saveUtilityPumpReport);
document.getElementById('utility-pump-history-search')?.addEventListener('input', e => renderUtilityPumpHistory(e.target.value));
renderUtilityPumpSummary();
renderUtilityPumpHistory();

// Utility - Public Area
let utilityPublicAreaReports = JSON.parse(localStorage.getItem('utility_public_area_reports') || '[]');
function saveUtilityPublicAreaReport() {
    const date = document.getElementById('utility-public-date').value;
    const water = document.getElementById('utility-public-water').value;
    const lighting = document.getElementById('utility-public-lighting').value;
    const cleanliness = document.getElementById('utility-public-cleanliness').value;
    const notes = document.getElementById('utility-public-notes').value;
    if (!date || !water || !lighting || !cleanliness) { alert('Semua field wajib diisi!'); return; }
    utilityPublicAreaReports.push({ id: Date.now(), date, water: parseFloat(water), lighting, cleanliness, notes });
    localStorage.setItem('utility_public_area_reports', JSON.stringify(utilityPublicAreaReports));
    renderUtilityPublicAreaSummary();
    renderUtilityPublicAreaHistory();
    document.getElementById('utility-public-date').value = '';
    document.getElementById('utility-public-water').value = '';
    document.getElementById('utility-public-lighting').value = '';
    document.getElementById('utility-public-cleanliness').value = '';
    document.getElementById('utility-public-notes').value = '';
}
function renderUtilityPublicAreaSummary() {
    document.getElementById('utility-public-summary').textContent = utilityPublicAreaReports.length;
}
function renderUtilityPublicAreaHistory(query = '') {
    const tbody = document.querySelector('#utility-public-history-table tbody');
    let data = utilityPublicAreaReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.lighting.toLowerCase().includes(query.toLowerCase()) || r.cleanliness.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.water.toFixed(1)}</td><td>${r.lighting}</td><td>${r.cleanliness}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-public-submit')?.addEventListener('click', saveUtilityPublicAreaReport);
document.getElementById('utility-public-history-search')?.addEventListener('input', e => renderUtilityPublicAreaHistory(e.target.value));
renderUtilityPublicAreaSummary();
renderUtilityPublicAreaHistory();

// Utility - BOH
let utilityBohReports = JSON.parse(localStorage.getItem('utility_boh_reports') || '[]');
function saveUtilityBohReport() {
    const date = document.getElementById('utility-boh-date').value;
    const ac = document.getElementById('utility-boh-ac').value;
    const tank = document.getElementById('utility-boh-tank').value;
    const panel = document.getElementById('utility-boh-panel').value;
    const notes = document.getElementById('utility-boh-notes').value;
    if (!date || !ac || !tank || !panel) { alert('Semua field wajib diisi!'); return; }
    utilityBohReports.push({ id: Date.now(), date, ac, tank, panel, notes });
    localStorage.setItem('utility_boh_reports', JSON.stringify(utilityBohReports));
    renderUtilityBohSummary();
    renderUtilityBohHistory();
    document.getElementById('utility-boh-date').value = '';
    document.getElementById('utility-boh-ac').value = '';
    document.getElementById('utility-boh-tank').value = '';
    document.getElementById('utility-boh-panel').value = '';
    document.getElementById('utility-boh-notes').value = '';
}
function renderUtilityBohSummary() {
    document.getElementById('utility-boh-summary').textContent = utilityBohReports.length;
}
function renderUtilityBohHistory(query = '') {
    const tbody = document.querySelector('#utility-boh-history-table tbody');
    let data = utilityBohReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.ac.toLowerCase().includes(query.toLowerCase()) || r.tank.toLowerCase().includes(query.toLowerCase()) || r.panel.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.ac}</td><td>${r.tank}</td><td>${r.panel}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-boh-submit')?.addEventListener('click', saveUtilityBohReport);
document.getElementById('utility-boh-history-search')?.addEventListener('input', e => renderUtilityBohHistory(e.target.value));
renderUtilityBohSummary();
renderUtilityBohHistory();

// Lobby Area
let lobbyReports = JSON.parse(localStorage.getItem('lobby_reports') || '[]');
function saveLobbyReport() {
    const date = document.getElementById('utility-lobby-date').value;
    const ac = document.getElementById('utility-lobby-ac').value;
    const clean = document.getElementById('utility-lobby-clean').value;
    const notes = document.getElementById('utility-lobby-notes').value;
    if (!date || !ac || !clean) { alert('Semua field wajib diisi!'); return; }
    lobbyReports.push({ id: Date.now(), date, ac, clean, notes });
    localStorage.setItem('lobby_reports', JSON.stringify(lobbyReports));
    renderLobbySummary();
    renderLobbyHistory();
    document.getElementById('utility-lobby-date').value = '';
    document.getElementById('utility-lobby-ac').value = '';
    document.getElementById('utility-lobby-clean').value = '';
    document.getElementById('utility-lobby-notes').value = '';
}
function renderLobbySummary() {
    document.getElementById('utility-lobby-summary').textContent = lobbyReports.length;
}
function renderLobbyHistory(query = '') {
    const tbody = document.querySelector('#utility-lobby-history-table tbody');
    let data = lobbyReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.ac.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.ac}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-lobby-submit')?.addEventListener('click', saveLobbyReport);
document.getElementById('utility-lobby-history-search')?.addEventListener('input', e => renderLobbyHistory(e.target.value));
renderLobbySummary();
renderLobbyHistory();

// Kitchen Area
let kitchenReports = JSON.parse(localStorage.getItem('kitchen_reports') || '[]');
function saveKitchenReport() {
    const date = document.getElementById('utility-kitchen-date').value;
    const exhaust = document.getElementById('utility-kitchen-exhaust').value;
    const clean = document.getElementById('utility-kitchen-clean').value;
    const notes = document.getElementById('utility-kitchen-notes').value;
    if (!date || !exhaust || !clean) { alert('Semua field wajib diisi!'); return; }
    kitchenReports.push({ id: Date.now(), date, exhaust, clean, notes });
    localStorage.setItem('kitchen_reports', JSON.stringify(kitchenReports));
    renderKitchenSummary();
    renderKitchenHistory();
    document.getElementById('utility-kitchen-date').value = '';
    document.getElementById('utility-kitchen-exhaust').value = '';
    document.getElementById('utility-kitchen-clean').value = '';
    document.getElementById('utility-kitchen-notes').value = '';
}
function renderKitchenSummary() {
    document.getElementById('utility-kitchen-summary').textContent = kitchenReports.length;
}
function renderKitchenHistory(query = '') {
    const tbody = document.querySelector('#utility-kitchen-history-table tbody');
    let data = kitchenReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.exhaust.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.exhaust}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-kitchen-submit')?.addEventListener('click', saveKitchenReport);
document.getElementById('utility-kitchen-history-search')?.addEventListener('input', e => renderKitchenHistory(e.target.value));
renderKitchenSummary();
renderKitchenHistory();

// Rooftop
let rooftopReports = JSON.parse(localStorage.getItem('rooftop_reports') || '[]');
function saveRooftopReport() {
    const date = document.getElementById('utility-rooftop-date').value;
    const condition = document.getElementById('utility-rooftop-condition').value;
    const clean = document.getElementById('utility-rooftop-clean').value;
    const notes = document.getElementById('utility-rooftop-notes').value;
    if (!date || !condition || !clean) { alert('Semua field wajib diisi!'); return; }
    rooftopReports.push({ id: Date.now(), date, condition, clean, notes });
    localStorage.setItem('rooftop_reports', JSON.stringify(rooftopReports));
    renderRooftopSummary();
    renderRooftopHistory();
    document.getElementById('utility-rooftop-date').value = '';
    document.getElementById('utility-rooftop-condition').value = '';
    document.getElementById('utility-rooftop-clean').value = '';
    document.getElementById('utility-rooftop-notes').value = '';
}
function renderRooftopSummary() {
    document.getElementById('utility-rooftop-summary').textContent = rooftopReports.length;
}
function renderRooftopHistory(query = '') {
    const tbody = document.querySelector('#utility-rooftop-history-table tbody');
    let data = rooftopReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.condition}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-rooftop-submit')?.addEventListener('click', saveRooftopReport);
document.getElementById('utility-rooftop-history-search')?.addEventListener('input', e => renderRooftopHistory(e.target.value));
renderRooftopSummary();
renderRooftopHistory();

// Lift Room
let liftRoomReports = JSON.parse(localStorage.getItem('lift_room_reports') || '[]');
function saveLiftRoomReport() {
    const date = document.getElementById('utility-lift-date').value;
    const condition = document.getElementById('utility-lift-condition').value;
    const clean = document.getElementById('utility-lift-clean').value;
    const notes = document.getElementById('utility-lift-notes').value;
    if (!date || !condition || !clean) { alert('Semua field wajib diisi!'); return; }
    liftRoomReports.push({ id: Date.now(), date, condition, clean, notes });
    localStorage.setItem('lift_room_reports', JSON.stringify(liftRoomReports));
    renderLiftRoomSummary();
    renderLiftRoomHistory();
    document.getElementById('utility-lift-date').value = '';
    document.getElementById('utility-lift-condition').value = '';
    document.getElementById('utility-lift-clean').value = '';
    document.getElementById('utility-lift-notes').value = '';
}
function renderLiftRoomSummary() {
    document.getElementById('utility-lift-summary').textContent = liftRoomReports.length;
}
function renderLiftRoomHistory(query = '') {
    const tbody = document.querySelector('#utility-lift-history-table tbody');
    let data = liftRoomReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.condition}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('utility-lift-submit')?.addEventListener('click', saveLiftRoomReport);
document.getElementById('utility-lift-history-search')?.addEventListener('input', e => renderLiftRoomHistory(e.target.value));
renderLiftRoomSummary();
renderLiftRoomHistory();

// LVMDP
let lvmdpReports = JSON.parse(localStorage.getItem('lvmdp_reports') || '[]');
function saveLvmdpReport() {
    const date = document.getElementById('energy-lvmdp-date').value;
    const condition = document.getElementById('energy-lvmdp-condition').value;
    const notes = document.getElementById('energy-lvmdp-notes').value;
    if (!date || !condition) { alert('Semua field wajib diisi!'); return; }
    lvmdpReports.push({ id: Date.now(), date, condition, notes });
    localStorage.setItem('lvmdp_reports', JSON.stringify(lvmdpReports));
    renderLvmdpSummary();
    renderLvmdpHistory();
    document.getElementById('energy-lvmdp-date').value = '';
    document.getElementById('energy-lvmdp-condition').value = '';
    document.getElementById('energy-lvmdp-notes').value = '';
}
function renderLvmdpSummary() {
    document.getElementById('energy-lvmdp-summary').textContent = lvmdpReports.length;
}
function renderLvmdpHistory(query = '') {
    const tbody = document.querySelector('#energy-lvmdp-history-table tbody');
    let data = lvmdpReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.condition}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('energy-lvmdp-submit')?.addEventListener('click', saveLvmdpReport);
document.getElementById('energy-lvmdp-history-search')?.addEventListener('input', e => renderLvmdpHistory(e.target.value));
renderLvmdpSummary();
renderLvmdpHistory();

// Swimming Pool
let swimmingPoolReports = JSON.parse(localStorage.getItem('swimming_pool_reports') || '[]');
function saveSwimmingPoolReport() {
    const date = document.getElementById('swimming-date').value;
    const waterCondition = document.getElementById('swimming-water-condition').value;
    const clean = document.getElementById('swimming-clean').value;
    const notes = document.getElementById('swimming-notes').value;
    if (!date || !waterCondition || !clean) { alert('Semua field wajib diisi!'); return; }
    swimmingPoolReports.push({ id: Date.now(), date, waterCondition, clean, notes });
    localStorage.setItem('swimming_pool_reports', JSON.stringify(swimmingPoolReports));
    renderSwimmingPoolSummary();
    renderSwimmingPoolHistory();
    document.getElementById('swimming-date').value = '';
    document.getElementById('swimming-water-condition').value = '';
    document.getElementById('swimming-clean').value = '';
    document.getElementById('swimming-notes').value = '';
}
function renderSwimmingPoolSummary() {
    document.getElementById('swimming-summary').textContent = swimmingPoolReports.length;
}
function renderSwimmingPoolHistory(query = '') {
    const tbody = document.querySelector('#swimming-history-table tbody');
    let data = swimmingPoolReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.waterCondition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.waterCondition}</td><td>${r.clean}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('swimming-submit')?.addEventListener('click', saveSwimmingPoolReport);
document.getElementById('swimming-history-search')?.addEventListener('input', e => renderSwimmingPoolHistory(e.target.value));
renderSwimmingPoolSummary();
renderSwimmingPoolHistory();

// Pump Room (Daily)
let pumpRoomReports = JSON.parse(localStorage.getItem('pump_room_reports') || '[]');
function savePumpRoomReport() {
    const date = document.getElementById('pump-date').value;
    const condition = document.getElementById('pump-condition').value;
    const notes = document.getElementById('pump-notes').value;
    if (!date || !condition) { alert('Semua field wajib diisi!'); return; }
    pumpRoomReports.push({ id: Date.now(), date, condition, notes });
    localStorage.setItem('pump_room_reports', JSON.stringify(pumpRoomReports));
    renderPumpRoomSummary();
    renderPumpRoomHistory();
    document.getElementById('pump-date').value = '';
    document.getElementById('pump-condition').value = '';
    document.getElementById('pump-notes').value = '';
}
function renderPumpRoomSummary() {
    document.getElementById('pump-summary').textContent = pumpRoomReports.length;
}
function renderPumpRoomHistory(query = '') {
    const tbody = document.querySelector('#pump-history-table tbody');
    let data = pumpRoomReports;
    if (query) data = data.filter(r => r.date.includes(query) || r.condition.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.condition}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('pump-submit')?.addEventListener('click', savePumpRoomReport);
document.getElementById('pump-history-search')?.addEventListener('input', e => renderPumpRoomHistory(e.target.value));
renderPumpRoomSummary();
renderPumpRoomHistory();

// --- PROJECT SECTION LOGIC ---
let projectRecords = JSON.parse(localStorage.getItem('project_records') || '[]');
function saveProjectRecord() {
    const name = document.getElementById('project-name').value;
    const date = document.getElementById('project-date').value;
    const pic = document.getElementById('project-pic').value;
    const status = document.getElementById('project-status').value;
    const notes = document.getElementById('project-notes').value;
    if (!name || !date || !pic || !status) { alert('Semua field wajib diisi!'); return; }
    projectRecords.push({ id: Date.now(), name, date, pic, status, notes });
    localStorage.setItem('project_records', JSON.stringify(projectRecords));
    renderProjectTable();
    renderProjectHistory();
    document.getElementById('project-name').value = '';
    document.getElementById('project-date').value = '';
    document.getElementById('project-pic').value = '';
    document.getElementById('project-status').value = '';
    document.getElementById('project-notes').value = '';
}
function renderProjectTable(period = 'today') {
    const tbody = document.getElementById('project-tbody');
    let data = projectRecords;
    const today = new Date();
    if (period === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        data = data.filter(r => r.date === todayStr);
    } else if (period === 'week') {
        const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay());
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
        data = data.filter(r => { const d=new Date(r.date); return d>=weekStart&&d<=weekEnd; });
    } else if (period === 'month') {
        const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const mEnd = new Date(today.getFullYear(), today.getMonth()+1, 0);
        data = data.filter(r => { const d=new Date(r.date); return d>=mStart&&d<=mEnd; });
    } else if (period === 'year') {
        const yStart = new Date(today.getFullYear(),0,1);
        const yEnd = new Date(today.getFullYear(),11,31);
        data = data.filter(r => { const d=new Date(r.date); return d>=yStart&&d<=yEnd; });
    }
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#999;">Belum ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.date}</td><td>${r.pic}</td><td>${r.status}</td><td>${r.notes||'-'}</td><td><button onclick="deleteProjectRecord(${r.id})">Hapus</button></td></tr>`).join('');
}
function renderProjectHistory(query = '') {
    const tbody = document.getElementById('project-history-tbody');
    let data = projectRecords;
    if (query) data = data.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.date.includes(query));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#999;">Tidak ada data history.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.date}</td><td>${r.pic}</td><td>${r.status}</td><td>${r.notes||'-'}</td><td><button onclick="deleteProjectRecord(${r.id})">Hapus</button></td></tr>`).join('');
}
document.getElementById('project-submit-btn')?.addEventListener('click', saveProjectRecord);
document.getElementById('project-search')?.addEventListener('input', e => renderProjectHistory(e.target.value));
document.getElementById('project-period-select')?.addEventListener('change', e => renderProjectTable(e.target.value));
renderProjectTable();
renderProjectHistory();

// --- TRAINING SECTION LOGIC ---
// Note: trainingRecords already declared at top of file with data from attendanceSchedules
let trainingScheduleRecords = JSON.parse(localStorage.getItem('training_records') || '[]');
function saveTrainingRecord() {
    const name = document.getElementById('training-name').value;
    const date = document.getElementById('training-date').value;
    const duration = document.getElementById('training-duration').value;
    const pic = document.getElementById('training-pic').value;
    const status = document.getElementById('training-status').value;
    const notes = document.getElementById('training-notes').value;
    if (!name || !date || !duration || !pic || !status) { alert('Semua field wajib diisi!'); return; }
    trainingScheduleRecords.push({ id: Date.now(), name, date, duration, pic, status, notes });
    localStorage.setItem('training_records', JSON.stringify(trainingScheduleRecords));
    renderTrainingTable();
    renderTrainingHistory();
    document.getElementById('training-name').value = '';
    document.getElementById('training-date').value = '';
    document.getElementById('training-duration').value = '';
    document.getElementById('training-pic').value = '';
    document.getElementById('training-status').value = '';
    document.getElementById('training-notes').value = '';
}
function renderTrainingTable(period = 'today') {
    const tbody = document.getElementById('training-tbody');
    let data = trainingScheduleRecords;
    const today = new Date();
    if (period === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        data = data.filter(r => r.date === todayStr);
    } else if (period === 'week') {
        const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay());
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
        data = data.filter(r => { const d=new Date(r.date); return d>=weekStart&&d<=weekEnd; });
    } else if (period === 'month') {
        const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const mEnd = new Date(today.getFullYear(), today.getMonth()+1, 0);
        data = data.filter(r => { const d=new Date(r.date); return d>=mStart&&d<=mEnd; });
    } else if (period === 'year') {
        const yStart = new Date(today.getFullYear(),0,1);
        const yEnd = new Date(today.getFullYear(),11,31);
        data = data.filter(r => { const d=new Date(r.date); return d>=yStart&&d<=yEnd; });
    }
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">Belum ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.date}</td><td>${r.duration}</td><td>${r.pic}</td><td>${r.status}</td><td><button onclick="deleteTrainingRecord(${r.id})">Hapus</button></td></tr>`).join('');
}
function renderTrainingHistory(query = '') {
    const tbody = document.getElementById('training-history-tbody');
    let data = trainingScheduleRecords;
    if (query) data = data.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.date.includes(query));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">Tidak ada data history.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.date}</td><td>${r.duration}</td><td>${r.pic}</td><td>${r.status}</td><td><button onclick="deleteTrainingRecord(${r.id})">Hapus</button></td></tr>`).join('');
}
document.getElementById('training-submit-btn')?.addEventListener('click', saveTrainingRecord);
document.getElementById('training-search')?.addEventListener('input', e => renderTrainingHistory(e.target.value));
document.getElementById('training-period-select')?.addEventListener('change', e => renderTrainingTable(e.target.value));
renderTrainingTable();
renderTrainingHistory();

// Delete functions for section records
function deleteTrainingRecord(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        trainingScheduleRecords = trainingScheduleRecords.filter(r => r.id !== id);
        localStorage.setItem('training_records', JSON.stringify(trainingScheduleRecords));
        renderTrainingTable();
        renderTrainingHistory();
    }
}

function deleteProjectRecord(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        projectRecords = projectRecords.filter(r => r.id !== id);
        localStorage.setItem('project_records', JSON.stringify(projectRecords));
        renderProjectTable();
        renderProjectHistory();
    }
}

// --- MONTHLY SECTIONS ---
// Monthly Report
monthlyReports = JSON.parse(localStorage.getItem('monthly_reports') || '[]');
function saveMonthlyReport() {
    const month = document.getElementById('monthly-month').value;
    const dailyReports = document.getElementById('monthly-daily-reports').value;
    const issues = document.getElementById('monthly-issues').value;
    const notes = document.getElementById('monthly-notes').value;
    if (!month || !dailyReports) { alert('Bulan dan Total Laporan wajib diisi!'); return; }
    monthlyReports.push({ id: Date.now(), month, dailyReports: parseInt(dailyReports), issues, notes });
    localStorage.setItem('monthly_reports', JSON.stringify(monthlyReports));
    renderMonthlyReportSummary();
    renderMonthlyReportHistory();
    document.getElementById('monthly-month').value = '';
    document.getElementById('monthly-daily-reports').value = '';
    document.getElementById('monthly-issues').value = '';
    document.getElementById('monthly-notes').value = '';
}
function renderMonthlyReportSummary() {
    document.getElementById('monthly-report-summary').textContent = monthlyReports.length;
}
function renderMonthlyReportHistory(query = '') {
    const tbody = document.querySelector('#monthly-report-history-table tbody');
    let data = monthlyReports;
    if (query) data = data.filter(r => r.month.includes(query));
    data = data.sort((a,b) => new Date(b.month)-new Date(a.month));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.month}</td><td>${r.dailyReports}</td><td>${r.issues||'-'}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('monthly-report-submit')?.addEventListener('click', saveMonthlyReport);
document.getElementById('monthly-report-search')?.addEventListener('input', e => renderMonthlyReportHistory(e.target.value));
renderMonthlyReportSummary();
renderMonthlyReportHistory();

// Monthly Maintenance
let monthlyMaintenance = JSON.parse(localStorage.getItem('monthly_maintenance') || '[]');
function saveMonthlyMaintenance() {
    const month = document.getElementById('monthly-maint-month').value;
    const count = document.getElementById('monthly-maint-count').value;
    const equipment = document.getElementById('monthly-maint-equipment').value;
    const cost = document.getElementById('monthly-maint-cost').value;
    const notes = document.getElementById('monthly-maint-notes').value;
    if (!month || !count || !cost) { alert('Bulan, Jumlah, dan Biaya wajib diisi!'); return; }
    monthlyMaintenance.push({ id: Date.now(), month, count: parseInt(count), equipment, cost: parseInt(cost), notes });
    localStorage.setItem('monthly_maintenance', JSON.stringify(monthlyMaintenance));
    renderMonthlyMaintSummary();
    renderMonthlyMaintHistory();
    document.getElementById('monthly-maint-month').value = '';
    document.getElementById('monthly-maint-count').value = '';
    document.getElementById('monthly-maint-equipment').value = '';
    document.getElementById('monthly-maint-cost').value = '';
    document.getElementById('monthly-maint-notes').value = '';
}
function renderMonthlyMaintSummary() {
    document.getElementById('monthly-maint-summary').textContent = monthlyMaintenance.length;
}
function renderMonthlyMaintHistory(query = '') {
    const tbody = document.querySelector('#monthly-maint-history-table tbody');
    let data = monthlyMaintenance;
    if (query) data = data.filter(r => r.month.includes(query));
    data = data.sort((a,b) => new Date(b.month)-new Date(a.month));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.month}</td><td>${r.count}</td><td>${r.cost.toLocaleString('id-ID')}</td><td>${r.equipment||'-'}</td><td>${r.notes||'-'}</td></tr>`).join('');
}
document.getElementById('monthly-maint-submit')?.addEventListener('click', saveMonthlyMaintenance);
document.getElementById('monthly-maint-search')?.addEventListener('input', e => renderMonthlyMaintHistory(e.target.value));
renderMonthlyMaintSummary();
renderMonthlyMaintHistory();

// --- TRAINING RECORD ---
trainingRecords = JSON.parse(localStorage.getItem('training_records') || '[]');
function saveTrainingRecord() {
    const name = document.getElementById('training-record-name').value;
    const date = document.getElementById('training-record-date').value;
    const duration = document.getElementById('training-record-duration').value;
    const instructor = document.getElementById('training-record-instructor').value;
    const participants = document.getElementById('training-record-participants').value;
    const topic = document.getElementById('training-record-topic').value;
    const output = document.getElementById('training-record-output').value;
    const notes = document.getElementById('training-record-notes').value;
    if (!name || !date || !duration || !instructor || !participants || !topic) { alert('Nama, tanggal, durasi, instruktur, peserta, dan topik wajib diisi!'); return; }
    trainingRecords.push({ id: Date.now(), name, date, duration: parseFloat(duration), instructor, participants: parseInt(participants), topic, output, notes });
    localStorage.setItem('training_records', JSON.stringify(trainingRecords));
    renderTrainingRecordSummary();
    renderTrainingRecordHistory();
    document.getElementById('training-record-name').value = '';
    document.getElementById('training-record-date').value = '';
    document.getElementById('training-record-duration').value = '';
    document.getElementById('training-record-instructor').value = '';
    document.getElementById('training-record-participants').value = '';
    document.getElementById('training-record-topic').value = '';
    document.getElementById('training-record-output').value = '';
    document.getElementById('training-record-notes').value = '';
}
function renderTrainingRecordSummary() {
    document.getElementById('training-record-summary').textContent = trainingRecords.length;
}
function renderTrainingRecordHistory(query = '') {
    const tbody = document.querySelector('#training-record-history-table tbody');
    let data = trainingRecords;
    if (query) data = data.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.instructor.toLowerCase().includes(query.toLowerCase()));
    data = data.sort((a,b) => new Date(b.date)-new Date(a.date));
    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#999;">Tidak ada data.</td></tr>' :
        data.map((r,i) => `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.date}</td><td>${r.instructor}</td><td>${r.participants}</td><td>${r.duration} jam</td><td>${r.topic}</td></tr>`).join('');
}
document.getElementById('training-record-submit')?.addEventListener('click', saveTrainingRecord);
document.getElementById('training-record-search')?.addEventListener('input', e => renderTrainingRecordHistory(e.target.value));
renderTrainingRecordSummary();
renderTrainingRecordHistory();
// Close daily overview history
function closeDailyOverviewHistory() {
    const historySection = document.getElementById('daily-overview-history-section');
    const historyBtn = document.getElementById('daily-overview-history-btn');
    historySection.style.display = 'none';
    historyBtn.textContent = '📋 History';
}
