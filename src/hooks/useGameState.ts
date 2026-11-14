import { useContext } from 'react';
import { GameStateContext } from '../app/AppProviders';

export function useGameState() {
  const context = useContext(GameStateContext);

  if (!context) {
    throw new Error('useGameState must be used within AppProviders.');
  }

  return context;
}
