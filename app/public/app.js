const state = {
  snapshot: null,
  selectedWeekStart: null,
  lastConfirmation: null,
  activeFeedbackSessionId: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const icons = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>',
  layout: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
  calendar: '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path>',
  "calendar-check": '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M3 10h18"></path><path d="m9 16 2 2 4-4"></path>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>',
  trend: '<path d="m3 17 6-6 4 4 8-8"></path><path d="M14 7h7v7"></path>',
  utensils: '<path d="M4 3v7"></path><path d="M8 3v7"></path><path d="M6 3v19"></path><path d="M14 3v8a4 4 0 0 0 4 4h2"></path><path d="M18 3v19"></path>',
  fridge: '<path d="M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"></path><path d="M3 10h18"></path><path d="M7 6h.01"></path><path d="M7 14h.01"></path>',
  refresh: '<path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7"></path><path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7"></path><path d="M3 21v-6h6"></path><path d="M21 3v6h-6"></path>',
  scale: '<path d="m16 16 3-8 3 8c-.9.7-1.8 1-3 1s-2.1-.3-3-1Z"></path><path d="m2 16 3-8 3 8c-.9.7-1.8 1-3 1s-2.1-.3-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h18"></path>',
  target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>',
  plus: '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8"></path><path d="M7 3v5h8"></path>',
  edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
  arrow: '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  check: '<path d="M20 6 9 17l-5-5"></path>',
  trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>'
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ""}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icon(node.dataset.icon);
  });
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.hidden = false;
  setTimeout(() => {
    node.hidden = true;
  }, 2600);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function load() {
  state.snapshot = await api("/api/snapshot");
  if (!state.selectedWeekStart) state.selectedWeekStart = weekStart(today());
  render();
}

async function reloadAfterSave(message, options = {}) {
  state.lastConfirmation = {
    message,
    detail: options.detail || "",
    target: options.target || "",
    at: new Date()
  };
  await load();
  toast(message);
  highlightTarget(options.target);
}

function render() {
  hydrateIcons();
  activateView(currentView());
  renderProfile();
  renderConfirmation();
  renderWeekControls();
  renderMetrics();
  renderObjectiveSummary();
  renderPlanned();
  renderRecovery();
  renderForms();
  renderTables();
  renderMacroTargets();
  renderMealPlans();
  renderFridge();
  renderCharts();
}

function renderProfile() {
  const profile = state.snapshot.profile;
  $("#phaseLine").textContent = shortText(`${profile.known_data?.goals?.current_phase || "Phase actuelle"} · ${profile.current_period || ""}`, 140);
}

function renderConfirmation() {
  const banner = $("#syncBanner");
  if (!banner) return;
  if (!state.lastConfirmation) {
    banner.hidden = true;
    return;
  }

  const time = state.lastConfirmation.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  banner.hidden = false;
  banner.innerHTML = `
    <span>${icon("check")}</span>
    <div>
      <strong>${escapeHtml(state.lastConfirmation.message)}</strong>
      <small>${escapeHtml(state.lastConfirmation.detail || `Données mises à jour à ${time}`)}</small>
    </div>
  `;
}

function highlightTarget(selector) {
  if (!selector) return;
  requestAnimationFrame(() => {
    const target = $(selector);
    if (!target) return;
    target.classList.remove("just-updated");
    void target.offsetWidth;
    target.classList.add("just-updated");
  });
}

function renderMetrics() {
  const { profile, planned, workouts, body } = state.snapshot;
  const latestBody = [...body].reverse().find((row) => row.weight_kg || row.estimated_bodyfat_percent);
  const visiblePlanned = plannedForSelectedWeek();
  const done = visiblePlanned.filter((session) => session.status === "done").length;
  const latestPain = [...workouts].reverse().find((row) => row.pain)?.pain;

  $("#weightMetric").textContent = latestBody?.weight_kg ? `${latestBody.weight_kg} kg` : `${profile.known_data?.profile_physical?.weight_kg ?? "-"} kg`;
  $("#bodyfatMetric").textContent = latestBody?.estimated_bodyfat_percent
    ? `${latestBody.estimated_bodyfat_percent}%`
    : `${profile.known_data?.profile_physical?.estimated_bodyfat_percent ?? "-"}%`;
  $("#weekMetric").textContent = `${done}/${visiblePlanned.length}`;
  $("#kneeMetric").textContent = latestPain || profile.known_data?.profile_physical?.knees_current_status || "-";
}

