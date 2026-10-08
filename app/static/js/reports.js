// reports.js - Reports List and CRUD Module

let cachedReports = [];

async function fetchReports(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.date) params.append("date", filters.date);
        if (filters.group_id) params.append("group_id", filters.group_id);
        if (filters.member_id) params.append("member_id", filters.member_id);

        const res = await fetch(`/api/reports?${params.toString()}`);
        if (!res.ok) throw new Error("Không thể tải danh sách báo cáo");
        cachedReports = await res.json();
        return cachedReports;
    } catch (err) {
        showToast(err.message, "error");
        return [];
    }
}

async function renderReportsTable() {
    const tbody = document.getElementById("tbody-reports");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="text-center"><div class="spinner"></div> Đang tải...</td></tr>`;

    const dateVal = document.getElementById("filter-report-date").value;
    const groupVal = document.getElementById("filter-report-group").value;
    const memberVal = document.getElementById("filter-report-member").value;

    const reports = await fetchReports({
        date: dateVal || undefined,
        group_id: groupVal || undefined,
        member_id: memberVal || undefined
    });

    if (!reports.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Không tìm thấy báo cáo nào phù hợp</td></tr>`;
        return;
    }

    tbody.innerHTML = reports.map(r => `
        <tr>
            <td><strong>#${r.id}</strong></td>
            <td><strong>${r.report_date}</strong></td>
            <td><span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">${escapeHtml(r.group_name || 'Nhóm #' + r.group_id)}</span></td>
            <td>
                <div class="member-info">
                    <div class="member-avatar">${getInitials(r.member_name || '')}</div>
                    <span class="member-name">${escapeHtml(r.member_name || 'Thành viên #' + r.member_id)}</span>
                </div>
            </td>
            <td class="report-item-content">${escapeHtml(r.content)}</td>
            <td class="text-muted"><span class="report-time-badge">${formatTimeOnly(r.reported_at)}</span></td>
            <td style="text-align: right;">
                <button class="action-btn" title="Chỉnh sửa" onclick="openEditReportModal(${r.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete" title="Xóa" onclick="handleDeleteReport(${r.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join("");
}

async function openAddReportModal(prefillMemberId = null, prefillGroupId = null) {
    document.getElementById("modal-report-title").innerText = "Thêm Báo Cáo Mới";
    document.getElementById("report-id").value = "";
    document.getElementById("report-content").value = "";

    // Set date to current dashboard date or today
    const currentDashDate = document.getElementById("dashboard-date-picker").value || getTodayDateString();
    document.getElementById("report-date").value = currentDashDate;

    // Set current time
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    document.getElementById("report-time").value = timeStr;

    await refreshAllDropdowns();

    if (prefillMemberId) {
        document.getElementById("report-member-id").value = prefillMemberId;
    }
    if (prefillGroupId) {
        document.getElementById("report-group-id").value = prefillGroupId;
    }

    openModal("modal-report");
}

async function openEditReportModal(reportId) {
    try {
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) throw new Error("Không thể tải chi tiết báo cáo");
        const report = await res.json();

        document.getElementById("modal-report-title").innerText = "Chỉnh Sửa Báo Cáo #" + report.id;
        document.getElementById("report-id").value = report.id;
        document.getElementById("report-content").value = report.content;
        document.getElementById("report-date").value = report.report_date;

        if (report.reported_at) {
            const dateObj = new Date(report.reported_at);
            const timeStr = String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
            document.getElementById("report-time").value = timeStr;
        }

        await refreshAllDropdowns();
        document.getElementById("report-group-id").value = report.group_id;
        document.getElementById("report-member-id").value = report.member_id;

        openModal("modal-report");
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleSaveReport(event) {
    event.preventDefault();
    const id = document.getElementById("report-id").value;
    const groupId = parseInt(document.getElementById("report-group-id").value);
    const memberId = parseInt(document.getElementById("report-member-id").value);
    const reportDate = document.getElementById("report-date").value;
    const reportTime = document.getElementById("report-time").value;
    const content = document.getElementById("report-content").value.trim();

    if (!groupId || !memberId || !reportDate || !content) {
        showToast("Vui lòng điền đầy đủ các trường bắt buộc", "error");
        return;
    }

    // Compose reported_at
    let reportedAt = null;
    if (reportTime) {
        reportedAt = `${reportDate}T${reportTime}:00`;
    } else {
        const now = new Date();
        reportedAt = `${reportDate}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    }

    const payload = {
        group_id: groupId,
        member_id: memberId,
        report_date: reportDate,
        reported_at: reportedAt,
        content: content
    };

    try {
        let res;
        if (id) {
            res = await fetch(`/api/reports/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`/api/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Không thể lưu báo cáo");
        }

        closeModal("modal-report");
        showToast(id ? "Cập nhật báo cáo thành công" : "Thêm báo cáo mới thành công", "success");
        
        // Refresh both views
        loadDailyDashboard();
        renderReportsTable();
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleDeleteReport(reportId) {
    if (!confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) return;
    try {
        const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa báo cáo");
        showToast("Đã xóa báo cáo thành công", "success");
        loadDailyDashboard();
        renderReportsTable();
    } catch (err) {
        showToast(err.message, "error");
    }
}
