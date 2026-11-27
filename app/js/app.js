// HomeLedger entry point: build the navigation from the router's routes,
// then hand over to the router. Only the shared modules are imported
// statically; the router loads each view module when its route opens.

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