function renderObjectiveSummary() {
  const profile = state.snapshot.profile;
  const latestBody = [...state.snapshot.body].reverse().find((row) => row.weight_kg || row.estimated_bodyfat_percent);
  const targets = state.snapshot.nutritionTargets?.targets || [];
  const trainingTarget = targets.find((target) => target.id === "training_day") || targets[0];
  const restTarget = targets.find((target) => target.id === "rest_day") || targets[1];

  $("#objectiveText").textContent = profile.current_objective || "Objectif à préciser.";
  $("#objectiveFacts").innerHTML = [
    { label: "Phase", value: profile.known_data?.goals?.current_phase || "-" },
    { label: "Période", value: shortText(profile.current_period || "-", 72) },
    { label: "Dernière mesure", value: [latestBody?.weight_kg ? `${latestBody.weight_kg} kg` : "", latestBody?.estimated_bodyfat_percent ? `${latestBody.estimated_bodyfat_percent}% BF` : ""].filter(Boolean).join(" · ") || "-" },
    { label: "Macros entraînement", value: trainingTarget ? `${Math.round(trainingTarget.kcal)} kcal · ${Math.round(trainingTarget.protein_g)}P/${Math.round(trainingTarget.carbs_g)}G/${Math.round(trainingTarget.fat_g)}L` : "-" },
    { label: "Macros repos", value: restTarget ? `${Math.round(restTarget.kcal)} kcal · ${Math.round(restTarget.protein_g)}P/${Math.round(restTarget.carbs_g)}G/${Math.round(restTarget.fat_g)}L` : "-" }
  ].map((item) => `
    <span>
      <small>${escapeHtml(item.label)}</small>
      <strong>${escapeHtml(item.value)}</strong>
    </span>
  `).join("");
}

function renderRecentActivity() {
  const node = $("#recentActivity");
  if (!node) return;

  const { workouts, body, nutrition, running, recovery, fridge } = state.snapshot;
  const items = [
    ...latestRows(body, 3).map((row, index) => ({
      date: row.date,
      order: 60 - index,
      icon: "scale",
      type: "Pesée",
      title: [row.weight_kg ? `${row.weight_kg} kg` : "", row.estimated_bodyfat_percent ? `${row.estimated_bodyfat_percent}% BF` : ""].filter(Boolean).join(" · ") || "Mesure corporelle",
      detail: row.notes || "Poids/bodyfat enregistrés"
    })),
    ...latestRows(workouts, 4).map((row, index) => ({
      date: row.date,
      order: 50 - index,
      icon: row.session_type === "running" ? "trend" : row.session_type === "sport" ? "calendar-check" : "clipboard",
      type: "Séance",
      title: sessionTypeLabel(row.session_type),
      detail: [
        row.duration_min ? `${row.duration_min} min` : "",
        row.rpe_global ? `RPE ${row.rpe_global}/10` : "",
        row.pain ? `Douleur: ${row.pain}` : "",
        row.notes ? shortText(row.notes, 70) : ""
      ].filter(Boolean).join(" · ") || "Retour séance enregistré"
    })),
    ...latestRows(running, 2).map((row, index) => ({
      date: row.date,
      order: 40 - index,
      icon: "trend",
      type: "Course",
      title: [row.distance_km ? `${row.distance_km} km` : "", row.pace || ""].filter(Boolean).join(" · ") || "Running",
      detail: [row.duration_min ? `${row.duration_min} min` : "", row.notes ? shortText(row.notes, 70) : ""].filter(Boolean).join(" · ") || "Sortie enregistrée"
    })),
    ...latestRows(nutrition, 3).map((row, index) => ({
      date: row.date,
      order: 30 - index,
      icon: "utensils",
      type: "Repas",
      title: row.meal_time || "Repas",
      detail: [row.meal_description ? shortText(row.meal_description, 80) : "", row.calories ? `${row.calories} kcal` : ""].filter(Boolean).join(" · ") || "Repas enregistré"
    })),
    ...latestRows(recovery, 3).map((row, index) => ({
      date: row.date,
      order: 20 - index,
      icon: row.type === "mobility" ? "refresh" : "shield",
      type: row.type === "mobility" ? "Mobilité" : "Étirements",
      title: row.done === "true" ? "Fait" : "Non fait",
      detail: row.notes || "Récupération enregistrée"
    }))
  ];

  if (fridge?.last_updated) {
    items.push({
      date: fridge.last_updated.slice(0, 10),
      order: 10,
      icon: "fridge",
      type: "Frigo",
      title: `${fridge.items?.length || 0} aliment${fridge.items?.length > 1 ? "s" : ""}`,
      detail: "Inventaire frigo mis à jour"
    });
  }

  const sorted = items
    .filter((item) => item.date)
    .sort((a, b) => `${b.date}-${b.order}`.localeCompare(`${a.date}-${a.order}`))
    .slice(0, 4);

  node.innerHTML = sorted.length
    ? sorted.map((item) => `
      <article class="recent-card">
        <span class="recent-icon">${icon(item.icon)}</span>
        <div>
          <div class="recent-meta">
            <strong>${escapeHtml(item.type)}</strong>
            <small>${formatDate(item.date)}</small>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      </article>
    `).join("")
    : '<p class="empty-week">Aucune donnée enregistrée pour le moment.</p>';
}

function currentView() {
  const view = window.location.hash.replace("#", "");
  return ["dashboard", "week", "log", "progress", "nutrition", "fridge"].includes(view) ? view : "dashboard";
}

