import raw from "@/data/deep-bench-data.json";
import type { DeepBenchData } from "@/lib/types";

// The source JSON also carries `lineups` and `minutes`, used by later stages.
// This stage only reads `teams` and `meta.disclosures`.
export const deepBenchData = raw as unknown as DeepBenchData;
