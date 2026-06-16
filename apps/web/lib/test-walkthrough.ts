export interface TestWalkthroughStep {
  id: string;
  pathMatch: string;
  title: string;
  body: string;
  nextLabel: string;
  nextPath: string;
}

/** Guided test flow — demo matter Ch 7 Riverside */
export const TEST_WALKTHROUGH_STEPS: TestWalkthroughStep[] = [
  {
    id: "dashboard",
    pathMatch: "/dashboard",
    title: "Firm dashboard",
    body: "Overview of all matters. In test mode you only see demo cases — no live client data.",
    nextLabel: "Go to matters",
    nextPath: "/matters",
  },
  {
    id: "matters",
    pathMatch: "/matters",
    title: "All matters",
    body: "Open the demo case to walk a full bankruptcy. Start with Initial Consult.",
    nextLabel: "Open demo consult",
    nextPath: "/matters/demo/scout",
  },
  {
    id: "scout",
    pathMatch: "/matters/demo/scout",
    title: "Initial Consult",
    body: "Income, expenses, means test, take-case decision. Fill this first before petition prep.",
    nextLabel: "Go to Petition Prep",
    nextPath: "/matters/demo/forge",
  },
  {
    id: "forge",
    pathMatch: "/matters/demo/forge",
    title: "Petition Prep",
    body: "Documents, credit, schedules, petition review. Upload test files and approve every field.",
    nextLabel: "Practice filing",
    nextPath: "/matters/demo/practice",
  },
  {
    id: "practice",
    pathMatch: "/matters/demo/practice",
    title: "Practice filing",
    body: "Review every court paper before sandbox e-file. Edit each form, print, then Final Sign-Off.",
    nextLabel: "Final sign-off",
    nextPath: "/matters/demo/forge?section=seal",
  },
  {
    id: "seal",
    pathMatch: "/matters/demo/forge",
    title: "Final Sign-Off & file",
    body: "Complete QA checklists, attorney sign-off, then sandbox e-file from Filing packet — not live CM/ECF.",
    nextLabel: "Post-filing",
    nextPath: "/matters/demo/continuum",
  },
  {
    id: "continuum",
    pathMatch: "/matters/demo/continuum",
    title: "Post-Filing",
    body: "341 meeting, discharge tasks, client follow-up. You finished the test walkthrough.",
    nextLabel: "Back to dashboard",
    nextPath: "/dashboard",
  },
];

export function matchWalkthroughStep(pathname: string): TestWalkthroughStep | null {
  const normalized = pathname.replace(/^\/test/, "") || "/dashboard";
  if (normalized.includes("/forge") && normalized.includes("section=seal")) {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "seal") ?? null;
  }
  if (normalized.startsWith("/matters/demo/continuum")) {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "continuum") ?? null;
  }
  if (normalized.startsWith("/matters/demo/practice")) {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "practice") ?? null;
  }
  if (normalized.startsWith("/matters/demo/scout")) {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "scout") ?? null;
  }
  if (normalized.startsWith("/matters/demo/forge")) {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "forge") ?? null;
  }
  if (normalized === "/matters" || normalized.startsWith("/matters?")) {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "matters") ?? null;
  }
  if (normalized === "/dashboard" || normalized === "/") {
    return TEST_WALKTHROUGH_STEPS.find((s) => s.id === "dashboard") ?? null;
  }
  return null;
}

export const WALKTHROUGH_OFF_KEY = "my-bankruptcy-test-walkthrough-off";
