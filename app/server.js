import { createServer } from "node:http";
import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(rootDir, "data");
const port = Number(process.env.PORT || 3130);

const files = {
  profile: path.join(dataDir, "profile.json"),
  planned: path.join(dataDir, "planned_sessions.json"),
  workouts: path.join(dataDir, "workout_history.csv"),
  strength: path.join(dataDir, "strength_progression.csv"),
  body: path.join(dataDir, "body_metrics.csv"),
  nutrition: path.join(dataDir, "nutrition_log.csv"),
  nutritionTargets: path.join(dataDir, "nutrition_targets.json"),
  running: path.join(dataDir, "running_history.csv"),
  recovery: path.join(dataDir, "recovery_log.csv"),
  meals: path.join(dataDir, "planned_meals.json"),
  fridge: path.join(dataDir, "fridge_inventory.json")
};

const csvHeaders = {
  workouts: ["date", "session_type", "duration_min", "planned_or_unplanned", "warmup_done", "incline_walk_done", "exercises_summary", "rpe_global", "energy_1_10", "pain", "notes"],
  strength: ["date", "exercise", "sets", "reps", "load_kg", "rpe", "felt_difficulty", "pain", "progression_decision", "notes"],
  body: ["date", "weight_kg", "estimated_bodyfat_percent", "waist_cm", "chest_cm", "hips_cm", "thigh_cm", "arm_cm", "notes"],
  nutrition: ["date", "meal_time", "meal_description", "calories", "protein_g", "carbs_g", "fat_g", "hunger_1_10", "energy_1_10", "notes"],
  running: ["date", "session_type", "duration_min", "distance_km", "pace", "heart_rate_avg", "zone", "rpe", "pain", "notes"],
  recovery: ["date", "type", "done", "planned_session_id", "notes"]
};

