import type { PlayerMode, PlayerProfile, TeamConfiguration, TeamRole } from '../state/gameTypes';

export interface CrewAccount {
  id: string;
  mode: PlayerMode;
  name: string;
  player: PlayerProfile;
  team: TeamConfiguration | null;
  savedAt: string;
}

interface CrewAccountSave {
  version: 1;
  accounts: CrewAccount[];
}

const STORAGE_KEY = 'beyond-earth-crew-accounts';
const roles: TeamRole[] = ['mission-commander', 'mission-engineer', 'science-officer', 'resource-manager'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validAccount(value: unknown): value is CrewAccount {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.savedAt !== 'string') return false;
  if (value.mode !== 'individual' && value.mode !== 'team') return false;
  if (!isRecord(value.player) || !['novice', 'cadet', 'mission specialist', 'flight director'].includes(String(value.player.experience))) return false;
  if (![value.player.name, value.player.role, value.player.focus].every((field) => typeof field === 'string')) return false;
  if (value.mode === 'individual') return value.team === null;
  if (!isRecord(value.team) || typeof value.team.name !== 'string' || typeof value.team.isConfirmed !== 'boolean' || !(value.team.confirmedAt === null || typeof value.team.confirmedAt === 'string') || !Array.isArray(value.team.participants) || value.team.participants.length < 1 || value.team.participants.length > 4) return false;
  return value.team.participants.every((person) => isRecord(person) && typeof person.id === 'string' && typeof person.name === 'string' && roles.includes(person.role as TeamRole));
}

export function loadCrewAccounts(): CrewAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.accounts)) return [];
    return value.accounts.filter(validAccount).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

export function saveCrewAccount(account: Omit<CrewAccount, 'id' | 'savedAt'>): CrewAccount[] {
  const accounts = loadCrewAccounts();
  const normalizedName = account.name.trim().toLocaleLowerCase();
  const existing = accounts.find((item) => item.mode === account.mode && item.name.trim().toLocaleLowerCase() === normalizedName);
  const nextAccount: CrewAccount = {
    ...account,
    id: existing?.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`),
    name: account.name.trim(),
    savedAt: new Date().toISOString(),
  };
  const updated = [nextAccount, ...accounts.filter((item) => item.id !== nextAccount.id)];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, accounts: updated } satisfies CrewAccountSave));
  } catch {
    return accounts;
  }
  return updated;
}

export function deleteCrewAccount(id: string): CrewAccount[] {
  const updated = loadCrewAccounts().filter((account) => account.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, accounts: updated } satisfies CrewAccountSave));
  } catch {
    return loadCrewAccounts();
  }
  return updated;
}

export function clearCrewAccounts(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // If browser storage is blocked, leave the existing profiles untouched.
  }
}
