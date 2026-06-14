/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  tagline?: string;
  brandColor: TBrandColor;
  defaultOvers?: number;
  showQuickAddTip?: boolean;
  homeWelcomeMessage?: string;
  homeSubtitle?: string;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Scorenow",
  logoUrl: "FILL_LOGO_URL_HERE",
  tagline: "Ball-by-ball cricket scoring for your crew",
  brandColor: {
    primary: "#166534",
    secondary: "#0f172a",
    accent: "#f59e0b",
  },
  defaultOvers: 20,           // fill it here
  showQuickAddTip: true,      // fill it here
  homeWelcomeMessage: "Ready to score?",
  homeSubtitle: "Build teams, set up your match, and track every ball.",
};
