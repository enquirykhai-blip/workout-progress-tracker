// URL of the Cloudflare Worker that proxies food-photo scans to an AI vision
// model (see cloudflare/food-scan-worker.js for the Worker's source). The
// Worker holds the OpenRouter API key server-side — this URL itself is not a
// secret, but the Worker only accepts requests from this app's own origin.
export const FOOD_SCAN_WORKER_URL = "https://food-scan-proxy.enquiry-khai.workers.dev";
