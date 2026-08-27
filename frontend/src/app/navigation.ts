export interface PrimaryNavigationItem {
  readonly label: string;
  readonly to: string;
  readonly activePrefix: string;
}

export const primaryNavigation = [
  { label: "Arms", to: "/arms", activePrefix: "/arms" },
  {
    label: "Record / Teleop",
    to: "/record",
    activePrefix: "/record",
  },
  {
    label: "Datasets",
    to: "/datasets",
    activePrefix: "/datasets",
  },
  {
    label: "Training",
    to: "/training/runs",
    activePrefix: "/training",
  },
  {
    label: "Inference",
    to: "/inference",
    activePrefix: "/inference",
  },
] as const satisfies readonly PrimaryNavigationItem[];
