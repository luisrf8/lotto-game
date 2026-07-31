import { useMemo, useState } from 'react'
import { DEFAULT_OFFICIAL_API_DATE, LOTTO_ACTIVO_OFFICIAL_API } from '@/config/apiConfig'
import { useApiMonitor } from '@/features/games/hooks/useApiMonitor'
import {
  OFFICIAL_API_MONITOR_SEQUENCES,
  runOfficialApiMonitorSequence,
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

const buildDateFromInput = (value) => {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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
  const [runningSequenceKey, setRunningSequenceKey] = useState(null)
  const [runningByKey, setRunningByKey] = useState({})
  const [lastBatchSummary, setLastBatchSummary] = useState(null)
  const [selectedPayload, setSelectedPayload] = useState(null)
  const [runOptionsModal, setRunOptionsModal] = useState(null)
  const [selectedDate, setSelectedDate] = useState(LOTTO_ACTIVO_OFFICIAL_API.date || DEFAULT_OFFICIAL_API_DATE)

  const monitorRows = useMemo(() => {
    return definitions.map((definition) => {
      const stateRow = snapshot.requestsByKey[definition.key]

      return {
        ...definition,
        requestKey: definition.key,
        status: stateRow?.status || 'idle',
        date: stateRow?.date || null,
        lastAttemptAt: stateRow?.lastAttemptAt || null,
        lastCompletedAt: stateRow?.lastCompletedAt || null,
        lastWaitMs: stateRow?.lastWaitMs,
        lastDurationMs: stateRow?.lastDurationMs,
        requestCount: stateRow?.requestCount || 0,
        entriesCount: stateRow?.entriesCount || 0,
        latestResults: stateRow?.latestResults || [],
        lastError: stateRow?.lastError || null,
        requestUrl: stateRow?.requestUrl || null,
        rawPayload: stateRow?.rawPayload || null,
      }
    })
  }, [definitions, snapshot.requestsByKey])

  const buildScenarioPlan = (mode) => {
    if (mode === 'today') {
      return [{ label: 'Hoy', dateOverride: '' }]
    }

    if (mode === 'date') {
      if (!selectedDate) {
        throw new Error('Selecciona una fecha valida para ejecutar la prueba por fecha.')
      }

      return [{ label: `Fecha ${selectedDate}`, dateOverride: selectedDate }]
    }

    return [
      { label: 'Hoy', dateOverride: '' },
      { label: `Fecha ${selectedDate}`, dateOverride: selectedDate },
    ]
  }

  const handleRunSingle = async (definitionKey, mode = 'today') => {
    const definition = definitions.find((entry) => entry.key === definitionKey)
    if (!definition) return

    setRunningByKey((current) => ({ ...current, [definitionKey]: true }))
    setLastBatchSummary(null)

    try {
      const scenarios = buildScenarioPlan(mode)
      let okCount = 0
      let errorCount = 0

      for (const scenario of scenarios) {
        try {
          await testOfficialApiRequestByDefinition(definitionKey, {
            dateOverride: scenario.dateOverride,
            requestLabel: `${definition.description} | ${scenario.label}`,
          })
          okCount += 1
        } catch {
          errorCount += 1
        }
      }

      setLastBatchSummary({
        label: `${definition.gameName} ${mode === 'all' ? 'todo' : mode === 'date' ? 'fecha' : 'hoy'}`,
        okCount,
        errorCount,
        total: scenarios.length,
      })
    } catch (error) {
      setLastBatchSummary({
        label: `${definition.gameName} ${mode === 'all' ? 'todo' : mode === 'date' ? 'fecha' : 'hoy'}`,
        okCount: 0,
        errorCount: 1,
        total: 1,
        error: error instanceof Error ? error.message : 'No se pudo ejecutar la prueba.',
      })
    } finally {
      setRunningByKey((current) => ({ ...current, [definitionKey]: false }))
    }
  }

  const handleRunAll = async (mode = 'today') => {
    setRunningAll(true)
    setLastBatchSummary(null)

    try {
      const scenarios = buildScenarioPlan(mode)
      let okCount = 0
      let errorCount = 0
      let total = 0

      for (const scenario of scenarios) {
        const sequenceKey = scenario.dateOverride ? 'ALL_IDS_CONFIGURED_DATE' : 'ALL_IDS_TODAY'
        const sequence = OFFICIAL_API_MONITOR_SEQUENCES.find((entry) => entry.key === sequenceKey)
        if (!sequence) continue

        setRunningSequenceKey(sequence.key)
        const batchResult = await runOfficialApiMonitorSequence(sequence.key, {
          dateOverride: scenario.dateOverride,
          requestLabelPrefix: scenario.label,
        })
        const sequenceOkCount = batchResult.filter((item) => item.status === 'ok').length

        okCount += sequenceOkCount
        errorCount += batchResult.length - sequenceOkCount
        total += batchResult.length
      }

      setLastBatchSummary({
        label: mode === 'all' ? 'todo' : mode === 'date' ? 'fecha' : 'hoy',
        okCount,
        errorCount,
        total,
      })
    } catch (error) {
      setLastBatchSummary({
        label: mode === 'all' ? 'todo' : mode === 'date' ? 'fecha' : 'hoy',
        okCount: 0,
        errorCount: 1,
        total: 1,
        error: error instanceof Error ? error.message : 'No se pudo ejecutar la prueba.',
      })
    } finally {
      setRunningAll(false)
      setRunningSequenceKey(null)
    }
  }

  const handleOpenRunOptions = (options) => {
    setRunOptionsModal(options)
  }

  const handleCloseRunOptions = () => {
    setRunOptionsModal(null)
  }

  const handleRunFromModal = async (mode) => {
    if (!runOptionsModal) return

    const currentOptions = runOptionsModal
    setRunOptionsModal(null)

    if (currentOptions.scope === 'single') {
      await handleRunSingle(currentOptions.definitionKey, mode)
      return
    }

    await handleRunAll(mode)
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafd]">
      <header className="border-b border-[#d3d9e2] bg-white px-4 py-3">
        <p className="font-heading text-xl uppercase tracking-[0.12em] text-[#1f6f53]">Monitor API Oficial</p>
        <p className="mt-1 text-xs text-[#4d5f75]">
          URL: {LOTTO_ACTIVO_OFFICIAL_API.url} | Intervalo minimo esperado: {LOTTO_ACTIVO_OFFICIAL_API.minIntervalMs} ms
        </p>
        <p className="text-xs text-[#4d5f75]">
          Fecha por defecto: {selectedDate} | Total peticiones registradas: {snapshot.totalRequests}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenRunOptions({ scope: 'all', label: 'Monitor API Oficial' })}
            disabled={runningAll || Boolean(runningSequenceKey)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
              runningAll || runningSequenceKey
                ? 'cursor-not-allowed border-[#c8d2df] bg-[#eef2f7] text-[#6f8097]'
                : 'border-[#2f7d5e] bg-[#e0f2e9] text-[#1f6f53] hover:bg-[#d5ebdf]'
            }`}
          >
            {runningAll ? 'Probando...' : 'Probar'}
          </button>

          {lastBatchSummary ? (
            <p className="text-xs text-[#4b617b]">
              Resultado {lastBatchSummary.label || 'lote'}: {lastBatchSummary.okCount} OK / {lastBatchSummary.errorCount} error de {lastBatchSummary.total}.
            </p>
          ) : null}
        </div>

        {lastBatchSummary?.error ? <p className="mt-1 text-xs text-[#8c2020]">{lastBatchSummary.error}</p> : null}

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-[#d7dfeb] bg-[#f8fafc] px-3 py-3 text-xs text-[#31445c]">
            <p className="font-semibold uppercase tracking-[0.12em] text-[#27405f]">Funciones documentadas</p>
            <p className="mt-2">user y pass autentican el cliente autorizado.</p>
            <p>type=2 consulta Animalitos y type=1 consulta Trio y Terminal.</p>
            <p>idgame disponibles: 1 Lotto Activo, 2 RD Internacional, 3 Republica Dominicana, 4 Trio Activo, 5 Terminal Trio.</p>
            <p>date es opcional. Si no se envia, la API responde la fecha actual.</p>
            <p className="mt-2 text-[#586c84]">Las secuencias del monitor se ejecutan en cola para respetar el minimo de 5 segundos entre peticiones.</p>
          </div>

          <div className="grid gap-2">
            {OFFICIAL_API_MONITOR_SEQUENCES.map((sequence) => (
              <div key={sequence.key} className="rounded-lg border border-[#d7dfeb] bg-[#fbfcfe] px-3 py-3 text-xs text-[#31445c]">
                <p className="font-semibold uppercase tracking-[0.12em] text-[#27405f]">{sequence.label}</p>
                <p className="mt-1">{sequence.description}</p>
                <p className="mt-1 text-[#627792]">Consultas: {sequence.definitionKeys.length}</p>
                {sequence.requiresConfiguredDate ? (
                  <p className="mt-1 text-[#627792]">Fecha activa: {selectedDate}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden gap-3 p-3 lg:grid-cols-[1.4fr_1fr]">
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
                    <p className="mt-1 text-[#7a8da3]">{row.description}</p>
                  </td>
                  <td className="px-3 py-2 text-[#25384f]">
                    <p>{row.type} / {row.idgame}</p>
                    <p className="text-[#627792]">Digitos: {row.digits}</p>
                    <p className="text-[#627792]">Fecha: {row.date || 'hoy'}</p>
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
                    {row.requestUrl ? <p className="mt-1 break-all text-[#6a7f98]">{row.requestUrl}</p> : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRunOptions({
                          scope: 'single',
                          definitionKey: row.key,
                          label: row.gameName,
                        })}
                        disabled={Boolean(runningByKey[row.key]) || runningAll || Boolean(runningSequenceKey)}
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                          runningByKey[row.key] || runningAll || runningSequenceKey
                            ? 'cursor-not-allowed border-[#c8d2df] bg-[#eef2f7] text-[#6f8097]'
                            : 'border-[#3b5f8a] bg-[#e9f0fb] text-[#2a4e79] hover:bg-[#dce8fa]'
                        }`}
                      >
                        {runningByKey[row.key] ? 'Probando...' : 'Probar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayload({
                          gameName: row.gameName,
                          requestUrl: row.requestUrl,
                          date: row.date,
                          payload: row.rawPayload,
                        })}
                        disabled={!row.rawPayload}
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                          row.rawPayload
                            ? 'border-[#87633b] bg-[#f9efdf] text-[#7a5528] hover:bg-[#f3e4cd]'
                            : 'cursor-not-allowed border-[#c8d2df] bg-[#eef2f7] text-[#6f8097]'
                        }`}
                      >
                        Ver JSON
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="min-h-0 overflow-y-auto rounded-lg border border-[#d4dbe5] bg-white p-3">
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
                  {entry.requestLabel ? <p className="text-[#51657d]">{entry.requestLabel}</p> : null}
                  <p className="text-[#51657d]">{formatTimestamp(entry.queuedAt)} -&gt; {formatTimestamp(entry.completedAt)}</p>
                  <p className="text-[#51657d]">
                    Estado: {getStatusLabel(entry.status)} | Espera: {formatMs(entry.waitMs)} | Duracion: {formatMs(entry.durationMs)}
                  </p>
                  <p className="text-[#51657d]">Fecha: {entry.date || 'hoy'} | Entradas: {entry.entriesCount}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedPayload ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08111d]/72 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#d1d9e5] bg-white shadow-[0_28px_80px_rgba(3,8,20,0.38)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#d9e0ea] px-5 py-4">
              <div>
                <p className="font-heading text-lg uppercase tracking-[0.1em] text-[#26425f]">Respuesta JSON</p>
                <p className="mt-1 text-sm text-[#51657d]">{selectedPayload.gameName}</p>
                <p className="text-xs text-[#6c8097]">Fecha: {selectedPayload.date || 'hoy'}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="rounded-md border border-[#c8d2df] bg-[#f4f7fb] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#445a74] transition hover:bg-[#e9eff7]"
              >
                Cerrar
              </button>
            </div>

            {selectedPayload.requestUrl ? (
              <div className="border-b border-[#edf1f6] bg-[#f8fafc] px-5 py-3 text-xs text-[#5b7088]">
                <p className="break-all">{selectedPayload.requestUrl}</p>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto bg-[#0b1220] px-5 py-4">
              <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-[#d7e4ff]">
                {JSON.stringify(selectedPayload.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      {runOptionsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08111d]/72 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[#d1d9e5] bg-white p-5 shadow-[0_28px_80px_rgba(3,8,20,0.38)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-lg uppercase tracking-[0.1em] text-[#26425f]">Opciones de prueba</p>
                <p className="mt-1 text-sm text-[#51657d]">{runOptionsModal.label}</p>
                <p className="text-xs text-[#6c8097]">Selecciona la funcion que quieres ejecutar.</p>
              </div>

              <button
                type="button"
                onClick={handleCloseRunOptions}
                className="rounded-md border border-[#c8d2df] bg-[#f4f7fb] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#445a74] transition hover:bg-[#e9eff7]"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#d7dfeb] bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#26425f]">Fecha personalizada</p>
              <div className="mt-2">
                <label className="text-xs text-[#5c7189]">
                  Fecha unica
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="mt-1 w-full rounded-md border border-[#c9d4e1] bg-white px-3 py-2 text-sm text-[#2a3f58] outline-none transition focus:border-[#7ea6cd]"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-[#6c8097]">La API acepta una sola fecha por llamada usando el parametro date.</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleRunFromModal('today')}
                className="rounded-xl border border-[#d7dfeb] bg-[#f8fafc] px-4 py-4 text-left transition hover:border-[#8fb3d6] hover:bg-[#edf4fd]"
              >
                <p className="font-heading text-sm uppercase tracking-[0.1em] text-[#26425f]">Hoy</p>
                <p className="mt-1 text-xs text-[#5c7189]">Ejecuta la consulta sin enviar date.</p>
              </button>

              <button
                type="button"
                onClick={() => handleRunFromModal('date')}
                className="rounded-xl border border-[#d7dfeb] bg-[#f8fafc] px-4 py-4 text-left transition hover:border-[#8fb3d6] hover:bg-[#edf4fd]"
              >
                <p className="font-heading text-sm uppercase tracking-[0.1em] text-[#26425f]">Fecha</p>
                <p className="mt-1 text-xs text-[#5c7189]">Usa la fecha seleccionada: {selectedDate}.</p>
              </button>

              <button
                type="button"
                onClick={() => handleRunFromModal('all')}
                className="rounded-xl border border-[#d7dfeb] bg-[#f8fafc] px-4 py-4 text-left transition hover:border-[#8fb3d6] hover:bg-[#edf4fd]"
              >
                <p className="font-heading text-sm uppercase tracking-[0.1em] text-[#26425f]">Todo</p>
                <p className="mt-1 text-xs text-[#5c7189]">Ejecuta hoy y la fecha seleccionada en la misma secuencia.</p>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
