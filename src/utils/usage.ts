import { UsageService } from "@/services/usageservice"

export function markUsage(metric: string) {
  if (metric === "lobby") {
    // 10% sampling for frequent lobby usage events to reduce Vercel invocations
    if (Math.random() >= 0.1) return
  }

  fetch(`/api/usage/${metric}`, {
    method: "PUT",
  })
}

export async function markUsageFromServer(metric: string) {
  const usageService = new UsageService(metric)
  await usageService.incrementCount(Date.now())
}
