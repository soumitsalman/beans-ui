import type { ClientTelemetryEvent } from '../../shared/types/telemetry'

export function logClientEvent(payload: ClientTelemetryEvent): void {
  if (!import.meta.client) return

  void $fetch('/api/telemetry', {
    method: 'POST',
    body: payload
  }).catch(() => undefined)
}
