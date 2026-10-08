// content.js - Tự động quét & đọc tin nhắn đính chính (Reply) để phân loại Game/Dev chuẩn 100%

(function() {
    console.log("[Zalo Report Sync Hub] Extension loaded with Intelligent Reply & Clarification Tracking!");

    const GROUP_1 = "Báo Cáo Leader_Dev & Game";
    const GROUP_2 = "Game Dev Intern - 8/2026";

    // 1. Nhận diện nhóm đang mở ở MAIN CHAT PANEL
    function detectActiveGroup() {
        const mainChatHeader = document.querySelector("#chatView header, .chat-box__header, #chat-header, .conv-header, [data-id='chat-header'], .header-title");
        if (mainChatHeader) {
            const txt = mainChatHeader.innerText;
            if (txt.includes("Intern") || txt.includes("8/2026")) return GROUP_2;
            if (txt.includes("Leader_Dev") || txt.includes("Báo Cáo")) return GROUP_1;
        }

        const selectedConv = document.querySelector(".conv-item.selected, .conv-item.active, [class*='conv-item'][class*='selected']");
        if (selectedConv) {
            const txt = selectedConv.innerText;
            if (txt.includes("Intern") || txt.includes("8/2026")) return GROUP_2;
            if (txt.includes("Leader_Dev")) return GROUP_1;
        }

        return null;
    }

    // 2. Tạo Floating Widget
    function injectFloatingWidget() {
        if (document.getElementById("zalo-sync-hub-floating-widget")) {
            updateDropdownSelection();
            return;
        }

        const widget = document.createElement("div");
        widget.id = "zalo-sync-hub-floating-widget";
        widget.innerHTML = `
            <select class="zalo-sync-group-select" id="zalo-sync-group-dropdown">
                <option value="${GROUP_1}">📌 ${GROUP_1}</option>
                <option value="${GROUP_2}">🎮 ${GROUP_2}</option>
            </select>
            <button class="zalo-sync-btn" id="zalo-sync-trigger-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span>⚡ Đồng bộ Game</span>
            </button>
        `;

        document.body.appendChild(widget);
        document.getElementById("zalo-sync-trigger-btn").addEventListener("click", handleSync);
        updateDropdownSelection();
    }

    function updateDropdownSelection() {
        const detected = detectActiveGroup();
        const dropdown = document.getElementById("zalo-sync-group-dropdown");
        if (detected && dropdown && dropdown.value !== detected) {
            dropdown.value = detected;
        }
    }

    // 3. Quét toàn bộ dòng thời gian tin nhắn trong khung chat
    function extractAllRawMessages() {
        const rawList = [];
        const chatContainer = document.querySelector("#chatView, .message-view, [data-id='div_LastMessageContainer'], .chat-box__content, #chat-message-list") || document.body;
        const messageCards = chatContainer.querySelectorAll(".card--bubble, .chat-message, .msg-item, [data-id*='msg_']");

        messageCards.forEach(card => {
            if (card.closest(".conv-item, #conversation-list")) return;

            let sender = "";
            const senderEl = card.querySelector(".user-name, .sender-name, .avatar-title, .title-name, .name");
            if (senderEl) {
                sender = senderEl.innerText.trim();
            } else {
                const prev = card.previousElementSibling;
                if (prev) {
                    const prevSender = prev.querySelector(".user-name, .name");
                    if (prevSender) sender = prevSender.innerText.trim();
                }
            }

            const textEl = card.querySelector(".message-text, .text-content, .bubble-content, .content, .msg-text");
            const content = textEl ? textEl.innerText.trim() : card.innerText.trim();

            const timeEl = card.querySelector(".time, .message-time, .card-send-time");
            const timeStr = timeEl ? timeEl.innerText.trim() : null;

            if (content && content.length > 5) {
                rawList.push({
                    sender: sender || "Thành viên Zalo",
                    content: content,
                    time: timeStr
                });
            }
        });

        return rawList;
    }

    // 4. Phân tích tin nhắn & TỰ ĐỘNG ĐỌC TIN NHẮN TRẢ LỜI ĐÍNH CHÍNH
    function analyzeMessagesWithReplies(rawList) {
        const validGameReports = [];
        let devSkippedCount = 0;

        for (let i = 0; i < rawList.length; i++) {
            const msg = rawList[i];
            const content = msg.content;
            const sender = msg.sender;
            const lower = content.toLowerCase();

            // Nếu không phải tin báo cáo thì bỏ qua
            if (!lower.includes("báo cáo")) continue;

            // TRƯỜNG HỢP 1: Đã ghi rõ _DEV / nhóm X_dev ngay trong tin nhắn
            const isExplicitDev = /_dev/i.test(content) || /nhóm\s*\d+[_ ]*dev/i.test(lower);
            if (isExplicitDev) {
                devSkippedCount++;
                console.log("[Zalo Sync] Bỏ qua báo cáo Dev rõ ràng:", content.slice(0, 40));
                continue;
            }

            // TRƯỜNG HỢP 2: Đã ghi rõ _Game / nhóm X_game ngay trong tin nhắn
            const gameMatch = content.match(/nhóm\s*(\d+)[_ ]*game/i);
            if (gameMatch) {
                const teamNum = gameMatch[1];
                const teamName = `Nhóm ${teamNum}_Game`;
                validGameReports.push({
                    sender_name: sender && !sender.includes("Nhóm") ? `${teamName} (${sender})` : teamName,
                    content: content,
                    reported_time: msg.time
                });
                console.log(`[Zalo Sync] Đã nhận diện trực tiếp: ${teamName}`);
                continue;
            }

            // TRƯỜNG HỢP 3: CHỈ GHI "nhóm X" (như 'báo cáo Công việc nhóm 8 ngày 8/10') -> CHƯA RÕ DEV HAY GAME!
            const teamMatch = content.match(/nhóm\s*(\d+)/i);
            if (teamMatch) {
                const teamNum = teamMatch[1];
                console.log(`[Zalo Sync] Phát hiện báo cáo Nhóm ${teamNum} chưa rõ Game/Dev của [${sender}]. Đang quét tin nhắn trả lời đính chính phía sau...`);

                let isClarifiedDev = false;
                let isClarifiedGame = false;

                // Quét các tin nhắn tiếp theo trong khung chat
                for (let j = i + 1; j < rawList.length; j++) {
                    const laterMsg = rawList[j];

                    // Kiểm tra nếu tin nhắn là của chính người đó gửi (hoặc có quote lại)
                    if (laterMsg.sender === sender) {
                        const laterLower = laterMsg.content.toLowerCase();

                        // Bỏ qua nếu là câu hỏi ngược
                        if (laterLower.includes("?")) continue;

                        // Kiểm tra nếu bạn ấy đính chính là DEV (như: "dạ của em bên dev plotfarm ạ")
                        if (/(bên\s+dev|em\s+bên\s+dev|của\s+em\s+bên\s+dev|nhóm\s+dev|team\s+dev|dev\s+plotfarm|dev\s+platform|dev)/i.test(laterLower)) {
                            isClarifiedDev = true;
                            console.log(`[Zalo Sync] 👉 Thành viên [${sender}] đã rep đính chính là DEV: "${laterMsg.content}"`);
                            break;
                        }

                        // Kiểm tra nếu bạn ấy đính chính là GAME (như: "dạ của em bên game ạ")
                        if (/(bên\s+game|em\s+bên\s+game|của\s+em\s+bên\s+game|nhóm\s+game|team\s+game|game)/i.test(laterLower)) {
                            isClarifiedGame = true;
                            console.log(`[Zalo Sync] 👉 Thành viên [${sender}] đã rep đính chính là GAME: "${laterMsg.content}"`);
                            break;
                        }
                    }
                }

                if (isClarifiedDev) {
                    // Đã đính chính là Dev -> LOẠI BỎ!
                    devSkippedCount++;
                    console.log(`[Zalo Sync] ❌ ĐÃ LOẠI BỎ Nhóm ${teamNum} vì bạn ấy đã xác nhận là DEV!`);
                } else if (isClarifiedGame) {
                    // Đã đính chính là Game -> NHẬN VÀO!
                    const teamName = `Nhóm ${teamNum}_Game`;
                    validGameReports.push({
                        sender_name: sender && !sender.includes("Nhóm") ? `${teamName} (${sender})` : teamName,
                        content: content,
                        reported_time: msg.time
                    });
                    console.log(`[Zalo Sync] ✅ ĐÃ CHẤP NHẬN ${teamName} vì bạn ấy đã xác nhận là GAME!`);
                } else {
                    console.log(`[Zalo Sync] ⏳ Nhóm ${teamNum} chưa có tin nhắn đính chính xác nhận là Game hay Dev. Tạm thời bỏ qua.`);
                }
            }
        }

        // Lọc trùng trong 1 lần quét
        const uniqueReports = [];
        const seen = new Set();
        for (const item of validGameReports) {
            const key = item.content.slice(0, 60);
            if (!seen.has(key)) {
                seen.add(key);
                uniqueReports.push(item);
            }
        }

        return {
            gameReports: uniqueReports,
            devSkippedCount: devSkippedCount
        };
    }

    // 5. Xử lý đồng bộ
    async function handleSync() {
        const btn = document.getElementById("zalo-sync-trigger-btn");
        const dropdown = document.getElementById("zalo-sync-group-dropdown");
        const targetGroup = dropdown ? dropdown.value : GROUP_1;

        if (btn) btn.innerHTML = `<span>⏳ Đang quét & đọc rep...</span>`;

        const rawList = extractAllRawMessages();
        const { gameReports, devSkippedCount } = analyzeMessagesWithReplies(rawList);

        if (gameReports.length === 0) {
            if (devSkippedCount > 0) {
                showToast(`ℹ️ Đã phát hiện và BỎ QUA ${devSkippedCount} báo cáo Dev (bao gồm cả các bạn đã rep đính chính là Dev)!`, "error");
            } else {
                showToast("⚠️ Không tìm thấy tin nhắn báo cáo Game nào trên màn hình hiện tại.", "error");
            }
            if (btn) btn.innerHTML = `<span>⚡ Đồng bộ Game</span>`;
            return;
        }

        try {
            const payload = {
                group_name: targetGroup,
                messages: gameReports
            };

            const res = await fetch("http://127.0.0.1:8000/api/zalo/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Lỗi HTTP: " + res.status);

            const data = await res.json();
            const devInfo = devSkippedCount > 0 ? ` (Đã tự động loại bỏ ${devSkippedCount} báo cáo Dev sau khi đọc rep)` : "";
            showToast(`✅ Đã đồng bộ ${data.added_count} báo cáo Game vào [${targetGroup}]!${devInfo}`, "success");
        } catch (err) {
            console.error(err);
            showToast("❌ Không thể kết nối tới Backend (http://127.0.0.1:8000). Hãy kiểm tra server!", "error");
        } finally {
            if (btn) btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span>⚡ Đồng bộ Game</span>
            `;
        }
    }

    function showToast(msg, type = "success") {
        const old = document.querySelector(".zalo-sync-toast");
        if (old) old.remove();

        const toast = document.createElement("div");
        toast.className = `zalo-sync-toast ${type === 'error' ? 'zalo-sync-toast-error' : ''}`;
        toast.innerText = msg;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 7000);
    }

    setInterval(injectFloatingWidget, 1500);
})();
