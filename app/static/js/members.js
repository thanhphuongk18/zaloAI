// members.js - Member Management Module

let cachedMembers = [];

async function fetchMembers(activeOnly = false) {
    try {
        const res = await fetch(`/api/members?active_only=${activeOnly}`);
        if (!res.ok) throw new Error("Không thể tải danh sách thành viên");
        cachedMembers = await res.json();
        return cachedMembers;
    } catch (err) {
        showToast(err.message, "error");
        return [];
    }
}

async function renderMembersTable() {
    const tbody = document.getElementById("tbody-members");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="text-center"><div class="spinner"></div> Đang tải...</td></tr>`;

    const members = await fetchMembers(false);
    if (!members.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Chưa có thành viên nào</td></tr>`;
        return;
    }

    tbody.innerHTML = members.map(m => `
        <tr>
            <td><strong>#${m.id}</strong></td>
            <td>
                <div class="member-info">
                    <div class="member-avatar">${getInitials(m.name)}</div>
                    <span class="member-name">${escapeHtml(m.name)}</span>
                </div>
            </td>
            <td>
                <span class="badge ${m.active ? 'badge-success' : 'badge-danger'}">
                    ${m.active ? 'Hoạt động' : 'Tạm dừng'}
                </span>
            </td>
            <td class="text-muted">${formatDateTime(m.created_at)}</td>
            <td style="text-align: right;">
                <button class="action-btn" title="Chỉnh sửa" onclick="openEditMemberModal(${m.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete" title="Vô hiệu hóa" onclick="handleDeleteMember(${m.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join("");
}

function openAddMemberModal() {
    document.getElementById("modal-member-title").innerText = "Thêm Thành Viên Mới";
    document.getElementById("member-id").value = "";
    document.getElementById("member-name").value = "";
    document.getElementById("member-active").checked = true;
    openModal("modal-member");
}

function openEditMemberModal(memberId) {
    const member = cachedMembers.find(m => m.id === memberId);
    if (!member) return;
    document.getElementById("modal-member-title").innerText = "Chỉnh Sửa Thành Viên";
    document.getElementById("member-id").value = member.id;
    document.getElementById("member-name").value = member.name;
    document.getElementById("member-active").checked = member.active;
    openModal("modal-member");
}

async function handleSaveMember(event) {
    event.preventDefault();
    const id = document.getElementById("member-id").value;
    const name = document.getElementById("member-name").value.trim();
    const active = document.getElementById("member-active").checked;

    if (!name) {
        showToast("Vui lòng nhập họ và tên thành viên", "error");
        return;
    }

    try {
        const payload = { name, active };
        let res;
        if (id) {
            res = await fetch(`/api/members/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`/api/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Không thể lưu thành viên");
        }

        closeModal("modal-member");
        showToast(id ? "Cập nhật thành viên thành công" : "Thêm thành viên mới thành công", "success");
        renderMembersTable();
        refreshAllDropdowns();
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleDeleteMember(memberId) {
    if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa thành viên này?")) return;
    try {
        const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể vô hiệu hóa thành viên");
        showToast("Đã vô hiệu hóa thành viên thành công", "success");
        renderMembersTable();
        refreshAllDropdowns();
    } catch (err) {
        showToast(err.message, "error");
    }
}
