export const CATEGORIES = [
  "Microcontrollers & boards",
  "Active components",
  "Passive components",
  "Sensors",
  "Power & batteries",
  "Connectors & cables",
  "Displays",
  "Motors & actuators",
  "Tools & hardware",
  "Resistors",
  "Capacitors",
  "Other",
];
export const emptyState = () => ({ version: 1, projects: [], parts: [] });
export function validUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol))
    throw Error("Use an http or https product link.");
  return url.href;
}
export function validateState(s) {
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.projects) ||
    !Array.isArray(s.parts)
  )
    throw Error("This is not a MakerParts backup.");
  const ids = new Set();
  for (const p of s.projects) {
    if (
      typeof p.id !== "string" ||
      !p.id ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim()
    )
      throw Error("Invalid project in backup.");
    ids.add(p.id);
  }
  const partIds = new Set();
  for (const p of s.parts) {
    if (
      typeof p.id !== "string" ||
      !p.id ||
      partIds.has(p.id) ||
      !ids.has(p.projectId) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      !CATEGORIES.includes(p.category) ||
      !Number.isInteger(p.quantity) ||
      p.quantity < 1 ||
      !["planned", "ordered", "received"].includes(p.status) ||
      !/^[A-Z]{3}$/.test(p.currency) ||
      (p.price !== null &&
        (typeof p.price !== "number" ||
          !Number.isFinite(p.price) ||
          p.price < 0)) ||
      typeof p.notes !== "string" ||
      (p.model !== undefined && typeof p.model !== "string") ||
      (p.sku !== undefined && typeof p.sku !== "string")
    )
      throw Error("Invalid part in backup.");
    validUrl(p.url);
    partIds.add(p.id);
  }
  return s;
}
export function mutate(state, action) {
  const s = structuredClone(state);
  if (action.type === "project") {
    const name = String(action.name || "").trim();
    if (!name) throw Error("Give your project a name.");
    if (
      s.projects.some(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() && p.id !== action.id,
      )
    )
      throw Error("A project with this name already exists.");
    const p = s.projects.find((p) => p.id === action.id);
    if (p) p.name = name;
    else s.projects.push({ id: action.id || crypto.randomUUID(), name });
  } else if (action.type === "save") {
    const p = {
      ...action.part,
      name: String(action.part.name || "").trim(),
      url: validUrl(action.part.url),
    };
    if (action.newProject) {
      const name = action.newProject.trim();
      let project = s.projects.find(
        (x) => x.name.toLowerCase() === name.toLowerCase(),
      );
      if (!project) {
        project = { id: crypto.randomUUID(), name };
        s.projects.push(project);
      }
      p.projectId = project.id;
    }
    p.id ||= crypto.randomUUID();
    const i = s.parts.findIndex((x) => x.id === p.id);
    if (i < 0) s.parts.push(p);
    else s.parts[i] = p;
  } else if (action.type === "deletePart")
    s.parts = s.parts.filter((p) => p.id !== action.id);
  else if (action.type === "deleteProject") {
    s.projects = s.projects.filter((p) => p.id !== action.id);
    s.parts = s.parts.filter((p) => p.projectId !== action.id);
  } else if (action.type === "import")
    return validateState(structuredClone(action.state));
  else throw Error("Unknown action.");
  return validateState(s);
}
export function totals(parts) {
  const result = {};
  for (const p of parts)
    if (p.price !== null)
      result[p.currency] = (result[p.currency] || 0) + p.price * p.quantity;
  return result;
}
export function suggestCategory(name = "") {
  const rules = [
    [/\b(resistor|potentiometer|resistance)\b/i, "Resistors"],
    [/\bcapacitor\b/i, "Capacitors"],
    [
      /\b(esp32|esp8266|arduino|raspberry pi|stm32|rp2040|microcontroller|pico)\b/i,
      CATEGORIES[0],
    ],
    [
      /\b(resistor|capacitor|inductor|potentiometer|resistance)\b/i,
      CATEGORIES[2],
    ],
    [/\b(sensor|accelerometer|gyroscope|dht\d*|bme280)\b/i, CATEGORIES[3]],
    [/\b(mosfet|transistor|diode|op.?amp|led)\b/i, CATEGORIES[1]],
    [/\b(battery|power supply|charger|buck|boost|regulator)\b/i, CATEGORIES[4]],
    [/\b(connector|cable|jumper|header)\b/i, CATEGORIES[5]],
    [/\b(display|oled|lcd)\b/i, CATEGORIES[6]],
    [/\b(motor|servo|actuator|stepper)\b/i, CATEGORIES[7]],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] || "Other";
}
