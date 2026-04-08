import axios from "axios";

import { PlaceEnrichment } from "@/types/place";

const enrichmentClient = axios.create({
  timeout: 12_000,
});

export async function getPlaceEnrichment(website?: string): Promise<PlaceEnrichment> {
  if (!website) {
    return { email: null, socialProfiles: {} };
  }

  const response = await enrichmentClient.get<PlaceEnrichment>("/api/enrich", {
    params: { website },
  });

  return response.data;
}
