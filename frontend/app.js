// ════════════════════════════════════════════════════════════════
//  ScamShield — app.js
//  Dùng chung với index.html
//  Yêu cầu: backend chạy tại http://localhost:5100/check
// ════════════════════════════════════════════════════════════════

// ── BNB Testnet Config ───────────────────────────────────────────
const BNB_TESTNET = {
  chainId: "0x61",                    // 97 decimal
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

// ── Quick-fill examples (các nút chip) ──────────────────────────
const EXAMPLES = {
  link:   "https://bnb-airdrop-claim.xyz/free-token?ref=123456",
  wallet: "0x000000000000000000000000000000000000dEaD",
  msg:    "Chúc mừng bạn đã trúng thưởng 500 USDT! Gửi 0.05 BNB để nhận thưởng ngay hôm nay. Liên hệ: t.me/bnb_support_official",
  tx:     "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1",
};

/**
 * Điền nội dung mẫu vào textarea khi bấm chip.
 * @param {"link"|"wallet"|"msg"|"tx"} type
 */
function fill(type) {
  const ta = document.getElementById("scamInput");
  ta.value = EXAMPLES[type] || "";
  updCount(ta);
  ta.focus();
}

// ── Character counter ────────────────────────────────────────────
/**
 * Cập nhật số ký tự hiển thị bên cạnh label textarea.
 * @param {HTMLTextAreaElement} el
 */
function updCount(el) {
  const counter = document.getElementById("charCount");
  if (counter) counter.textContent = el.value.length + " ký tự";
}

// ── Clear / reset ────────────────────────────────────────────────
/**
 * Xoá textarea và reset kết quả về trạng thái ban đầu.
 */
function clearAll() {
  const ta = document.getElementById("scamInput");
  ta.value = "";
  updCount(ta);
  setRes(
    'Nhập nội dung và nhấn "Phân tích ngay" để bắt đầu kiểm tra.',
    "",
    "Chờ phân tích"
  );
}

// ── Result UI ────────────────────────────────────────────────────
/**
 * Hiển thị kết quả phân tích với màu sắc phù hợp.
 * @param {string} txt                          - Nội dung hiển thị
 * @param {"safe"|"danger"|"warn"|""} type      - Loại kết quả
 * @param {string} st                           - Dòng trạng thái ngắn
 */
function setRes(txt, type, st) {
  const box    = document.getElementById("resBox");
  const el     = document.getElementById("result");
  const ico    = document.getElementById("resIco");
  const status = document.getElementById("resSt");

  // Đổi màu border/background theo loại kết quả
  box.className = "res-box" + (type ? " " + type : "");

  el.textContent     = txt;
  ico.textContent    = { safe: "✓", danger: "✕", warn: "!" }[type] || "?";
  status.textContent = st || "Chờ phân tích";

  // Re-trigger CSS entrance animation
  box.style.animation = "none";
  requestAnimationFrame(() => {
    box.style.animation = "resIn .3s ease both";
  });
}

// ── Scan progress bar & button state ────────────────────────────
let _scanInterval;

/**
 * Bật/tắt trạng thái loading: disable nút, chạy progress bar.
 * @param {boolean} on
 */
function setScanLoading(on) {
  const btn  = document.getElementById("btnScan");
  const txt  = document.getElementById("btnTxt");
  const bar  = document.getElementById("scanBar");
  const fill = document.getElementById("scanFill");

  btn.disabled = on;

  if (on) {
    txt.innerHTML = '<span class="spin"></span> Đang phân tích...';
    bar.classList.add("on");

    // Giả lập progress tăng dần đến 85%, dừng lại chờ response
    let w = 0;
    _scanInterval = setInterval(() => {
      w = Math.min(w + Math.random() * 10, 85);
      fill.style.width = w + "%";
    }, 200);

  } else {
    clearInterval(_scanInterval);
    fill.style.width = "100%";           // nhảy 100% khi có kết quả
    setTimeout(() => {
      bar.classList.remove("on");
      fill.style.width = "0%";
    }, 400);
    txt.textContent = "Phân tích ngay";
  }
}

// ── Wallet UI helper ─────────────────────────────────────────────
/**
 * Cập nhật đồng thời nút ví trên desktop và mobile.
 * @param {string} label - Text hiển thị trên nút
 * @param {string} cls   - CSS class bổ sung (vd: "connected")
 */
function setWUI(label, cls) {
  const targets = [
    ["btnConnect",    "lblDesk"],
    ["btnConnectMob", "lblMob"],
  ];
  targets.forEach(([btnId, lblId]) => {
    const btn = document.getElementById(btnId);
    const lbl = document.getElementById(lblId);
    if (btn) btn.className = "btn-wallet" + (cls ? " " + cls : "");
    if (lbl) lbl.textContent = label;
  });
}

// ── Connect Wallet ───────────────────────────────────────────────
/**
 * Kết nối MetaMask và chuyển sang BNB Testnet.
 * Xử lý đúng khi có nhiều wallet extension cùng lúc.
 */
async function connectWallet() {
  // Tìm đúng MetaMask trong danh sách providers
  let provider;
  if (window.ethereum?.providers) {
    provider = window.ethereum.providers.find(
      (p) => p.isMetaMask && !p.isCoinbaseWallet
    );
  } else if (window.ethereum?.isMetaMask) {
    provider = window.ethereum;
  }

  if (!provider) {
    alert("Vui lòng cài MetaMask trước khi kết nối!");
    return;
  }

  try {
    setWUI("Đang kết nối...", "");

    // Yêu cầu quyền truy cập tài khoản
    const accounts = await provider.request({ method: "eth_requestAccounts" });

    // Chuyển sang / thêm BNB Testnet
    await switchToBNBTestnet(provider);

    // Hiển thị địa chỉ rút gọn: 0x1234...abcd
    const short = accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4);
    setWUI(short, "connected");

    // Lắng nghe khi user đổi account trong MetaMask
    provider.on("accountsChanged", (accs) => {
      if (!accs.length) {
        setWUI("Kết nối ví", "");
      } else {
        const s = accs[0].slice(0, 6) + "..." + accs[0].slice(-4);
        setWUI(s, "connected");
      }
    });

    // Reload khi user đổi network
    provider.on("chainChanged", () => location.reload());

  } catch (err) {
    setWUI("Kết nối ví", "");
    // Bỏ qua lỗi user từ chối (4001), log các lỗi còn lại
    if (err.code !== 4001) console.error("connectWallet:", err);
  }
}

