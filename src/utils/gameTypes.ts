export const VALID_GAME_TYPES = ["snooker", "nineball", "threecushion", "eightball"] as const;

export type GameType = (typeof VALID_GAME_TYPES)[number];

export function isValidGameType(type: string | null): type is GameType {
  return VALID_GAME_TYPES.includes(type as any);
}
