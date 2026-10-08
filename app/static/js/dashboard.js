// dashboard.js - Daily Aggregation & UI Controller

let selectedDate = getTodayDateString();

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // 1. Setup Tab Switching
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            switchTab(target);
        });
    });

    // 2. Setup Date Controls
    const datePicker = document.getElementById("dashboard-date-picker");
    datePicker.value = selectedDate;
    datePicker.addEventListener("change", (e) => {
        selectedDate = e.target.value;
        loadDailyDashboard();
    });

    document.getElementById("btn-prev-day").addEventListener("click", () => {
        changeDateOffset(-1);
    });

    document.getElementById("btn-next-day").addEventListener("click", () => {
        changeDateOffset(1);
    });

    document.getElementById("btn-today").addEventListener("click", () => {
        selectedDate = getTodayDateString();
        datePicker.value = selectedDate;
        loadDailyDashboard();
    });

    document.getElementById("btn-yesterday").addEventListener("click", () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        selectedDate = formatDateString(d);
        datePicker.value = selectedDate;
        loadDailyDashboard();
    });

    // 3. Quick Action Buttons
    document.getElementById("btn-quick-add-report").addEventListener("click", () => openAddReportModal());
    document.getElementById("btn-add-member").addEventListener("click", () => openAddMemberModal());
    document.getElementById("btn-add-group").addEventListener("click", () => openAddGroupModal());

    // 4. Report Filters
    document.getElementById("btn-apply-report-filter").addEventListener("click", () => renderReportsTable());
    document.getElementById("btn-reset-report-filter").addEventListener("click", () => {
        document.getElementById("filter-report-date").value = "";
        document.getElementById("filter-report-group").value = "";
        document.getElementById("filter-report-member").value = "";
        renderReportsTable();
    });

    // Initial load
    refreshAllDropdowns();
    loadDailyDashboard();
}

function switchTab(tabName) {
    document.querySelectorAll(".nav-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("active", content.id === `tab-${tabName}`);
    });

    if (tabName === "dashboard") loadDailyDashboard();
    if (tabName === "reports") renderReportsTable();
    if (tabName === "members") renderMembersTable();
    if (tabName === "groups") renderGroupsTable();
}

function changeDateOffset(offsetDays) {
    const parts = selectedDate.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + offsetDays);
    selectedDate = formatDateString(d);
    document.getElementById("dashboard-date-picker").value = selectedDate;
    loadDailyDashboard();
}

