document.addEventListener("DOMContentLoaded", async () => {
    const statusText = document.getElementById("status-text");
    const statusBadge = document.getElementById("server-status");

    try {
        const res = await fetch("http://127.0.0.1:8000/health");
        if (res.ok) {
            statusText.innerText = "Kết nối Web App: Đang Hoạt Động (Online)";
            statusBadge.style.color = "#10b981";
            statusBadge.style.background = "rgba(16, 185, 129, 0.15)";
        } else {
            throw new Error();
        }
    } catch (err) {
        statusText.innerText = "Chưa bật server (Offline)";
        statusBadge.style.color = "#ef4444";
        statusBadge.style.background = "rgba(239, 68, 68, 0.15)";
    }
});
