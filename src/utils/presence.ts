export function getOriginEmoji(
  origin?: string,
  ruleType?: string,
): { emoji: string; title: string } {
  if (origin?.includes("github")) {
    return { emoji: "🔧", title: "github" };
  }
  if (origin?.includes("vercel")) {
    return { emoji: "👥", title: "vercel" };
  }
  if (origin?.includes("localhost")) {
    return { emoji: "🏠", title: "localhost" };
  }

  if (ruleType === "spectator") {
    return { emoji: "🔭", title: "spectator" };
  }
  if (ruleType === "replay") {
    return { emoji: "👀", title: "replay" };
  }
  if (ruleType === "bot") {
    return { emoji: "🤖", title: "bot" };
  }

  if (ruleType === "nineball") {
    return { emoji: "⑨", title: "nineball" };
  }
  if (ruleType === "snooker") {
    return { emoji: "⚪", title: "snooker" };
  }
  if (ruleType === "threecushion") {
    return { emoji: "③", title: "threecushion" };
  }

  return { emoji: "🎮", title: "external" };
}
