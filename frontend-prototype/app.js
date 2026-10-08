const categories = ["すべて", "キャリア", "学内交流", "ワークショップ"];
const seedEvents = [
  {
    id: "event-career",
    title: "就活スタートセミナー",
    category: "キャリア",
    date: "6月18日（木） 16:00〜17:30",
    venue: "2号館 301教室",
    description: "就職活動の進め方や準備のポイントを、先輩と一緒に学びます。",
    attendees: 18,
    cover: "就活の一歩を、\nここから。",
    tone: "blue",
    reserved: false,
  },
  {
    id: "event-cafe",
    title: "キャンパス交流カフェ",
    category: "学内交流",
    date: "6月20日（土） 13:00〜15:00",
    venue: "学生会館 ラウンジ",
    description: "学年や学科をこえて、気軽に交流できるカフェイベントです。",
    attendees: 24,
    cover: "学内でつながる、\n新しい出会い。",
    tone: "green",
    reserved: false,
  },
  {
    id: "event-design",
    title: "UIデザイン体験会",
    category: "ワークショップ",
    date: "6月24日（水） 14:00〜16:00",
    venue: "クリエイティブ室",
    description: "身近なサービスを題材に、画面づくりの基本を体験します。",
    attendees: 12,
    cover: "アイデアを、\nカタチにしよう。",
    tone: "orange",
    reserved: false,
  },
];

