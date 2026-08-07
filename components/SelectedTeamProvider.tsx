"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SelectedTeamContextValue = {
  selected: string;
  setSelected: (code: string) => void;
};

const SelectedTeamContext = createContext<SelectedTeamContextValue | null>(null);

/**
 * The one team selection shared by the scatter (click a point) and the team
 * rail (click a cell) — both call the same setter, which drives the lineup
 * optimizer and minutes plan below.
 *
 * This is a Context, not a value lifted into a shared parent that re-renders
 * everything under it, specifically so that a selection change cannot touch
 * components which don't read it. React only re-renders the consumers of a
 * context (the components that call useSelectedTeam) — a sibling like
 * TeamsTable, which never calls the hook, is structurally guaranteed not to
 * re-render, let alone remount, when the selection changes.
 */
export function SelectedTeamProvider({
  defaultTeam,
  children,
}: {
  defaultTeam: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState(defaultTeam);
  return (
    <SelectedTeamContext.Provider value={{ selected, setSelected }}>
      {children}
    </SelectedTeamContext.Provider>
  );
}

export function useSelectedTeam(): SelectedTeamContextValue {
  const ctx = useContext(SelectedTeamContext);
  if (!ctx) {
    throw new Error("useSelectedTeam must be used within a SelectedTeamProvider");
  }
  return ctx;
}
