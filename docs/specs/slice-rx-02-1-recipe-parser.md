# Slice RX-02-1: Receta parser (Formato A)

## Regla
Cada línea de la receta debe tener exactamente 4 partes separadas por `|`:

`Nombre | Dosis | Frecuencia | Duración`

Reglas de parsing:
- split por líneas
- trim por línea
- ignorar líneas vacías
- split por `|`
- si una línea no tiene exactamente 4 partes → error:
  `Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración`
- `notes` no se usa
- si el textarea está vacío o solo espacios: OK y `medications: []`

## Ejemplos válidos
- `Paracetamol | 500 mg | cada 8 horas | 5 días`
- `Ibuprofeno | 400 mg | cada 12 horas | 7 días`

## Ejemplos inválidos
- `Paracetamol | 500 mg | cada 8 horas` (3 partes)
- `Paracetamol | 500 mg | cada 8 horas | 5 días | extra` (5 partes)

## Error exacto
`Cada línea debe tener 4 campos separados por '|': Nombre | Dosis | Frecuencia | Duración`

## Fuente de implementación
- `frontend/src/lib/recetaParser.ts`