function activateView(view) {
  $$(".section").forEach((section) => {
    const active = section.id === view;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });
  $$("[data-view-link]").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === view));
  const title = $("#viewTitle");
  if (title) {
    title.textContent = {
      dashboard: "Accueil",
      week: "Semaine",
      log: "Saisie",
      progress: "Progression",
      nutrition: "Nutrition",
      fridge: "Frigo"
    }[view] || "Accueil";
  }
}

function latestRows(rows = [], limit = 3) {
  return [...rows].filter((row) => row.date).reverse().slice(0, limit);
}

function sessionTypeLabel(type) {
  return {
    strength: "Musculation",
    mobility: "Mobilité",
    sport: "Sport principal",
    running: "Course",
    recovery: "Récupération"
  }[type] || "Séance";
}

function renderWeekControls() {
  const select = $("#weekSelect");
  if (!select) return;

  const weeks = availableWeeks();
  if (!weeks.includes(state.selectedWeekStart)) weeks.push(state.selectedWeekStart);
  weeks.sort();

  select.innerHTML = weeks.map((week) => `<option value="${week}">${weekLabel(week)}</option>`).join("");
  select.value = state.selectedWeekStart;

  select.onchange = () => {
    state.selectedWeekStart = select.value;
    render();
  };

  $("#currentWeekBtn").onclick = () => {
    state.selectedWeekStart = weekStart(today());
    render();
  };
}

function renderPlanned() {
  const list = $("#plannedList");
  list.innerHTML = "";
  const sessions = plannedForSelectedWeek();
  if (!sessions.length) {
    list.innerHTML = '<article class="panel empty-week">Aucune séance prévue sur cette semaine.</article>';
    return;
  }

  for (const session of sessions) {
    const hasFeedback = hasWorkoutFeedback(session.id);
    const isClosed = ["done", "missed"].includes(session.status);
    const card = document.createElement("article");
    card.className = `week-row ${session.type || "session"} ${hasFeedback ? "has-feedback" : ""}`;
    card.dataset.sessionId = session.id;
    card.innerHTML = `
      <details>
        <summary>
          <span class="week-day">${dayLabel(session.date)}</span>
          <span class="week-main">
            <strong>${escapeHtml(session.title)}</strong>
            <small>${typeLabel(session.type)}${session.start_time ? ` · ${session.start_time}${session.end_time ? `-${session.end_time}` : ""}` : ""}${session.planned_duration_min ? ` · ${session.planned_duration_min} min` : ""}</small>
          </span>
          <span class="badge ${session.status}">${statusLabel(session.status)}</span>
          <span class="week-toggle">${icon("arrow")}</span>
        </summary>
        <div class="week-details">
          ${session.focus ? `<p class="session-note"><strong>Objectif:</strong> ${escapeHtml(session.focus)}</p>` : ""}
          ${session.notes ? `<p class="session-note">${escapeHtml(session.notes)}</p>` : ""}
          ${renderSessionDetails(session)}
          ${session.status_reason ? `<p><strong>Raison:</strong> ${escapeHtml(session.status_reason)}</p>` : ""}
          ${hasFeedback ? `
            <div class="feedback-state">
              ${icon("check")}
              <span>
                <strong>Retour enregistré</strong>
                ${session.last_feedback ? `<small>${escapeHtml(shortText(session.last_feedback, 95))}</small>` : "<small>Tu peux le modifier si besoin.</small>"}
              </span>
            </div>
          ` : ""}
          ${session.type === "mobility" ? `
            <label class="quick-check">
              <input type="checkbox" data-recovery-type="mobility" data-recovery-date="${session.date}" data-recovery-session="${session.id}" ${isRecoveryDone(session.date, "mobility", session.id) ? "checked" : ""} />
              Mobilité faite
            </label>
          ` : ""}
          ${isClosed ? `<button class="secondary session-edit-toggle" data-toggle-actions="${session.id}" type="button">${icon("edit")}Modifier</button>` : ""}
          <div class="session-actions ${isClosed ? "is-hidden" : ""}" data-actions-for="${session.id}">
            ${session.type === "mobility" ? "" : `<button class="${hasFeedback ? "saved-return-button" : "primary"}" data-log-session="${session.id}">${icon(hasFeedback ? "check" : "clipboard")}${hasFeedback ? "Retour enregistré" : "Saisir retour"}</button>`}
            <button class="secondary" data-status="done" data-id="${session.id}" data-date="${session.date}">${icon("check")}Faite</button>
            <button class="ghost-danger" data-status="missed" data-id="${session.id}" data-date="${session.date}">${icon("x")}Non faite</button>
            <button class="ghost-warn" data-status="moved" data-id="${session.id}">${icon("arrow")}Déplacée</button>
          </div>
        </div>
      </details>
    `;
    list.appendChild(card);
  }

  $$("[data-log-session]").forEach((button) => {
    button.addEventListener("click", () => {
      prefillWorkout(button.dataset.logSession);
      window.location.hash = "log";
      activateView("log");
      $("#log").scrollIntoView({ behavior: "smooth", block: "start" });
      highlightTarget("#log");
      toast(hasWorkoutFeedback(button.dataset.logSession) ? "Retour existant chargé. Tu peux le modifier." : "Formulaire prérempli. Enregistre le retour après ta séance.");
    });
  });

  $$("[data-toggle-actions]").forEach((button) => {
    button.addEventListener("click", () => {
      const actions = $(`[data-actions-for="${button.dataset.toggleActions}"]`);
      actions?.classList.toggle("is-hidden");
      button.textContent = actions?.classList.contains("is-hidden") ? "Modifier" : "Masquer";
      button.prepend(document.createRange().createContextualFragment(icon("edit")));
    });
  });

  $$("[data-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const label = {
        done: "Note courte sur la séance faite ?",
        missed: "Pourquoi la séance n'a pas été faite ?",
        moved: "Note courte ou nouvelle date ?"
      }[button.dataset.status] || "Note courte ?";
      const reason = window.prompt(label, "") || "";
      await api("/api/session-status", {
        method: "POST",
        body: JSON.stringify({
          id: button.dataset.id,
          status: button.dataset.status,
          reason,
          date: button.dataset.date || "",
          completed_date: button.dataset.status === "done" ? button.dataset.date : "",
          moved_to: button.dataset.status === "moved" ? reason : ""
        })
      });
      await reloadAfterSave("Statut de séance mis à jour", {
        detail: `${button.dataset.status === "done" ? "Séance marquée faite" : button.dataset.status === "missed" ? "Séance marquée non faite" : "Séance marquée déplacée"}`,
        target: "#week"
      });
    });
  });
}