const app = document.querySelector("#app");
let events = load("campus-meet-events", seedEvents);
let reservations = load("campus-meet-reservations", []);
let page = "events";
let role = "student";
let selectedCategory = "すべて";
let searchQuery = "";
let selectedEventId = null;
let dialog = null;

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function save() {
  localStorage.setItem("campus-meet-events", JSON.stringify(events));
  localStorage.setItem("campus-meet-reservations", JSON.stringify(reservations));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function currentEvent() {
  return events.find((event) => event.id === selectedEventId) || events[0];
}

function icon(name) {
  const icons = { events: "▦", bookings: "▤", manage: "＋", attendees: "♙" };
  return icons[name] || "•";
}

function navItems() {
  if (role === "teacher") {
    return [
      ["teacher-events", "イベント管理", "events"],
      ["create-event", "イベントを作成", "manage"],
    ];
  }
  return [
    ["events", "イベントを探す", "events"],
    ["bookings", "自分の予約", "bookings"],
  ];
}

function shell(content, title) {
  const items = navItems();
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">S</div><div><p class="brand-name">Campus Meet</p><p class="brand-caption">CAMPUS EVENTS</p></div></div>
      <p class="nav-label">メニュー</p>
      <nav class="nav-list" aria-label="メインメニュー">
        ${items.map(([id, label, glyph]) => `<button class="nav-item ${page === id ? "active" : ""}" data-nav="${id}"><span class="nav-icon">${icon(glyph)}</span><span>${label}</span></button>`).join("")}
      </nav>
      <div class="nav-separator"></div>
      <p class="nav-label">アカウント</p>
      <div class="user-card"><div class="avatar">田</div><div><p class="user-name">田中 花子</p><p class="user-role">${role === "student" ? "学生" : "教員（デモ）"}</p></div></div>
    </aside>
    <main class="main-area">
      <header class="topbar"><div class="breadcrumb">ホーム　/　${escapeHtml(title)}</div><div class="topbar-actions"><button class="text-button" data-action="toggle-role">${role === "student" ? "教員画面を表示" : "学生画面を表示"}</button><button class="avatar-small" aria-label="ユーザー">田</button></div></header>
      <div class="content">${content}</div>
    </main>
    ${dialog ? dialogMarkup() : ""}
  </div>`;
}

function pageHeading(title, description, action = "") {
  return `<div class="page-heading"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action}</div>`;
}

function eventCard(event) {
  const badgeTone = { 学内交流: "green", ワークショップ: "orange", キャリア: "", その他: "lilac" }[event.category] || "";
  return `<article class="event-card">
    <div class="event-cover cover-${escapeHtml(event.tone || "blue")}"><span class="cover-date">JUN 18</span><h3 class="cover-title">${escapeHtml(event.cover || event.title).replaceAll("\n", "<br>")}</h3></div>
    <div class="event-body"><span class="badge ${badgeTone}">${escapeHtml(event.category)}</span><h3 class="event-title">${escapeHtml(event.title)}</h3>
      <div class="event-meta"><span>◷　${escapeHtml(event.date)}</span><span>⌖　${escapeHtml(event.venue)}</span></div>
      <p class="event-description">${escapeHtml(event.description)}</p>
      <div class="card-footer"><span class="capacity">参加予定　${event.attendees}名</span><button class="button small" data-action="details" data-id="${escapeHtml(event.id)}">詳細を見る　→</button></div>
    </div>
  </article>`;
}

function eventsPage() {
  const filtered = events.filter((event) => {
    const matchesCategory = selectedCategory === "すべて" || event.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [event.title, event.description, event.venue, event.category].some((part) => part.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
  const categorySelect = `<label class="select-box"><select id="category-select" aria-label="カテゴリで絞り込み">${categories.map((category) => `<option ${selectedCategory === category ? "selected" : ""}>${category}</option>`).join("")}</select><span>⌄</span></label>`;
  const chips = categories.map((category) => `<button class="chip ${selectedCategory === category ? "selected" : ""}" data-category="${category}">${category}</button>`).join("");
  const content = `${pageHeading("イベントを探す", "学内で開催されるイベントを見つけて、参加予約できます。", `<button class="button secondary" data-nav="bookings">予約したイベント　→</button>`)}
    <div class="toolbar"><label class="search-box"><span class="search-icon">⌕</span><input id="event-search" type="search" value="${escapeHtml(searchQuery)}" placeholder="イベント名、キーワードで検索" aria-label="イベントを検索"></label>${categorySelect}<span class="result-count">開催予定のイベント　${filtered.length}件</span></div>
    <div class="chips" aria-label="カテゴリ">${chips}</div>
    <div class="section-title"><div><h2>おすすめのイベント</h2><p>興味のあるイベントを選択してください</p></div></div>
    <div class="event-grid">${filtered.length ? filtered.map(eventCard).join("") : `<div class="empty-state"><strong>条件に合うイベントはありません</strong>キーワードやカテゴリを変更して、もう一度お試しください。</div>`}</div>`;
  return shell(content, "イベント");
}

function detailsPage() {
  const event = currentEvent();
  if (!event) return eventsPage();
  const reserved = reservations.includes(event.id);
  const content = `${pageHeading("イベント詳細", "内容を確認して、参加予約できます。", `<button class="button secondary" data-nav="events">← イベント一覧へ</button>`)}
    <div class="detail-layout"><section class="detail-panel"><div class="detail-cover"><span class="badge">${escapeHtml(event.category)}</span><h2>${escapeHtml(event.title)}</h2></div>
      <div class="detail-section"><h3>イベントについて</h3><p>${escapeHtml(event.description)} 学内の学生を対象としたイベントです。参加を希望する場合は、下の予約ボタンからお申し込みください。</p></div>
      <div class="detail-section"><h3>当日の流れ</h3><p>開始時刻までに会場へお越しください。受付で学生証を提示していただく場合があります。</p></div>
    </section><aside class="side-panel"><h3>開催情報</h3><div class="booking-summary">
      <div class="summary-row"><span>日時</span><strong>${escapeHtml(event.date)}</strong></div><div class="summary-row"><span>場所</span><strong>${escapeHtml(event.venue)}</strong></div><div class="summary-row"><span>参加予定</span><strong>${event.attendees}名</strong></div>
    </div><button class="button" data-action="reserve" data-id="${escapeHtml(event.id)}" ${reserved ? "disabled" : ""}>${reserved ? "予約済み" : "このイベントを予約する"}</button><p class="notice">予約内容は「自分の予約」から確認・キャンセルできます。</p></aside></div>`;
  return shell(content, "イベント詳細");
}

function bookingsPage() {
  const mine = reservations.map((id) => events.find((event) => event.id === id)).filter(Boolean);
  const content = `${pageHeading("自分の予約", "予約したイベントを確認できます。", `<button class="button secondary" data-nav="events">イベントを探す</button>`)}
    <div class="booking-list">${mine.length ? mine.map((event) => `<article class="booking-row"><div><span class="badge">予約済み</span><h3>${escapeHtml(event.title)}</h3><p>◷　${escapeHtml(event.date)}　　⌖　${escapeHtml(event.venue)}</p></div><div class="booking-actions"><button class="button secondary small" data-action="details" data-id="${escapeHtml(event.id)}">詳細</button><button class="button danger small" data-action="cancel-confirm" data-id="${escapeHtml(event.id)}">予約をキャンセル</button></div></article>`).join("") : `<div class="empty-state"><strong>予約したイベントはありません</strong>イベントを探して参加予約すると、ここに表示されます。</div>`}</div>`;
  return shell(content, "自分の予約");
}

function completePage() {
  const event = currentEvent();
  const content = `<section class="success-panel"><div class="success-icon">✓</div><h2>予約が完了しました</h2><p>${escapeHtml(event?.title || "イベント")}への参加予約を受け付けました。<br>イベント当日は開始時刻までに会場へお越しください。</p><button class="button" data-nav="bookings">予約内容を確認する</button><button class="button secondary" data-nav="events">イベント一覧に戻る</button></section>`;
  return shell(content, "予約完了");
}

function teacherEventsPage() {
  const content = `${pageHeading("イベント管理", "作成したイベントと参加状況を確認できます。", `<button class="button" data-nav="create-event">＋ イベントを作成</button>`)}
    <section class="table-panel"><h3>登録済みイベント</h3><div class="section-actions"><span class="result-count">${events.length}件のイベント</span></div>
      ${events.length ? `<table class="data-table"><thead><tr><th>イベント</th><th>開催日時</th><th>状態</th><th>参加者</th><th></th></tr></thead><tbody>${events.map((event) => `<tr><td><strong>${escapeHtml(event.title)}</strong><br><span class="capacity">${escapeHtml(event.category)}</span></td><td>${escapeHtml(event.date)}</td><td><span class="badge green">公開中</span></td><td>${event.attendees}名</td><td><button class="button secondary small" data-action="attendees" data-id="${escapeHtml(event.id)}">参加者</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty-state"><strong>イベントがありません</strong>最初のイベントを作成してください。</div>`}</section>`;
  return shell(content, "イベント管理");
}

function createEventPage() {
  const content = `${pageHeading("イベントを作成", "必要な情報を入力してイベントを登録します。", `<button class="button secondary" data-nav="teacher-events">← 一覧へ戻る</button>`)}
    <form class="form-panel" id="event-form"><h3>イベント情報</h3><div class="form-grid">
      <div class="field full"><label for="event-title">イベント名 *</label><input id="event-title" name="title" required maxlength="80" placeholder="例：学内交流会"></div>
      <div class="field"><label for="event-category">カテゴリ *</label><select id="event-category" name="category"><option>キャリア</option><option>学内交流</option><option>ワークショップ</option><option>その他</option></select></div>
      <div class="field"><label for="event-date">開催日時 *</label><input id="event-date" name="date" required placeholder="例：10月20日（火） 15:00〜16:00"></div>
      <div class="field full"><label for="event-venue">開催場所 *</label><input id="event-venue" name="venue" required placeholder="例：学生会館 2階"></div>
      <div class="field full"><label for="event-description">イベント詳細 *</label><textarea id="event-description" name="description" required placeholder="対象者や当日の内容を入力してください"></textarea></div>
    </div><div class="form-actions"><button type="button" class="button secondary" data-nav="teacher-events">キャンセル</button><button class="button" type="submit">イベントを登録</button></div></form>`;
  return shell(content, "イベント作成");
}

function attendeesPage() {
  const event = currentEvent();
  const content = `${pageHeading("参加者一覧", event ? `${event.title}　/　${event.attendees}名` : "イベントの参加状況を確認できます。", `<button class="button secondary" data-nav="teacher-events">← イベント管理へ</button>`)}
    <section class="table-panel"><h3>予約者</h3><table class="data-table"><thead><tr><th>氏名</th><th>学籍番号</th><th>予約日時</th><th>状態</th></tr></thead><tbody><tr><td>田中 花子</td><td>学生アカウント</td><td>予約済み</td><td><span class="badge green">参加予定</span></td></tr><tr><td>佐藤 太郎</td><td>学生アカウント</td><td>予約済み</td><td><span class="badge green">参加予定</span></td></tr></tbody></table><p class="notice">デモ表示です。参加者データはまだAPIに接続されていません。</p></section>`;
  return shell(content, "参加者一覧");
}

function dialogMarkup() {
  const event = events.find((item) => item.id === dialog?.id);
  if (!event) return "";
  const cancelling = dialog.type === "cancel";
  return `<div class="dialog-backdrop" role="presentation"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">${cancelling ? "予約をキャンセルしますか？" : "イベントを予約しますか？"}</h2><p>${escapeHtml(event.title)}<br>${escapeHtml(event.date)}<br><br>${cancelling ? "キャンセル後は、イベント一覧から再度予約できます。" : "このイベントへの参加予約を登録します。"}</p><div class="dialog-actions"><button class="button secondary" data-action="close-dialog">戻る</button><button class="button ${cancelling ? "danger" : ""}" data-action="confirm-dialog">${cancelling ? "キャンセルする" : "予約する"}</button></div></section></div>`;
}

function render() {
  const views = {
    events: eventsPage,
    details: detailsPage,
    bookings: bookingsPage,
    complete: completePage,
    "teacher-events": teacherEventsPage,
    "create-event": createEventPage,
    attendees: attendeesPage,
  };
  app.innerHTML = (views[page] || eventsPage)();
}

function navigate(nextPage) {
  page = nextPage;
  dialog = null;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

app.addEventListener("input", (event) => {
  if (event.target.id === "event-search") {
    searchQuery = event.target.value;
    const position = event.target.selectionStart;
    render();
    const input = document.querySelector("#event-search");
    input.focus();
    input.setSelectionRange(position, position);
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id === "category-select") {
    selectedCategory = event.target.value;
    render();
  }
});

app.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  const category = event.target.closest("[data-category]");
  const control = event.target.closest("[data-action]");
  if (nav) {
    navigate(nav.dataset.nav);
    return;
  }
  if (category) {
    selectedCategory = category.dataset.category;
    render();
    return;
  }
  if (!control) return;
  const { action, id } = control.dataset;
  if (action === "toggle-role") {
    role = role === "student" ? "teacher" : "student";
    navigate(role === "student" ? "events" : "teacher-events");
  } else if (action === "details") {
    selectedEventId = id;
    navigate("details");
  } else if (action === "reserve" || action === "cancel-confirm") {
    dialog = { type: action === "reserve" ? "reserve" : "cancel", id };
    render();
  } else if (action === "close-dialog") {
    dialog = null;
    render();
  } else if (action === "confirm-dialog") {
    const selected = dialog;
    if (selected.type === "reserve" && !reservations.includes(selected.id)) {
      reservations.push(selected.id);
      const eventData = events.find((item) => item.id === selected.id);
      if (eventData) eventData.attendees += 1;
      selectedEventId = selected.id;
      save();
      navigate("complete");
    } else if (selected.type === "cancel") {
      reservations = reservations.filter((item) => item !== selected.id);
      const eventData = events.find((item) => item.id === selected.id);
      if (eventData) eventData.attendees = Math.max(0, eventData.attendees - 1);
      save();
      navigate("bookings");
    }
  } else if (action === "attendees") {
    selectedEventId = id;
    navigate("attendees");
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "event-form") return;
  event.preventDefault();
  const form = new FormData(event.target);
  const title = String(form.get("title")).trim();
  events.unshift({
    id: `event-${Date.now()}`,
    title,
    category: String(form.get("category")),
    date: String(form.get("date")).trim(),
    venue: String(form.get("venue")).trim(),
    description: String(form.get("description")).trim(),
    attendees: 0,
    cover: title,
    tone: "lilac",
    reserved: false,
  });
  save();
  navigate("teacher-events");
});

render();
