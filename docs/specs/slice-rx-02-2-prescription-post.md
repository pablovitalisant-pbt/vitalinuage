# Slice RX-02-2: Receta POST flow (helper puro)

## Contrato del helper
Exportar `runRecetaSubmitFlow` desde `frontend/src/lib/recetaSubmitFlow.ts`.

Firma:
```
runRecetaSubmitFlow({
  recetaText: string,
  parseReceta: (text) => { ok: true, medications } | { ok: false, error },
  postConsultation: () => Promise<{ consultation_id: number } | { id: number }>,
  postPrescription: (consultationId: number, medications) => Promise<void>,
}) => Promise<{ ok: true } | { ok: false, error: string }>
```

## Reglas
1) Si parse error → retorna `{ ok:false, error }` y NO llama `postConsultation` ni `postPrescription`.
2) Si parse ok y `medications.length === 0` → llama SOLO `postConsultation`, retorna `{ ok:true }`.
3) Si parse ok y `medications.length > 0` → llama `postConsultation`, obtiene `consultation_id` (acepta `{id}` o `{consultation_id}`), luego llama `postPrescription(consultationId, medications)`, retorna `{ ok:true }`.

## Tests (rojos)
- Caso inválido: no llamadas a posts + error exacto.
- Caso válido con meds: 1 consulta + 1 prescription con payload correcto.
- Caso vacío: solo consulta.

## Error exacto
`Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración`

## Comando de test
`cd frontend && npm test -- slice-rx-02-2-prescription-post.test.tsx`