function sessionIcon(type) {
  return {
    strength: "activity",
    sport: "calendar-check",
    running: "trend",
    mobility: "refresh",
    recovery: "shield"
  }[type] || "calendar";
}

function typeLabel(type) {
  return {
    strength: "Salle",
    sport: "Sport principal",
    running: "Course",
    mobility: "Mobilité",
    recovery: "Récupération"
  }[type] || "Séance";
}

function dayLabel(date) {
  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date(`${date}T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function renderSessionDetails(session) {
  if (!["strength", "mobility"].includes(session.type) || !Array.isArray(session.exercises) || !session.exercises.length) {
    return "";
  }

  return `
    <div class="session-detail">
      <h4>Détail séance</h4>
      ${session.warmup ? `<p><strong>Échauffement:</strong> ${escapeHtml(session.warmup)}</p>` : ""}
      <ol>
        ${session.exercises.map((exercise) => `
          <li class="exercise-line">
            <strong>${escapeHtml(exercise.name || "")}</strong>
            <small>
              <span>${escapeHtml(exercise.sets || "?")}x${escapeHtml(exercise.reps || "?")}</span>
              <span>${exercise.load_kg !== undefined && exercise.load_kg !== "" ? `@ ${escapeHtml(exercise.load_kg)} kg` : ""}</span>
              <span>${exercise.rpe ? `RPE ${escapeHtml(exercise.rpe)}` : ""}</span>
              <span>${exercise.rest_sec ? `repos ${escapeHtml(exercise.rest_sec)}s` : ""}</span>
            </small>
          </li>
        `).join("")}
      </ol>
      ${session.incline_walk ? `<p><strong>Fin:</strong> ${escapeHtml(session.incline_walk)}</p>` : ""}
    </div>
  `;
}

function hasWorkoutFeedback(sessionId) {
  return state.snapshot.workouts.some((row) => row.planned_or_unplanned === `planned:${sessionId}`);
}

function renderRecovery() {
  const list = $("#recoveryList");
  if (!list) return;

  const dates = weekDatesFromPlan();
  list.innerHTML = dates.map((date) => `
    <article class="recovery-card">
      <strong>${formatDate(date)}</strong>
      <label class="check-line">
        <input type="checkbox" data-recovery-type="stretching" data-recovery-date="${date}" ${isRecoveryDone(date, "stretching") ? "checked" : ""} />
        Étirements soir
      </label>
    </article>
  `).join("");

  $$("[data-recovery-type]").forEach((input) => {
    input.addEventListener("change", async () => {
      await api("/api/recovery", {
        method: "POST",
        body: JSON.stringify({
          date: input.dataset.recoveryDate,
          type: input.dataset.recoveryType,
          done: input.checked,
          planned_session_id: input.dataset.recoverySession || "",
          notes: input.dataset.recoveryType === "stretching" ? "Etirements du soir" : "Mobilite cochee depuis le dashboard"
        })
      });
      toast(input.checked ? "Récupération cochée" : "Récupération décochée");
      await load();
    });
  });
}

function weekDatesFromPlan() {
  const start = dateFromYmd(state.selectedWeekStart || weekStart(today()));
  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    const cursor = new Date(start);
    cursor.setDate(start.getDate() + index);
    dates.push(ymd(cursor));
  }
  return dates;
}

function plannedForSelectedWeek() {
  const start = state.selectedWeekStart || weekStart(today());
  const end = addDays(start, 7);
  return state.snapshot.planned
    .filter((session) => session.date >= start && session.date < end)
    .sort((a, b) => `${a.date} ${a.start_time || ""}`.localeCompare(`${b.date} ${b.start_time || ""}`));
}

function availableWeeks() {
  return [...new Set(state.snapshot.planned.map((session) => weekStart(session.date)).filter(Boolean))];
}

function weekStart(dateString) {
  const date = dateFromYmd(dateString);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return ymd(date);
}

function addDays(dateString, days) {
  const date = dateFromYmd(dateString);
  date.setDate(date.getDate() + days);
  return ymd(date);
}

function dateFromYmd(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function ymd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekLabel(startString) {
  const endString = addDays(startString, 6);
  const label = `${formatDate(startString)} - ${formatDate(endString)}`;
  return startString === weekStart(today()) ? `Semaine actuelle · ${label}` : label;
}

function isRecoveryDone(date, type, plannedSessionId = "") {
  const entries = state.snapshot.recovery || [];
  const matching = entries.filter((entry) => {
    const sameSession = plannedSessionId ? entry.planned_session_id === plannedSessionId : true;
    return entry.date === date && entry.type === type && sameSession;
  });
  const latest = matching.at(-1);
  return latest ? latest.done === "true" : false;
}

function renderForms() {
  const dateInputs = $$('input[type="date"]');
  dateInputs.forEach((input) => {
    if (!input.value) input.value = today();
  });

  const select = $("#plannedSelect");
  select.innerHTML = `<option value="">Séance non prévue / libre</option>`;
  for (const session of state.snapshot.planned) {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = `${formatDate(session.date)} - ${session.title}`;
    select.appendChild(option);
  }
  select.value = state.activeFeedbackSessionId || "";
  select.onchange = () => {
    if (select.value) {
      prefillWorkout(select.value);
      return;
    }
    state.activeFeedbackSessionId = null;
    renderWorkoutFormState();
  };

  if (!$("#exerciseRows").children.length) {
    addExerciseRow();
    addExerciseRow();
    addExerciseRow();
  }

  if (state.activeFeedbackSessionId) {
    const session = state.snapshot.planned.find((item) => item.id === state.activeFeedbackSessionId);
    const existing = [...state.snapshot.workouts].reverse().find((row) => row.planned_or_unplanned === `planned:${state.activeFeedbackSessionId}`);
    renderWorkoutFormState(session, existing);
  } else {
    renderWorkoutFormState();
  }
}

function statusLabel(status) {
  return {
    planned: "Prévue",
    done: "Faite",
    missed: "Ratée",
    moved: "Déplacée",
    prepared: "Préparé"
  }[status] || status;
}

function shortText(text, maxLength) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
}

function prefillWorkout(sessionId) {
  const session = state.snapshot.planned.find((item) => item.id === sessionId);
  if (!session) return;
  const existing = [...state.snapshot.workouts].reverse().find((row) => row.planned_or_unplanned === `planned:${sessionId}`);
  const strengthRows = getStrengthRowsForSession(session, existing);
  const form = $("#workoutForm");
  state.activeFeedbackSessionId = session.id;
  form.elements.planned_session_id.value = session.id;
  form.elements.date.value = existing?.date || session.date || today();
  form.elements.session_type.value = existing?.session_type || session.type || "strength";
  form.elements.duration_min.value = existing?.duration_min || session.planned_duration_min || (session.type === "mobility" ? "60" : "90");
  form.elements.warmup_done.checked = existing ? existing.warmup_done === "true" : Boolean(session.warmup);
  form.elements.incline_walk_done.checked = existing ? existing.incline_walk_done === "true" : false;
  form.elements.rpe_global.value = existing?.rpe_global || "";
  form.elements.energy_1_10.value = existing?.energy_1_10 || "";
  form.elements.pain.value = existing?.pain || "";
  form.elements.notes.value = existing?.notes || `Séance prévue: ${session.title}. ${session.focus || ""}${session.warmup ? ` Echauffement prévu: ${session.warmup}.` : ""}${session.incline_walk ? ` Marche inclinée prévue: ${session.incline_walk}.` : ""}`;
  $("#exerciseRows").innerHTML = "";
  const exercises = strengthRows.length ? strengthRows : (session.exercises || []);
  for (const exercise of exercises) {
    addExerciseRow(exercise);
  }
  if (!$("#exerciseRows").children.length) {
    addExerciseRow();
  }
  renderWorkoutFormState(session, existing);
}

function renderWorkoutFormState(session = null, existing = null) {
  const stateBox = $("#workoutFormState");
  const submitButton = $("#workoutSubmitBtn");
  if (!stateBox || !submitButton) return;

  if (!session) {
    stateBox.hidden = true;
    submitButton.innerHTML = `${icon("save")}Enregistrer le retour`;
    return;
  }

  stateBox.hidden = false;
  stateBox.className = `form-state full ${existing ? "editing" : "new"}`;
  stateBox.innerHTML = `
    <span>${icon(existing ? "edit" : "clipboard")}</span>
    <div>
      <strong>${existing ? "Retour déjà enregistré" : "Retour prêt à saisir"}</strong>
      <small>${escapeHtml(session.title)} · ${formatDate(session.date)}${existing ? " · modification du retour existant" : " · formulaire prérempli avec la séance prévue"}</small>
    </div>
  `;
  submitButton.innerHTML = `${icon("save")}${existing ? "Enregistrer les modifications" : "Enregistrer le retour"}`;
}

function getStrengthRowsForSession(session, workout) {
  if (!workout?.date) return [];
  const plannedNames = new Set((session.exercises || []).map((exercise) => exercise.name));
  return state.snapshot.strength.filter((row) => row.date === workout.date && plannedNames.has(row.exercise)).map((row) => ({
    name: row.exercise,
    sets: row.sets,
    reps: row.reps,
    load_kg: row.load_kg,
    rpe: row.rpe,
    felt_difficulty: row.felt_difficulty,
    pain: row.pain
  }));
}

function addExerciseRow(data = {}) {
  const row = document.createElement("div");
  row.className = "exercise-row";
  row.innerHTML = `
    <input name="name" placeholder="Exercice" value="${data.name || ""}" />
    <input name="sets" type="number" min="0" placeholder="Séries" value="${data.sets || ""}" />
    <input name="reps" placeholder="Reps" value="${data.reps || ""}" />
    <input name="load_kg" type="number" step="0.5" placeholder="Kg" value="${data.load_kg || ""}" />
    <input name="rpe" type="number" min="1" max="10" step="0.5" placeholder="RPE" value="${data.rpe || ""}" />
    <select name="felt_difficulty" aria-label="Ressenti">
      <option value="">Ressenti</option>
      <option value="Facile" ${data.felt_difficulty === "Facile" ? "selected" : ""}>Facile</option>
      <option value="Egal" ${data.felt_difficulty === "Egal" ? "selected" : ""}>Égal</option>
      <option value="Dur" ${data.felt_difficulty === "Dur" ? "selected" : ""}>Dur</option>
      <option value="Non fini" ${data.felt_difficulty === "Non fini" ? "selected" : ""}>Non fini</option>
    </select>
    <input name="pain" placeholder="Douleur" value="${data.pain || ""}" />
    <button type="button" aria-label="Supprimer">${icon("x")}</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  $("#exerciseRows").appendChild(row);
}

function formObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.warmup_done = form.elements.warmup_done?.checked || false;
  data.incline_walk_done = form.elements.incline_walk_done?.checked || false;
  return data;
}

