// HomeLedger entry point: build the navigation from the router's routes,
// then hand over to the router. Everything else is imported from here,
// so the first load is exactly this module's static import tree.

import { ROUTES, startRouter } from "./router.js";

const nav = document.getElementById("main-nav");
for (const route of Object.values(ROUTES)) {
  const link = document.createElement("a");
  link.className = "nav-link";
  link.href = route.hash;
  link.textContent = route.label;
  nav.appendChild(link);
}

startRouter();
