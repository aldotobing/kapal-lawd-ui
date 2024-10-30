/**
 * @typedef {Object} Config
 * @property {function(ServiceWorkerRegistration): void} [onSuccess]
 * @property {function(ServiceWorkerRegistration): void} [onUpdate]
 */

/**
 * Register service worker
 * @param {Config} [config]
 */
export function register(config) {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/ServiceWorker.js")
        .then((registration) => {
          console.log("Service Worker registered");
          if (config && typeof config.onSuccess === "function") {
            config.onSuccess(registration);
          }
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    });
  }
}

/**
 * Unregister service worker
 */
export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
