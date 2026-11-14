import { createContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { gameReducer } from '../state/gameReducer';
import { initialGameState } from '../state/gameState';
import type { GameState, GameAction } from '../state/gameTypes';
import { clearSavedProgress, hasMeaningfulSavedProgress, loadGameStateDetailed, saveGameState } from '../services/storage';

export const GameStateContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  hasSavedProgress: boolean;
  loadWarning: string | null;
  savedAt: string | null;
} | null>(null);

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const result = loadGameStateDetailed();
    dispatch({
      type: 'LOAD_STATE',
      payload: result.state ?? { isLoaded: true },
    });
    setHasSavedProgress(result.hasSavedProgress);
    setLoadWarning(result.warning);
    setSavedAt(result.savedAt);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!hasMeaningfulSavedProgress(state)) {
        clearSavedProgress();
        setHasSavedProgress(false);
        setSavedAt(null);
        return;
      }
      if (saveGameState(state)) {
        setHasSavedProgress(true);
        setLoadWarning(null);
        setSavedAt(new Date().toISOString());
      }
    }
  }, [isHydrated, state]);

  return (
    <GameStateContext.Provider value={{ state, dispatch, hasSavedProgress, loadWarning, savedAt }}>
      {children}
    </GameStateContext.Provider>
  );
}
