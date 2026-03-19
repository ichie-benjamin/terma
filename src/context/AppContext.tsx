import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from "react";
import { type AppState, type Action, DEFAULT_SETTINGS } from "../types";
import { appReducer } from "./reducer";

const initialState: AppState = {
  projects: [],
  activeSessionId: null,
  sidebarWidth: 240,
  sidebarVisible: true,
  settings: DEFAULT_SETTINGS,
  quickSwitchOpen: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
