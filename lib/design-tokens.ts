import { partyColors } from "@/lib/party-colors";

export const designTokens = {
  colors: {
    background: "#F7F6F1",
    surface: "#FCFBF8",
    surfaceMuted: "#F0EEE8",
    border: "#49515B",
    textPrimary: "#17263A",
    textSecondary: "#69727D",
    accent: "#DCE8F5",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
    "3xl": "3rem",
  },
  radii: {
    sm: "0.375rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    pill: "999px",
  },
  typography: {
    body: "0.98rem",
    small: "0.875rem",
    label: "0.75rem",
    h1: "clamp(2.4rem, 5vw, 4.75rem)",
    h2: "clamp(1.35rem, 2.5vw, 2rem)",
  },
  shadows: {
    panel: "0 16px 40px rgba(23, 38, 58, 0.08)",
  },
  partyColors,
} as const;

export function appCssVariables(): Record<string, string> {
  return {
    "--color-background": designTokens.colors.background,
    "--color-surface": designTokens.colors.surface,
    "--color-surface-muted": designTokens.colors.surfaceMuted,
    "--color-border": designTokens.colors.border,
    "--color-text-primary": designTokens.colors.textPrimary,
    "--color-text-secondary": designTokens.colors.textSecondary,
    "--color-accent": designTokens.colors.accent,
    "--radius-md": designTokens.radii.md,
    "--radius-lg": designTokens.radii.lg,
    "--radius-xl": designTokens.radii.xl,
    "--shadow-panel": designTokens.shadows.panel,
  };
}
