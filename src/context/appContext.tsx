import {
  useState,
  useContext,
  createContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

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
  setAppState: Dispatch<SetStateAction<AppStateType>>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppStateType>({
    skill: "typing",
    theme: "iron-gall-old",
    layoutMode: "normal",
  });

  return <AppContext value={{ appState, setAppState }}>{children}</AppContext>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppProvider");
  }
  return context;
}