function exercisesFromRows() {
  return $$(".exercise-row").map((row) => Object.fromEntries([...row.querySelectorAll("input, select")].map((input) => [input.name, input.value])));
}

function renderTables() {
  $("#workoutTable").innerHTML = [...state.snapshot.workouts]
    .reverse()
    .slice(0, 12)
    .map((row) => `
      <tr>
        <td>${row.date}</td>
        <td>${row.session_type}</td>
        <td>${row.rpe_global}</td>
        <td>${row.energy_1_10}</td>
        <td>${row.pain}</td>
        <td>${row.notes}</td>
      </tr>
    `)
    .join("");

  $("#nutritionTable").innerHTML = [...state.snapshot.nutrition]
    .reverse()
    .slice(0, 20)
    .map((row) => `
      <tr>
        <td>${row.date}</td>
        <td>${row.meal_time}</td>
        <td>${row.meal_description}</td>
        <td>${row.calories}</td>
        <td>${row.protein_g}</td>
        <td>${row.carbs_g}</td>
        <td>${row.fat_g}</td>
      </tr>
    `)
    .join("");
}

function renderMealPlans() {
  const table = $("#mealPlanTable");
  if (!table) return;
  const meals = state.snapshot.meals || [];
  table.innerHTML = meals.length ? meals.map((meal) => `
    <tr>
      <td>${meal.date || ""}</td>
      <td>${meal.meal_time || ""}</td>
      <td><strong>${escapeHtml(meal.title || "")}</strong><br><small>${escapeHtml(ingredientsText(meal.ingredients))}</small></td>
      <td>${Math.round(meal.calories || 0)} kcal · ${Math.round(meal.protein_g || 0)}P · ${Math.round(meal.carbs_g || 0)}G · ${Math.round(meal.fat_g || 0)}L</td>
      <td>${meal.tupperware_friendly ? '<span class="pill ok">Oui</span>' : '<span class="pill">Non</span>'}</td>
      <td>${statusLabel(meal.status || "planned")}</td>
      <td>${meal.status === "prepared" ? "" : `<button class="table-action primary" data-meal-prepared="${meal.id}" type="button">${icon("check")}Préparé</button>`}</td>
    </tr>
  `).join("") : '<tr><td colspan="7">Aucun repas prévu pour l’instant.</td></tr>';

  $$("[data-meal-prepared]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Confirmer que ce repas est préparé et décrémenter le frigo ?")) return;
      await api("/api/meal-prepared", {
        method: "POST",
        body: JSON.stringify({ id: button.dataset.mealPrepared })
      });
      toast("Repas confirmé, frigo mis à jour");
      await load();
    });
  });
}