// ── Switch / Add BNB Testnet ─────────────────────────────────────
/**
 * Chuyển MetaMask sang BNB Testnet.
 * Nếu chưa có trong danh sách → tự động thêm vào.
 * @param {object} provider - MetaMask EIP-1193 provider
 */
async function switchToBNBTestnet(provider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BNB_TESTNET.chainId }],
    });
  } catch (err) {
    // Error 4902: network chưa có trong MetaMask → thêm mới
    if (err.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [BNB_TESTNET],
      });
    } else {
      throw err;
    }
  }
}

// ── Scam Checker ─────────────────────────────────────────────────
/**
 * Gửi nội dung tới backend và hiển thị kết quả phân tích.
 * Tự động phân loại: safe / danger / warn dựa trên text trả về.
 */
async function checkScam() {
  const input = document.getElementById("scamInput").value.trim();

  // Validate: không cho submit khi rỗng
  if (!input) {
    setRes("⚠️ Vui lòng nhập nội dung cần kiểm tra.", "warn", "Thiếu dữ liệu");
    return;
  }

  setScanLoading(true);
  setRes("Đang phân tích bằng AI...", "", "Đang xử lý");

  try {
    const res = await fetch("http://localhost:5101/check", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: input }),
    });

    // Kiểm tra HTTP status
    if (!res.ok) {
      throw new Error(`Server lỗi: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Kiểm tra format response
    if (!data || typeof data.result === "undefined") {
      throw new Error("Response từ server không hợp lệ");
    }

    // Tự động phân loại kết quả dựa trên keywords
    const lower = data.result.toLowerCase();
    const type =
      lower.includes("scam") || lower.includes("lừa") || lower.includes("nguy hiểm")
        ? "danger"
        : lower.includes("an toàn") || lower.includes("safe")
        ? "safe"
        : "warn";

    const statusMap = {
      danger: "⚠️ Phát hiện Scam",
      safe:   "✅ An toàn",
      warn:   "⚡ Cần chú ý",
    };

    setRes(data.result, type, statusMap[type]);

    // Đẩy vào lịch sử
    pushHistory(
      input.slice(0, 40) + (input.length > 40 ? "..." : ""),
      type
    );

  } catch (err) {
    const isNetworkErr =
      err.message.includes("Failed to fetch") || err.name === "TypeError";

    setRes(
      isNetworkErr
        ? "Không thể kết nối server. Hãy chắc chắn backend đang chạy tại localhost:8000"
        : "Lỗi: " + err.message,
      "danger",
      "Lỗi hệ thống"
    );
    console.error("checkScam:", err);

  } finally {
    setScanLoading(false);
  }
}

// ── History list ─────────────────────────────────────────────────
/**
 * Thêm 1 mục mới vào đầu danh sách lịch sử (tối đa 6 mục).
 * @param {string} msg                          - Nội dung rút gọn
 * @param {"safe"|"danger"|"warn"} type
 */
function pushHistory(msg, type) {
  const list   = document.getElementById("histList");
  if (!list) return;

  const badges = { safe: "AN TOÀN", danger: "SCAM", warn: "CẢNH BÁO" };

  const item = document.createElement("div");
  item.className    = "hist-item";
  item.style.animation = "resIn .3s ease both";
  item.innerHTML = `
    <div class="h-dot ${type}"></div>
    <div class="h-txt">
      <div class="h-msg">${msg}</div>
      <div class="h-time">Vừa xong</div>
    </div>
    <span class="h-badge ${type}">${badges[type]}</span>`;

  list.insertBefore(item, list.firstChild);

  // Giữ tối đa 6 mục trong danh sách
  if (list.children.length > 6) list.removeChild(list.lastChild);
}

// ── Keyboard shortcut ────────────────────────────────────────────
// Ctrl + Enter để submit nhanh mà không cần dùng chuột
document.addEventListener("DOMContentLoaded", () => {
  const ta = document.getElementById("scamInput");
  if (ta) {
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) checkScam();
    });
  }
});