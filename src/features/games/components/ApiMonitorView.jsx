import { useMemo, useState } from 'react'
import { LOTTO_ACTIVO_OFFICIAL_API } from '@/config/apiConfig'
import { useApiMonitor } from '@/features/games/hooks/useApiMonitor'
import {
  testAllOfficialApiMonitorDefinitions,
  testOfficialApiRequestByDefinition,
} from '@/features/games/services/gameCatalog'

const dateTimeFormatter = new Intl.DateTimeFormat('es-VE', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatTimestamp = (value) => {
  if (!value) return '-'
  return dateTimeFormatter.format(new Date(value))
}

const formatMs = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${value} ms`
}

const getStatusBadgeClassName = (status) => {
  if (status === 'ok') return 'bg-[#dbf5e2] text-[#13693f] border-[#9ad7ae]'
  if (status === 'error') return 'bg-[#fde1e1] text-[#8c2020] border-[#efb3b3]'
  if (status === 'queued') return 'bg-[#fff3d4] text-[#8b5b00] border-[#e7c46b]'
  return 'bg-[#e9edf4] text-[#46586f] border-[#c6d0df]'
}

const getStatusLabel = (status) => {
  if (status === 'ok') return 'OK'
  if (status === 'error') return 'Error'
  if (status === 'queued') return 'En cola'
  return 'Sin ejecutar'
}

export const ApiMonitorView = () => {
  const { definitions, snapshot } = useApiMonitor()
  const [runningAll, setRunningAll] = useState(false)
  const [runningByKey, setRunningByKey] = useState({})
  const [lastBatchSummary, setLastBatchSummary] = useState(null)

  const monitorRows = useMemo(() => {
    return definitions.map((definition) => {
      const requestKey = `${definition.type}-${definition.idgame}`
      const stateRow = snapshot.requestsByKey[requestKey]

      return {
        ...definition,
        requestKey,
        status: stateRow?.status || 'idle',
        lastAttemptAt: stateRow?.lastAttemptAt || null,
        lastCompletedAt: stateRow?.lastCompletedAt || null,
        lastWaitMs: stateRow?.lastWaitMs,
        lastDurationMs: stateRow?.lastDurationMs,
        requestCount: stateRow?.requestCount || 0,
        entriesCount: stateRow?.entriesCount || 0,
        latestResults: stateRow?.latestResults || [],
        lastError: stateRow?.lastError || null,
      }
    })
  }, [definitions, snapshot.requestsByKey])

  const handleRunSingle = async (definitionKey) => {
    setRunningByKey((current) => ({ ...current, [definitionKey]: true }))

    try {
      await testOfficialApiRequestByDefinition(definitionKey)
    } catch {
      // El error se refleja en el monitor; no interrumpimos la UI.
    } finally {
      setRunningByKey((current) => ({ ...current, [definitionKey]: false }))
    }
  }

  const handleRunAll = async () => {
    setRunningAll(true)
    setLastBatchSummary(null)

    try {
      const batchResult = await testAllOfficialApiMonitorDefinitions()
      const okCount = batchResult.filter((item) => item.status === 'ok').length
      const errorCount = batchResult.length - okCount
      setLastBatchSummary({ okCount, errorCount, total: batchResult.length })
    } finally {
      setRunningAll(false)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f8fafd]">
      <header className="border-b border-[#d3d9e2] bg-white px-4 py-3">
        <p className="font-heading text-xl uppercase tracking-[0.12em] text-[#1f6f53]">Monitor API Oficial</p>
        <p className="mt-1 text-xs text-[#4d5f75]">
          URL: {LOTTO_ACTIVO_OFFICIAL_API.url} | Intervalo minimo esperado: {LOTTO_ACTIVO_OFFICIAL_API.minIntervalMs} ms
        </p>
        <p className="text-xs text-[#4d5f75]">
          Fecha consultada: {LOTTO_ACTIVO_OFFICIAL_API.date || 'hoy'} | Total peticiones registradas: {snapshot.totalRequests}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunAll}
            disabled={runningAll}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              runningAll
                ? 'cursor-not-allowed border-[#c8d2df] bg-[#eef2f7] text-[#6f8097]'
                : 'border-[#2f7d5e] bg-[#e0f2e9] text-[#1f6f53] hover:bg-[#d5ebdf]'
            }`}
          >
            {runningAll ? 'Probando...' : 'Probar todas'}
          </button>

          {lastBatchSummary ? (
            <p className="text-xs text-[#4b617b]">
              Resultado lote: {lastBatchSummary.okCount} OK / {lastBatchSummary.errorCount} error de {lastBatchSummary.total}.
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-h-0 overflow-auto rounded-lg border border-[#d4dbe5] bg-white">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#eef2f8] text-[#2b3c52]">
              <tr>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Juego</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Type / idgame</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Estado</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Ultima consulta</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Espera</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Duracion</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Entradas</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Conteo</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Ultimos datos</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {monitorRows.map((row) => (
                <tr key={row.requestKey} className="border-t border-[#edf1f6] align-top">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-[#223348]">{row.gameName}</p>
                    <p className="text-[#5c7088]">{row.resultKind}</p>
                  </td>
                  <td className="px-3 py-2 text-[#25384f]">
                    {row.type} / {row.idgame}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${getStatusBadgeClassName(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                    {row.lastError ? <p className="mt-1 text-[#8c2020]">{row.lastError}</p> : null}
                  </td>
                  <td className="px-3 py-2 text-[#2f4259]">
                    <p>{formatTimestamp(row.lastAttemptAt)}</p>
                    <p className="text-[#5d7188]">Finalizo: {formatTimestamp(row.lastCompletedAt)}</p>
                  </td>
                  <td className="px-3 py-2 text-[#2f4259]">{formatMs(row.lastWaitMs)}</td>
                  <td className="px-3 py-2 text-[#2f4259]">{formatMs(row.lastDurationMs)}</td>
                  <td className="px-3 py-2 text-[#2f4259]">{row.entriesCount}</td>
                  <td className="px-3 py-2 text-[#2f4259]">{row.requestCount}</td>
                  <td className="px-3 py-2 text-[#2f4259]">
                    {row.latestResults.length > 0
                      ? row.latestResults.map((item) => `${item.number} ${item.name}`).join(' | ')
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleRunSingle(row.key)}
                      disabled={Boolean(runningByKey[row.key]) || runningAll}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                        runningByKey[row.key] || runningAll
                          ? 'cursor-not-allowed border-[#c8d2df] bg-[#eef2f7] text-[#6f8097]'
                          : 'border-[#3b5f8a] bg-[#e9f0fb] text-[#2a4e79] hover:bg-[#dce8fa]'
                      }`}
                    >
                      {runningByKey[row.key] ? 'Probando...' : 'Probar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="min-h-0 overflow-auto rounded-lg border border-[#d4dbe5] bg-white p-3">
          <p className="font-heading text-sm uppercase tracking-[0.15em] text-[#2d3f56]">Orden de ejecucion</p>
          <p className="mt-1 text-xs text-[#5b6f87]">Las mas recientes primero. Valida aqui que se respete la espera minima de 5 segundos.</p>

          <div className="mt-3 space-y-2">
            {snapshot.recentRequests.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#cad4e1] bg-[#f7f9fc] px-3 py-2 text-xs text-[#546981]">
                Aun no hay peticiones oficiales registradas.
              </p>
            ) : (
              snapshot.recentRequests.map((entry) => (
                <div key={entry.id} className="rounded-md border border-[#d8e0eb] bg-[#f8fafd] px-3 py-2 text-xs">
                  <p className="font-semibold text-[#24364c]">{entry.gameName} ({entry.requestKey})</p>
                  <p className="text-[#51657d]">{formatTimestamp(entry.queuedAt)} -&gt; {formatTimestamp(entry.completedAt)}</p>
                  <p className="text-[#51657d]">
                    Estado: {getStatusLabel(entry.status)} | Espera: {formatMs(entry.waitMs)} | Duracion: {formatMs(entry.durationMs)}
                  </p>
                  <p className="text-[#51657d]">Entradas: {entry.entriesCount}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