function renderMacroTargets() {
  const container = $("#macroTargets");
  if (!container) return;
  const targets = state.snapshot.nutritionTargets?.targets || [];
  container.innerHTML = targets.length ? targets.map((target) => `
    <article class="panel target-card">
      <div>
        <span class="target-icon">${icon(target.id === "training_day" ? "activity" : "target")}</span>
        <h3>${escapeHtml(target.label || "")}</h3>
        <p>${escapeHtml(target.use_when || "")}</p>
      </div>
      <div class="target-kcal">${Math.round(target.kcal || 0)} kcal</div>
      <div class="target-macros">
        <span><strong>${Math.round(target.protein_g || 0)} g</strong><small>Proteines</small></span>
        <span><strong>${Math.round(target.carbs_g || 0)} g</strong><small>Glucides</small></span>
        <span><strong>${Math.round(target.fat_g || 0)} g</strong><small>Lipides</small></span>
      </div>
    </article>
  `).join("") : "";
}

function ingredientsText(ingredients = []) {
  return ingredients.map((item) => `${item.name || "aliment"} ${item.quantity || ""}${unitLabel(item.unit || "")}`).join(" · ");
}

function renderFridge() {
  const items = state.snapshot.fridge?.items || [];
  const table = $("#fridgeTable");
  if (!table) return;

  const totals = items.reduce((acc, item) => {
    const macros = itemStockMacros(item);
    acc.calories += macros.calories;
    acc.protein_g += macros.protein_g;
    acc.carbs_g += macros.carbs_g;
    acc.fat_g += macros.fat_g;
    return acc;
  }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });

  $("#fridgeCalories").textContent = Math.round(totals.calories);
  $("#fridgeProtein").textContent = `${Math.round(totals.protein_g)} g`;
  $("#fridgeCarbs").textContent = `${Math.round(totals.carbs_g)} g`;
  $("#fridgeFat").textContent = `${Math.round(totals.fat_g)} g`;

  table.innerHTML = items.length ? items.map((item) => {
    const macros = itemStockMacros(item);
    return `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong><br><small>${item.source === "average" ? "moyenne auto" : "à compléter"}</small></td>
        <td>
          <div class="fridge-qty">
            <input data-fridge-quantity="${item.id}" type="number" min="0" step="0.1" value="${item.quantity}" />
            <button class="table-action" data-fridge-save="${item.id}" type="button">${icon("save")}</button>
          </div>
        </td>
        <td>
          <select data-fridge-unit="${item.id}">
            ${unitOptions(item.unit)}
          </select>
        </td>
        <td>${escapeHtml(item.category || "-")}</td>
        <td>${escapeHtml(item.unit_basis || "-")}</td>
        <td>${Math.round(macros.calories)} kcal · ${Math.round(macros.protein_g)}P · ${Math.round(macros.carbs_g)}G · ${Math.round(macros.fat_g)}L</td>
        <td>${item.use_first ? '<span class="use-first">À utiliser vite</span>' : "Normal"}</td>
        <td><button class="table-action ghost-danger" data-fridge-delete="${item.id}" type="button">${icon("trash")}</button></td>
      </tr>
    `;
  }).join("") : '<tr><td colspan="8">Aucun aliment pour l’instant.</td></tr>';

  $$("[data-fridge-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.fridgeSave;
      await api("/api/fridge-item-update", {
        method: "POST",
        body: JSON.stringify({
          id,
          quantity: $(`[data-fridge-quantity="${id}"]`).value,
          unit: $(`[data-fridge-unit="${id}"]`).value
        })
      });
      toast("Quantité mise à jour");
      await load();
    });
  });

  $$("[data-fridge-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Retirer cet aliment du frigo ?")) return;
      await api("/api/fridge-item-delete", {
        method: "POST",
        body: JSON.stringify({ id: button.dataset.fridgeDelete })
      });
      toast("Aliment retiré");
      await load();
    });
  });
}

