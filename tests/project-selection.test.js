import test from "node:test";
import assert from "node:assert/strict";
import { defaultProject } from "../src/core/project-selection.js";
import {
  emptyState,
  mutate,
  MISC_ID,
  validateState,
} from "../src/core/model.js";
const part = {
  name: "Board",
  url: "https://makerbazar.in/products/board?variant=22",
  category: "Microcontrollers & boards",
  price: 100,
  currency: "INR",
  quantity: 1,
  status: "planned",
  notes: "",
};
test("the last added part remembers its project, including new projects and Miscellaneous", () => {
  let state = mutate(emptyState(), {
    type: "save",
    newProject: "Project A",
    part,
  });
  const first = state.projects[0].id;
  assert.equal(defaultProject(state), first);
  state = mutate(state, { type: "save", newProject: "Project B", part });
  const second = state.projects[1].id;
  assert.equal(defaultProject(state), second);
  state = mutate(state, {
    type: "save",
    part: { ...state.parts[0], price: 200 },
  });
  assert.equal(
    defaultProject(state),
    second,
    "editing an older part must not change the last-added destination",
  );
  assert.equal(
    defaultProject(state, first),
    first,
    "an explicitly opened project wins",
  );
  assert.equal(defaultProject(state, "__new"), "__new");
  state = mutate(state, { type: "save", part });
  assert.equal(defaultProject(state), MISC_ID);
  assert.equal(defaultProject(JSON.parse(JSON.stringify(state))), MISC_ID);
});
test("cart saves remember their shared destination and deleted projects fall back to create", () => {
  let state = mutate(emptyState(), {
    type: "saveCart",
    newProject: "Cart project",
    parts: [part, { ...part, name: "Second board" }],
  });
  const id = state.projects[0].id;
  assert.equal(defaultProject(state), id);
  state = mutate(state, { type: "deleteProject", id });
  assert.equal(defaultProject(state), "__new");
  assert.equal(state.lastProjectId, null);
});
test("older backups infer the last added destination and invalid/stale preferences are safe", () => {
  let state = mutate(emptyState(), {
    type: "save",
    newProject: "Existing",
    part,
  });
  const id = state.projects[0].id;
  delete state.lastProjectId;
  assert.equal(defaultProject(state), id);
  assert.equal(defaultProject({ ...state, lastProjectId: "deleted" }), "__new");
  assert.equal(defaultProject(emptyState()), "__new");
  assert.throws(() => validateState({ ...state, lastProjectId: 12 }));
});
