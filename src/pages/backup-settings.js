import { request } from "../core/api.js";

const get = (id) => document.getElementById(id);
const message = (text) => {
  get("backup-status").textContent = text;
};
get("export-backup").onclick = async () => {
  try {
    const library = await request({ type: "read" });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(library, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "makerparts-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    message(error.message);
  }
};
get("import-backup").onchange = async ({ target }) => {
  const file = target.files[0];
  if (!file) return;
  try {
    if (file.size > 10_000_000)
      throw Error("Backup is too large (maximum 10 MB).");
    const { version, projects, parts, lastProjectId } = JSON.parse(
      await file.text(),
    );
    if (!confirm("Replace your local library with this backup?")) return;
    await request({
      type: "import",
      state: { version, projects, parts, lastProjectId },
    });
    message("Local backup restored.");
  } catch (error) {
    message(error.message);
  } finally {
    target.value = "";
  }
};