async function loadDailyDashboard() {
    updateDateDisplayLabel(selectedDate);
    const groupsContainer = document.getElementById("groups-container");
    const unreportedList = document.getElementById("unreported-members-list");

    groupsContainer.innerHTML = `
        <div class="loading-state" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>Đang tổng hợp báo cáo ngày ${selectedDate}...</p>
        </div>
    `;

    try {
        const res = await fetch(`/api/dashboard/daily?date=${selectedDate}`);
        if (!res.ok) throw new Error("Không thể tải dữ liệu dashboard");
        const data = await res.json();

        // 1. Update KPI stats
        document.getElementById("stat-total-members").innerText = data.total_members;
        document.getElementById("stat-reported-members").innerText = data.reported_members;
        document.getElementById("stat-unreported-members").innerText = data.unreported_members;
        document.getElementById("stat-total-reports").innerText = data.total_reports;

        const percent = data.total_members > 0 
            ? Math.round((data.reported_members / data.total_members) * 100) 
            : 0;
        document.getElementById("stat-progress-bar").style.width = `${percent}%`;
        document.getElementById("stat-reported-percent").innerText = `Tỷ lệ hoàn thành: ${percent}%`;

        // 2. Render Groups & Reports
        if (!data.groups.length) {
            groupsContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">Chưa có nhóm nào hoạt động</div>`;
        } else {
            groupsContainer.innerHTML = data.groups.map(group => `
                <div class="group-card">
                    <div class="group-card-header">
                        <div class="group-title-wrap">
                            <span class="group-badge-dot"></span>
                            <span class="group-card-title">${escapeHtml(group.group_name)}</span>
                        </div>
                        <span class="group-report-count">${group.reports.length} báo cáo</span>
                    </div>
                    <div class="group-card-body">
                        ${group.reports.length === 0 ? `
                            <div class="empty-state">
                                <p>Chưa có báo cáo nào trong ngày này</p>
                                <button class="btn btn-outline btn-sm" style="margin-top: 10px;" onclick="openAddReportModal(null, ${group.group_id})">
                                    + Thêm báo cáo đầu tiên
                                </button>
                            </div>
                        ` : group.reports.map(r => `
                            <div class="report-item">
                                <div class="report-item-header">
                                    <div class="member-info">
                                        <div class="member-avatar">${getInitials(r.member_name)}</div>
                                        <span class="member-name">${escapeHtml(r.member_name)}</span>
                                    </div>
                                    <div class="report-item-actions">
                                        <span class="report-time-badge">${formatTimeOnly(r.reported_at)}</span>
                                        <button class="action-btn" title="Chỉnh sửa" onclick="openEditReportModal(${r.id})">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button class="action-btn delete" title="Xóa" onclick="handleDeleteReport(${r.id})">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="report-item-content">${escapeHtml(r.content)}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `).join("");
        }

        // 3. Render Unreported members
        document.getElementById("badge-unreported-count").innerText = data.unreported_members;
        if (!data.unreported_member_list.length) {
            unreportedList.innerHTML = `
                <div style="color: var(--success); font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Tuyệt vời! Tất cả ${data.total_members} thành viên đều đã hoàn thành báo cáo trong ngày.
                </div>
            `;
        } else {
            unreportedList.innerHTML = data.unreported_member_list.map(m => `
                <div class="unreported-chip">
                    <span class="chip-avatar">${getInitials(m.name)}</span>
                    <span>${escapeHtml(m.name)}</span>
                    <button class="chip-quick-add" title="Thêm báo cáo cho ${escapeHtml(m.name)}" onclick="openAddReportModal(${m.id})">
                        + Nhập
                    </button>
                </div>
            `).join("");
        }
    } catch (err) {
        groupsContainer.innerHTML = `<div class="empty-state text-danger" style="grid-column: 1 / -1;">Lỗi: ${err.message}</div>`;
        showToast(err.message, "error");
    }
}

async function refreshAllDropdowns() {
    const [groups, members] = await Promise.all([
        fetchGroups(true),
        fetchMembers(true)
    ]);

    // Populate Report modal selects
    const modalGroupSelect = document.getElementById("report-group-id");
    const modalMemberSelect = document.getElementById("report-member-id");
    if (modalGroupSelect) {
        modalGroupSelect.innerHTML = groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
    }
    if (modalMemberSelect) {
        modalMemberSelect.innerHTML = members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
    }

    // Populate Filter selects
    const filterGroupSelect = document.getElementById("filter-report-group");
    const filterMemberSelect = document.getElementById("filter-report-member");
    if (filterGroupSelect) {
        const cur = filterGroupSelect.value;
        filterGroupSelect.innerHTML = `<option value="">-- Tất cả nhóm --</option>` + groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
        filterGroupSelect.value = cur;
    }
    if (filterMemberSelect) {
        const cur = filterMemberSelect.value;
        filterMemberSelect.innerHTML = `<option value="">-- Tất cả thành viên --</option>` + members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
        filterMemberSelect.value = cur;
    }
}

function updateDateDisplayLabel(dateStr) {
    const parts = dateStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dayName = daysOfWeek[d.getDay()];
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const label = `${dayName}, ${formatted}${isToday ? ' (Hôm nay)' : ''}`;
    document.getElementById("current-date-label").innerText = label;
}

// ================= Utility Helpers =================
function getTodayDateString() {
    return formatDateString(new Date());
}

function formatDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatTimeOnly(dateIso) {
    if (!dateIso) return "--:--";
    const d = new Date(dateIso);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function formatDateTime(dateIso) {
    if (!dateIso) return "-";
    const d = new Date(dateIso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ================= Notion Integration Handlers =================
document.getElementById("btn-open-notion-modal")?.addEventListener("click", async () => {
    openModal("modal-notion");
    try {
        const res = await fetch("/api/notion/config");
        if (res.ok) {
            const data = await res.json();
            if (data.page_id || data.database_id) {
                document.getElementById("notion-page-id").value = data.page_id || data.database_id;
            }
            if (data.masked_token) {
                document.getElementById("notion-token").placeholder = data.masked_token;
            }
        }
    } catch (e) {}
});

async function handleSaveNotion(event) {
    event.preventDefault();
    const token = document.getElementById("notion-token").value.trim();
    let pageOrDbId = document.getElementById("notion-page-id").value.trim();

    // Extract ID from URL if full URL is pasted: e.g. https://www.notion.so/workspace/Bao-cao-1234567890abcdef...
    if (pageOrDbId.includes("/")) {
        const parts = pageOrDbId.split("/").pop().split("?")[0].split("-");
        pageOrDbId = parts[parts.length - 1];
    }

    if (!token && !document.getElementById("notion-token").placeholder.includes("...")) {
        showToast("Vui lòng nhập Notion Integration Token", "error");
        return;
    }

    const saveBtn = document.getElementById("btn-save-notion");
    saveBtn.innerText = "⏳ Đang kết nối...";

    try {
        const res = await fetch("/api/notion/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: token,
                page_id_or_db_id: pageOrDbId
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Không thể kết nối Notion");
        }

        const data = await res.json();
        showToast("✅ " + data.message, "success");
        closeModal("modal-notion");
    } catch (err) {
        showToast("❌ " + err.message, "error");
    } finally {
        saveBtn.innerText = "Lưu Cấu Hình";
    }
}

async function handleSyncToNotion() {
    const btn = document.getElementById("btn-sync-now-notion");
    btn.innerText = "⏳ Đang đẩy lên Notion...";

    try {
        const res = await fetch("/api/notion/sync-reports", { method: "POST" });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Không thể đồng bộ lên Notion");
        }
        const data = await res.json();
        showToast("🎉 " + data.message, "success");
        closeModal("modal-notion");
    } catch (err) {
        showToast("❌ " + err.message, "error");
    } finally {
        btn.innerText = "⚡ Đẩy báo cáo lên Notion ngay";
    }
}
