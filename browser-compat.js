// Allows the interface to be previewed as ordinary local HTML while leaving the
// native Chrome extension APIs untouched when the extension is installed.
if (!globalThis.chrome?.storage?.local) {
  const readAll = () => JSON.parse(localStorage.getItem("caseAreaPrep") || "{}");
  const writeAll = (value) => localStorage.setItem("caseAreaPrep", JSON.stringify(value));

  globalThis.chrome = {
    storage: {
      local: {
        async get(keys) {
          const all = readAll();
          const requested = Array.isArray(keys) ? keys : Object.keys(keys || all);
          return Object.fromEntries(requested.filter((key) => key in all).map((key) => [key, all[key]]));
        },
        async set(values) {
          writeAll({ ...readAll(), ...values });
        }
      }
    },
    runtime: {
      getURL(path) {
        return new URL(path, location.href).href;
      }
    },
    tabs: {
      create({ url }) {
        window.open(url, "_blank", "noopener");
      }
    }
  };
}
