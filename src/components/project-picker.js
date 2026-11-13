import { MISC_ID } from "../core/model.js";
import { el } from "./dom.js";
export function projectPicker(form, state, selected = "__new") {
  const fields = form.elements;
  fields.project.replaceChildren();
  for (const project of [
    { id: "__new", name: "＋ Create a new project" },
    ...state.projects,
    { id: MISC_ID, name: "Miscellaneous" },
  ]) {
    const option = el("option", project.name);
    option.value = project.id;
    fields.project.append(option);
  }
  fields.project.value = selected || "__new";
  const toggle = () => {
    form.querySelector("#new-project-field").hidden =
      fields.project.value !== "__new";
    fields.newProject.required = false;
  };
  fields.project.onchange = toggle;
  toggle();
  return () => ({
    projectId: fields.project.value,
    newProject:
      fields.project.value === "__new"
        ? fields.newProject.value.trim()
        : undefined,
  });
}
