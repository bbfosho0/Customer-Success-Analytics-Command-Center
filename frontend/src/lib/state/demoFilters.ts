import { create } from "zustand";

export const timeRangeOptions = ["24h", "3d", "7d", "30d", "90d"] as const;
export const regionOptions = [
  "Global",
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
] as const;
export const intentOptions = [
  "All intents",
  "Lambda timeout",
  "API Gateway 5xx",
  "Cold start",
  "IAM permission",
  "DynamoDB throttle",
  "S3 access",
  "Step Functions",
  "CloudWatch logs",
] as const;

export type TimeRange = (typeof timeRangeOptions)[number];
export type RegionOption = (typeof regionOptions)[number];
export type IntentOption = (typeof intentOptions)[number];

export interface DemoFilterSelection {
  window: TimeRange;
  region: RegionOption;
  intent: IntentOption;
}

interface DemoFilterStore {
  selection: DemoFilterSelection;
  setWindow: (window: TimeRange) => void;
  setRegion: (region: RegionOption) => void;
  setIntent: (intent: IntentOption) => void;
  reset: () => void;
}

const defaultSelection: DemoFilterSelection = {
  window: "7d",
  region: "Global",
  intent: "All intents",
};

export const useDemoFilters = create<DemoFilterStore>((set) => ({
  selection: defaultSelection,
  setWindow: (window) =>
    set((state: DemoFilterStore) => ({
      selection: { ...state.selection, window },
    })),
  setRegion: (region) =>
    set((state: DemoFilterStore) => ({
      selection: { ...state.selection, region },
    })),
  setIntent: (intent) =>
    set((state: DemoFilterStore) => ({
      selection: { ...state.selection, intent },
    })),
  reset: () => set({ selection: defaultSelection }),
}));
