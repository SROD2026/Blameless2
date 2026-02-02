if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
      // optional: force the new SW to take control sooner
      await navigator.serviceWorker.ready;
    } catch (e) {
      console.error("SW register failed:", e);
    }
  });
}