function unitOptions(selected) {
  return ["g", "kg", "ml", "L", "piece", "portion", "paquet", "pot", "boite"]
    .map((unit) => `<option value="${unit}" ${unit === selected ? "selected" : ""}>${unitLabel(unit)}</option>`)
    .join("");
}

function unitLabel(unit) {
  return {
    g: "g",
    kg: "kg",
    ml: "ml",
    L: "L",
    piece: "pièce",
    portion: "portion",
    paquet: "paquet",
    pot: "pot",
    boite: "boîte"
  }[unit] || unit;
}

function itemStockMacros(item) {
  const multiplier = macroMultiplier(item);
  return {
    calories: Number(item.calories || 0) * multiplier,
    protein_g: Number(item.protein_g || 0) * multiplier,
    carbs_g: Number(item.carbs_g || 0) * multiplier,
    fat_g: Number(item.fat_g || 0) * multiplier
  };
}

function macroMultiplier(item) {
  const quantity = Number(item.quantity || 0);
  const unit = item.unit;
  const basis = item.unit_basis;
  if (basis === "100g") {
    if (unit === "kg") return quantity * 10;
    if (unit === "g") return quantity / 100;
  }
  if (basis === "100ml") {
    if (unit === "L") return quantity * 10;
    if (unit === "ml") return quantity / 100;
  }
  if (basis === "piece") {
    if (unit === "piece") return quantity;
  }
  return 0;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function renderCharts() {
  renderChartSet("home");
  renderChartSet("progress");
}

function renderChartSet(scope) {
  const weightCanvas = scope === "home" ? $("#homeWeightChart") : $("#weightChart");
  const strengthCanvas = scope === "home" ? $("#homeStrengthChart") : $("#strengthChart");
  const filter = scope === "home" ? $("#homeExerciseFilter") : $("#exerciseFilter");
  if (!weightCanvas || !strengthCanvas || !filter) return;

  drawLineChart(weightCanvas, state.snapshot.body.filter((row) => row.weight_kg).map((row) => ({
    label: row.date,
    value: Number(row.weight_kg)
  })), "kg");

  const exercises = [...new Set(state.snapshot.strength.map((row) => row.exercise).filter(Boolean))];
  const selected = filter.value || exercises[0] || "";
  filter.innerHTML = exercises.map((name) => `<option value="${name}">${name}</option>`).join("");
  filter.value = selected;

  const points = state.snapshot.strength
    .filter((row) => row.exercise === filter.value && row.load_kg)
    .map((row) => ({ label: row.date, value: Number(row.load_kg) }));
  drawLineChart(strengthCanvas, points, "kg");
}

function drawLineChart(canvas, points, unit) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (!points.length) {
    ctx.fillStyle = "#667085";
    ctx.font = "18px system-ui";
    ctx.fillText("Pas encore assez de données", 24, 48);
    return;
  }

  const pad = 38;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.strokeStyle = "#d9e0e7";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = pad + ((height - pad * 2) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#136f63";
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad + ((width - pad * 2) / Math.max(points.length - 1, 1)) * index;
    const y = height - pad - ((point.value - min) / range) * (height - pad * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#136f63";
  points.forEach((point, index) => {
    const x = pad + ((width - pad * 2) / Math.max(points.length - 1, 1)) * index;
    const y = height - pad - ((point.value - min) / range) * (height - pad * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#667085";
  ctx.font = "14px system-ui";
  ctx.fillText(`${max}${unit}`, 8, pad);
  ctx.fillText(`${min}${unit}`, 8, height - pad);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(`${date}T12:00:00`));
}

$("#refreshBtn").addEventListener("click", load);
$("#recentRefreshBtn")?.addEventListener("click", load);
window.addEventListener("hashchange", () => activateView(currentView()));
$$("[data-view-link]").forEach((link) => {
  link.addEventListener("click", () => {
    const view = link.dataset.viewLink;
    if (view) activateView(view);
  });
});
$("#addExerciseBtn").addEventListener("click", () => addExerciseRow());
$("#exerciseFilter").addEventListener("change", renderCharts);
$("#homeExerciseFilter")?.addEventListener("change", renderCharts);

$("#workoutForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = { ...formObject(event.currentTarget), exercises: exercisesFromRows(), status: "done" };
  const wasEditing = Boolean(payload.planned_session_id && hasWorkoutFeedback(payload.planned_session_id));
  await api("/api/workout", { method: "POST", body: JSON.stringify(payload) });
  state.activeFeedbackSessionId = null;
  event.currentTarget.reset();
  $("#exerciseRows").innerHTML = "";
  await reloadAfterSave(wasEditing ? "Retour séance modifié" : "Retour séance enregistré", {
    detail: "La carte de séance, le statut et les historiques sont à jour.",
    target: "#week"
  });
});

$("#bodyForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  await api("/api/body-metric", { method: "POST", body: JSON.stringify(payload) });
  event.currentTarget.reset();
  await reloadAfterSave("Mesure corporelle ajoutée", {
    detail: `${payload.weight_kg || "-"} kg · ${payload.estimated_bodyfat_percent || "-"}% bodyfat`,
    target: "#dashboard"
  });
});

$("#nutritionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  await api("/api/nutrition", { method: "POST", body: JSON.stringify(payload) });
  event.currentTarget.reset();
  await reloadAfterSave("Repas ajouté", {
    detail: `${payload.meal_time || "Repas"} · ${payload.calories || "-"} kcal`,
    target: "#nutrition"
  });
});

$("#fridgeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formObject(event.currentTarget);
  await api("/api/fridge-item", { method: "POST", body: JSON.stringify(payload) });
  event.currentTarget.reset();
  await reloadAfterSave("Aliment ajouté au frigo", {
    detail: `${payload.name || "Aliment"} · ${payload.quantity || ""}${payload.unit || ""}`,
    target: "#fridge"
  });
});

load().catch((error) => {
  console.error(error);
  toast("Erreur de chargement");
});