const foodAverages = [
  { keys: ["poulet", "blanc de poulet", "filet de poulet"], category: "proteine", unit_basis: "100g", calories: 110, protein_g: 23, carbs_g: 0, fat_g: 1.5 },
  { keys: ["dinde", "filet de dinde"], category: "proteine", unit_basis: "100g", calories: 105, protein_g: 22, carbs_g: 0, fat_g: 1.5 },
  { keys: ["oeuf", "oeufs"], category: "proteine", unit_basis: "piece", calories: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 5 },
  { keys: ["thon", "thon naturel"], category: "proteine", unit_basis: "100g", calories: 116, protein_g: 26, carbs_g: 0, fat_g: 1 },
  { keys: ["sardine", "sardines"], category: "proteine", unit_basis: "100g", calories: 190, protein_g: 24, carbs_g: 0, fat_g: 10 },
  { keys: ["skyr"], category: "proteine", unit_basis: "100g", calories: 60, protein_g: 10, carbs_g: 4, fat_g: 0.2 },
  { keys: ["fromage blanc"], category: "proteine", unit_basis: "100g", calories: 75, protein_g: 8, carbs_g: 4, fat_g: 3 },
  { keys: ["riz", "riz cru"], category: "glucide", unit_basis: "100g", calories: 360, protein_g: 7, carbs_g: 78, fat_g: 1 },
  { keys: ["pate", "pates", "pates crues"], category: "glucide", unit_basis: "100g", calories: 355, protein_g: 12, carbs_g: 72, fat_g: 1.5 },
  { keys: ["flocon avoine", "flocons avoine", "avoine"], category: "glucide", unit_basis: "100g", calories: 370, protein_g: 13, carbs_g: 60, fat_g: 7 },
  { keys: ["pain complet"], category: "glucide", unit_basis: "100g", calories: 250, protein_g: 9, carbs_g: 45, fat_g: 4 },
  { keys: ["pomme de terre", "pommes de terre"], category: "glucide", unit_basis: "100g", calories: 80, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
  { keys: ["haricot", "haricots", "haricots verts"], category: "legume", unit_basis: "100g", calories: 31, protein_g: 1.8, carbs_g: 4, fat_g: 0.2 },
  { keys: ["petit pois", "petits pois"], category: "legume", unit_basis: "100g", calories: 80, protein_g: 5, carbs_g: 11, fat_g: 0.5 },
  { keys: ["legumes surgeles", "legumes"], category: "legume", unit_basis: "100g", calories: 45, protein_g: 2, carbs_g: 7, fat_g: 0.5 },
  { keys: ["banane"], category: "fruit", unit_basis: "piece", calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.3 },
  { keys: ["pomme"], category: "fruit", unit_basis: "piece", calories: 80, protein_g: 0.3, carbs_g: 21, fat_g: 0.2 },
  { keys: ["lait", "lait demi ecreme", "lait demi-écrémé"], category: "liquide", unit_basis: "100ml", calories: 46, protein_g: 3.4, carbs_g: 4.8, fat_g: 1.6 },
  { keys: ["creme", "creme legere", "crème légère"], category: "matiere_grasse", unit_basis: "100ml", calories: 170, protein_g: 3, carbs_g: 4, fat_g: 15 },
  { keys: ["sauce tomate"], category: "condiment", unit_basis: "100g", calories: 35, protein_g: 1.5, carbs_g: 6, fat_g: 0.5 },
  { keys: ["gruyere", "gruyère"], category: "matiere_grasse", unit_basis: "100g", calories: 410, protein_g: 29, carbs_g: 0, fat_g: 32 },
  { keys: ["huile olive", "huile d olive", "huile d'olive"], category: "matiere_grasse", unit_basis: "100ml", calories: 820, protein_g: 0, carbs_g: 0, fat_g: 91 }
];

function normalizeFoodName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findFoodAverage(name) {
  const normalized = normalizeFoodName(name);
  return foodAverages.find((food) => food.keys.some((key) => normalized.includes(normalizeFoodName(key))));
}

function buildFridgeItem(input, previous = {}) {
  const average = findFoodAverage(input.name) || {};
  const now = new Date().toISOString();
  return {
    id: previous.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: input.name || previous.name || "",
    quantity: Number(input.quantity ?? previous.quantity ?? 0),
    unit: input.unit || previous.unit || "g",
    category: input.category || previous.category || average.category || "a_classifier",
    unit_basis: input.unit_basis || previous.unit_basis || average.unit_basis || "",
    calories: Number(input.calories ?? previous.calories ?? average.calories ?? 0),
    protein_g: Number(input.protein_g ?? previous.protein_g ?? average.protein_g ?? 0),
    carbs_g: Number(input.carbs_g ?? previous.carbs_g ?? average.carbs_g ?? 0),
    fat_g: Number(input.fat_g ?? previous.fat_g ?? average.fat_g ?? 0),
    expires_at: input.expires_at || previous.expires_at || "",
    use_first: Boolean(input.use_first ?? previous.use_first ?? false),
    source: average.keys ? "average" : previous.source || "unknown",
    created_at: previous.created_at || now,
    updated_at: now
  };
}

async function readFridge() {
  const fridge = await readJson(files.fridge, {});
  return {
    last_updated: fridge.last_updated || null,
    items: Array.isArray(fridge.items) ? fridge.items : [],
    shopping_preferences: Array.isArray(fridge.shopping_preferences) ? fridge.shopping_preferences : [],
    waste_watch: Array.isArray(fridge.waste_watch) ? fridge.waste_watch : []
  };
}

async function writeFridge(fridge) {
  const next = { ...fridge, last_updated: new Date().toISOString() };
  await writeFile(files.fridge, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function parseCsv(text) {
  const records = parseCsvRecords(text);
  if (!records.length) return [];
  const headers = records[0];
  return records.slice(1).map((values) => {
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvRecords(text) {
  const records = [];
  let row = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((value) => value !== "")) records.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    if (row.some((value) => value !== "")) records.push(row);
  }

  return records;
}

function csvEscape(value) {
  const string = String(value ?? "");
  return /[",\n\r]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function readCsv(file) {
  try {
    return parseCsv(await readFile(file, "utf8"));
  } catch {
    return [];
  }
}

async function appendCsv(key, row) {
  const file = files[key];
  const headers = csvHeaders[key];
  if (!existsSync(file)) {
    await writeFile(file, `${headers.join(",")}\n`);
  }
  const values = headers.map((header) => csvEscape(row[header]));
  await appendFile(file, `${values.join(",")}\n`);
}

async function writeCsv(key, rows) {
  const headers = csvHeaders[key];
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ];
  await writeFile(files[key], `${lines.join("\n")}\n`);
}

async function updatePlannedSession(id, updates) {
  const planned = await readJson(files.planned, []);
  const next = planned.map((session) => (session.id === id ? { ...session, ...updates } : session));
  await writeFile(files.planned, `${JSON.stringify(next, null, 2)}\n`);
  return next.find((session) => session.id === id);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function snapshot() {
  const [profile, planned, workouts, strength, body, nutrition, nutritionTargets, running, recovery, meals, fridge] = await Promise.all([
    readJson(files.profile, {}),
    readJson(files.planned, []),
    readCsv(files.workouts),
    readCsv(files.strength),
    readCsv(files.body),
    readCsv(files.nutrition),
    readJson(files.nutritionTargets, {}),
    readCsv(files.running),
    readCsv(files.recovery),
    readJson(files.meals, []),
    readJson(files.fridge, {})
  ]);

  return { profile, planned, workouts, strength, body, nutrition, nutritionTargets, running, recovery, meals, fridge };
}

async function readMeals() {
  const meals = await readJson(files.meals, []);
  return Array.isArray(meals) ? meals : [];
}

async function writeMeals(meals) {
  await writeFile(files.meals, `${JSON.stringify(meals, null, 2)}\n`);
  return meals;
}

function toBaseQuantity(quantity, unit) {
  const value = Number(quantity || 0);
  if (unit === "kg") return { quantity: value * 1000, unit: "g" };
  if (unit === "L") return { quantity: value * 1000, unit: "ml" };
  return { quantity: value, unit };
}

function fromBaseQuantity(quantity, unit) {
  if (unit === "kg") return quantity / 1000;
  if (unit === "L") return quantity / 1000;
  return quantity;
}

function subtractIngredient(item, ingredient) {
  const itemBase = toBaseQuantity(item.quantity, item.unit);
  const ingredientBase = toBaseQuantity(ingredient.quantity, ingredient.unit);
  const compatible = itemBase.unit === ingredientBase.unit || item.unit === ingredient.unit;
  if (!compatible) return item;
  const remainingBase = Math.max(0, itemBase.quantity - ingredientBase.quantity);
  return {
    ...item,
    quantity: Number(fromBaseQuantity(remainingBase, item.unit).toFixed(2)),
    updated_at: new Date().toISOString()
  };
}

async function routeApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/snapshot") {
    return send(res, 200, await snapshot());
  }

  if (req.method === "POST" && url.pathname === "/api/workout") {
    const body = await readBody(req);
    const plannedKey = body.planned_session_id ? `planned:${body.planned_session_id}` : "";
    const exerciseNames = new Set((body.exercises || []).map((exercise) => exercise.name).filter(Boolean));
    const exerciseSummary = (body.exercises || [])
      .filter((item) => item.name)
      .map((item) => `${item.name}: ${item.sets || "?"}x${item.reps || "?"} @ ${item.load_kg || "?"}kg RPE ${item.rpe || "?"} ressenti ${item.felt_difficulty || "?"}`)
      .join(" | ");

    if (plannedKey) {
      const workouts = await readCsv(files.workouts);
      await writeCsv("workouts", workouts.filter((row) => row.planned_or_unplanned !== plannedKey));

      const strength = await readCsv(files.strength);
      await writeCsv("strength", strength.filter((row) => !(row.date === body.date && exerciseNames.has(row.exercise))));
    }

    await appendCsv("workouts", {
      date: body.date,
      session_type: body.session_type,
      duration_min: body.duration_min,
      planned_or_unplanned: plannedKey || "unplanned",
      warmup_done: body.warmup_done ? "true" : "false",
      incline_walk_done: body.incline_walk_done ? "true" : "false",
      exercises_summary: exerciseSummary,
      rpe_global: body.rpe_global,
      energy_1_10: body.energy_1_10,
      pain: body.pain,
      notes: body.notes
    });

    for (const exercise of body.exercises || []) {
      if (!exercise.name) continue;
      await appendCsv("strength", {
        date: body.date,
        exercise: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        load_kg: exercise.load_kg,
        rpe: exercise.rpe,
        felt_difficulty: exercise.felt_difficulty,
        pain: exercise.pain,
        progression_decision: "a analyser",
        notes: exercise.notes
      });
    }

    if (body.planned_session_id) {
      await updatePlannedSession(body.planned_session_id, {
        status: body.status || "done",
        completed_date: body.date,
        last_feedback: body.notes || ""
      });
    }

    return send(res, 201, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/session-status") {
    const body = await readBody(req);
    const updates = {
      status: body.status,
      status_reason: body.reason || "",
      moved_to: body.moved_to || ""
    };

    if (body.status === "done") {
      updates.completed_date = body.completed_date || body.date || "";
      updates.last_feedback = body.reason || "Marquee comme faite depuis le dashboard";
    }

    if (body.status === "missed") {
      updates.completed_date = "";
      updates.last_feedback = body.reason || "Marquee comme non faite depuis le dashboard";
    }

    const session = await updatePlannedSession(body.id, updates);
    return send(res, 200, { ok: true, session });
  }

  if (req.method === "POST" && url.pathname === "/api/body-metric") {
    const body = await readBody(req);
    await appendCsv("body", body);
    return send(res, 201, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/nutrition") {
    const body = await readBody(req);
    await appendCsv("nutrition", body);
    return send(res, 201, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/running") {
    const body = await readBody(req);
    await appendCsv("running", body);
    return send(res, 201, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/recovery") {
    const body = await readBody(req);
    await appendCsv("recovery", {
      date: body.date,
      type: body.type,
      done: body.done ? "true" : "false",
      planned_session_id: body.planned_session_id || "",
      notes: body.notes || ""
    });

    if (body.planned_session_id && body.type === "mobility") {
      await updatePlannedSession(body.planned_session_id, {
        status: body.done ? "done" : "planned",
        completed_date: body.done ? body.date : "",
        last_feedback: body.done ? "Mobilite cochee comme faite" : ""
      });
    }

    return send(res, 201, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/fridge-item") {
    const body = await readBody(req);
    const fridge = await readFridge();
    const item = buildFridgeItem(body);
    fridge.items.push(item);
    return send(res, 201, { ok: true, fridge: await writeFridge(fridge), item });
  }

  if (req.method === "POST" && url.pathname === "/api/fridge-item-update") {
    const body = await readBody(req);
    const fridge = await readFridge();
    let updated = null;
    fridge.items = fridge.items.map((item) => {
      if (item.id !== body.id) return item;
      updated = buildFridgeItem({ ...item, ...body }, item);
      return updated;
    });
    return send(res, 200, { ok: true, fridge: await writeFridge(fridge), item: updated });
  }

  if (req.method === "POST" && url.pathname === "/api/fridge-item-delete") {
    const body = await readBody(req);
    const fridge = await readFridge();
    fridge.items = fridge.items.filter((item) => item.id !== body.id);
    return send(res, 200, { ok: true, fridge: await writeFridge(fridge) });
  }

  if (req.method === "POST" && url.pathname === "/api/meal-plan") {
    const body = await readBody(req);
    const meals = await readMeals();
    const meal = {
      id: body.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: body.date,
      meal_time: body.meal_time || "dejeuner",
      title: body.title,
      tupperware_friendly: Boolean(body.tupperware_friendly ?? body.meal_time === "dejeuner"),
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      calories: Number(body.calories || 0),
      protein_g: Number(body.protein_g || 0),
      carbs_g: Number(body.carbs_g || 0),
      fat_g: Number(body.fat_g || 0),
      notes: body.notes || "",
      status: "planned",
      created_at: new Date().toISOString()
    };
    meals.push(meal);
    return send(res, 201, { ok: true, meals: await writeMeals(meals), meal });
  }

  if (req.method === "POST" && url.pathname === "/api/meal-prepared") {
    const body = await readBody(req);
    const meals = await readMeals();
    const meal = meals.find((item) => item.id === body.id);
    if (!meal) return send(res, 404, { error: "Meal not found" });

    const fridge = await readFridge();
    for (const ingredient of meal.ingredients || []) {
      fridge.items = fridge.items.map((item) => {
        const sameId = ingredient.fridge_item_id && item.id === ingredient.fridge_item_id;
        const sameName = !ingredient.fridge_item_id && normalizeFoodName(item.name) === normalizeFoodName(ingredient.name);
        return sameId || sameName ? subtractIngredient(item, ingredient) : item;
      });
    }

    const nextMeals = meals.map((item) => item.id === meal.id ? {
      ...item,
      status: "prepared",
      prepared_at: new Date().toISOString()
    } : item);

    await writeFridge(fridge);
    await writeMeals(nextMeals);
    return send(res, 200, { ok: true, meals: nextMeals, fridge });
  }

  return send(res, 404, { error: "API route not found" });
}

async function routeStatic(res, url) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = path.normalize(path.join(publicDir, requested));
  if (!file.startsWith(publicDir)) return send(res, 403, "Forbidden", "text/plain");

  try {
    const body = await readFile(file);
    const ext = path.extname(file);
    const type = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".svg": "image/svg+xml"
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(body);
  } catch {
    send(res, 404, "Not found", "text/plain");
  }
}

await mkdir(publicDir, { recursive: true });

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await routeApi(req, res, url);
    } else {
      await routeStatic(res, url);
    }
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Coach Dashboard running at http://127.0.0.1:${port}`);
});
