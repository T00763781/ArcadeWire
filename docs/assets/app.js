import { createExchange, decodeCode, formatCode, qrToSvg, resolveExchange } from "./lib.js";

function qs(root, sel) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`missing element: ${sel}`);
  return el;
}

const view = document.querySelector("[data-view]");
if (!view) {
  // No client logic.
} else if (view.getAttribute("data-view") === "create") {
  bootCreate(view);
} else if (view.getAttribute("data-view") === "enter") {
  bootEnter(view);
}

function bootCreate(root) {
  const createBtn = qs(root, "[data-action='create']");
  const result = qs(root, ".result");
  const codeEl = qs(root, "[data-bind='code']");
  const expiresEl = qs(root, "[data-bind='expires']");
  const copyBtn = qs(root, "[data-action='copy']");
  const qrBtn = qs(root, "[data-action='qr']");
  const toast = qs(root, "[data-bind='toast']");
  const qrDialog = document.querySelector("[data-modal='qr']");
  const qrWrap = qs(qrDialog, "[data-bind='qr']");
  const closeQr = qs(qrDialog, "[data-action='close-qr']");

  let last = null;
  let timer = null;

  createBtn.addEventListener("click", async () => {
    createBtn.disabled = true;
    hide(toast);
    try {
      last = createExchange();
      codeEl.textContent = last.code;
      copyBtn.disabled = false;
      qrBtn.disabled = false;
      show(result);

      if (timer) clearInterval(timer);
      timer = setInterval(() => renderExpiry(), 500);
      renderExpiry();
    } catch {
      toast.textContent = "Couldn’t create an ArcadeWire. Try again.";
      show(toast);
    } finally {
      createBtn.disabled = false;
    }
  });

  copyBtn.addEventListener("click", async () => {
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.code);
      toast.textContent = "Copied.";
      show(toast);
      setTimeout(() => hide(toast), 1100);
    } catch {
      toast.textContent = "Copy failed — select the code and copy manually.";
      show(toast);
    }
  });

  qrBtn.addEventListener("click", () => {
    if (!last) return;
    qrWrap.innerHTML = qrToSvg(last.code, 6);
    qrDialog.showModal();
  });

  closeQr.addEventListener("click", () => qrDialog.close());

  function renderExpiry() {
    if (!last) return;
    const ms = last.expiresAt - Date.now();
    if (ms <= 0) {
      expiresEl.textContent = "Expired";
      expiresEl.style.color = "var(--bad)";
      return;
    }
    const sec = Math.ceil(ms / 1000);
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    expiresEl.textContent = `Expires in ${min}:${String(rem).padStart(2, "0")}`;
    expiresEl.style.color = "";
  }
}

function bootEnter(root) {
  const input = qs(root, "[data-bind='codeInput']");
  const status = qs(root, "[data-bind='status']");
  const connectBtn = qs(root, "[data-action='connect']");
  const outcome = qs(root, "[data-bind='outcome']");

  let lastOk = null;

  input.addEventListener("input", () => {
    const raw = input.value;
    const parsed = decodeCode(raw);
    lastOk = parsed.ok ? parsed : null;

    if (!raw.trim()) {
      status.textContent = "";
      status.className = "status";
      connectBtn.disabled = true;
      hide(outcome);
      return;
    }

    if (parsed.ok) {
      status.textContent = parsed.checksumPresent ? "✓ Valid code" : "✓ Looks valid";
      status.className = "status good";
      connectBtn.disabled = false;
      input.value = formatCode(raw);
    } else {
      status.textContent =
        parsed.reason === "checksum_mismatch"
          ? "That code looks mistyped"
          : parsed.reason === "unknown_words"
            ? "Unknown words"
            : "Invalid format";
      status.className = "status bad";
      connectBtn.disabled = true;
    }
  });

  connectBtn.addEventListener("click", async () => {
    hide(outcome);
    connectBtn.disabled = true;
    try {
      if (!lastOk) throw new Error("That doesn’t look like an ArcadeWire code.");
      const result = resolveExchange(lastOk.exchangeId);
      if (!result.ok) throw new Error(result.message);

      outcome.textContent = "Connected.";
      outcome.style.borderColor = "rgba(62,224,137,0.35)";
      outcome.style.background = "rgba(62,224,137,0.08)";
      show(outcome);
    } catch (e) {
      outcome.textContent = (e && e.message) || "Couldn’t connect.";
      outcome.style.borderColor = "rgba(255,107,107,0.35)";
      outcome.style.background = "rgba(255,107,107,0.07)";
      show(outcome);
    } finally {
      connectBtn.disabled = !lastOk;
    }
  });
}

function show(el) {
  el.hidden = false;
}

function hide(el) {
  el.hidden = true;
}

