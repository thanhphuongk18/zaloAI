// groups.js - Group Management Module

let cachedGroups = [];

async function fetchGroups(activeOnly = false) {
    try {
        const res = await fetch(`/api/groups?active_only=${activeOnly}`);
        if (!res.ok) throw new Error("Không thể tải danh sách nhóm");
        cachedGroups = await res.json();
        return cachedGroups;
    } catch (err) {
        showToast(err.message, "error");
        return [];
    }
}

async function renderGroupsTable() {
    const tbody = document.getElementById("tbody-groups");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center"><div class="spinner"></div> Đang tải...</td></tr>`;

    const groups = await fetchGroups(false);
    if (!groups.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Chưa có nhóm nào</td></tr>`;
        return;
    }

    tbody.innerHTML = groups.map(g => `
        <tr>
            <td><strong>#${g.id}</strong></td>
            <td><strong>${escapeHtml(g.name)}</strong></td>
            <td class="text-muted">${escapeHtml(g.description || "-")}</td>
            <td>
                <span class="badge ${g.active ? 'badge-success' : 'badge-danger'}">
                    ${g.active ? 'Hoạt động' : 'Tạm dừng'}
                </span>
            </td>
            <td class="text-muted">${formatDateTime(g.created_at)}</td>
            <td style="text-align: right;">
                <button class="action-btn" title="Chỉnh sửa" onclick="openEditGroupModal(${g.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete" title="Vô hiệu hóa" onclick="handleDeleteGroup(${g.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join("");
}

function openAddGroupModal() {
    document.getElementById("modal-group-title").innerText = "Thêm Nhóm Zalo Mới";
    document.getElementById("group-id").value = "";
    document.getElementById("group-name").value = "";
    document.getElementById("group-description").value = "";
    document.getElementById("group-active").checked = true;
    openModal("modal-group");
}

function openEditGroupModal(groupId) {
    const group = cachedGroups.find(g => g.id === groupId);
    if (!group) return;
    document.getElementById("modal-group-title").innerText = "Chỉnh Sửa Nhóm Zalo";
    document.getElementById("group-id").value = group.id;
    document.getElementById("group-name").value = group.name;
    document.getElementById("group-description").value = group.description || "";
    document.getElementById("group-active").checked = group.active;
    openModal("modal-group");
}

async function handleSaveGroup(event) {
    event.preventDefault();
    const id = document.getElementById("group-id").value;
    const name = document.getElementById("group-name").value.trim();
    const description = document.getElementById("group-description").value.trim();
    const active = document.getElementById("group-active").checked;

    if (!name) {
        showToast("Vui lòng nhập tên nhóm", "error");
        return;
    }

    try {
        const payload = { name, description, active };
        let res;
        if (id) {
            res = await fetch(`/api/groups/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`/api/groups`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Không thể lưu nhóm");
        }

        closeModal("modal-group");
        showToast(id ? "Cập nhật nhóm thành công" : "Thêm nhóm mới thành công", "success");
        renderGroupsTable();
        refreshAllDropdowns();
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleDeleteGroup(groupId) {
    if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa nhóm này?")) return;
    try {
        const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể vô hiệu hóa nhóm");
        showToast("Đã vô hiệu hóa nhóm thành công", "success");
        renderGroupsTable();
        refreshAllDropdowns();
    } catch (err) {
        showToast(err.message, "error");
    }
}
