import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let isConfigured = false;
let mapsLoadPromise: Promise<typeof google.maps> | null = null;

function configureLoader() {
  if (isConfigured) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.");
  }

  setOptions({
    key: apiKey,
    v: "weekly",
  });

  isConfigured = true;
}

export async function loadGoogleMaps(): Promise<typeof google.maps> {
  if (!mapsLoadPromise) {
    configureLoader();
    mapsLoadPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("marker"),
    ]).then(() => google.maps);
  }

  return mapsLoadPromise;
}
