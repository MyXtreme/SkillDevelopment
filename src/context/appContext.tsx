import { useState, useContext, createContext, type ReactNode } from "react";

export type Skill = "typing" | "reading" | "memory";
export type Theme = "iron-gall-old" | "iron-gall" | "type-writer" | "dark";
export type LayoutMode = "normal" | "focused";

export type AppStateType = {
  skill: Skill;
  theme: Theme;
  layoutMode: LayoutMode;
};

interface AppContextType {
  appState: AppStateType;
  changeSkill: (skill: Skill) => void;
  changeTheme: (theme: Theme) => void;
  changeLayoutMode: (layoutMode: LayoutMode) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<AppStateType>({
    skill: "typing",
    theme: "iron-gall-old",
    layoutMode: "normal",
  });

  const changeSkill = (newSkill: Skill) => {
    setApp((prev) => ({ ...prev, skill: newSkill }));
  };

  const changeTheme = (newTheme: Theme) => {
    setApp((prev) => ({ ...prev, theme: newTheme }));
  };

  const changeLayoutMode = (newLayoutMode: LayoutMode) => {
    setApp((prev) => ({ ...prev, layoutMode: newLayoutMode }));
  };

  return (
    <AppContext
      value={{ appState: app, changeSkill, changeTheme, changeLayoutMode }}
    >
      {children}
    </AppContext>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppProvider");
  }
  return context;
}
