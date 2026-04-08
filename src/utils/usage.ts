import { UsageService } from "@/services/usageservice"

export function markUsage(metric: string) {
  fetch(`/api/usage/${metric}`, {
    method: "PUT",
  }).catch((err) => {
    console.error(`Failed to mark usage for ${metric}:`, err)
  })
}

export async function markUsageFromServer(metric: string) {
  const usageService = new UsageService(metric)
  await usageService.incrementCount(Date.now())
}
