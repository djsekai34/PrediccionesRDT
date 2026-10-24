# PrediccionesRDT

Las predicciones de **RDT (Ronda de Tiro)** de conferencias y premios de la NBA, comparadas en directo con la clasificación real de la temporada regular.

## Parte principal (`/`)

Página pública de solo lectura. Se actualiza sola cuando el admin cambia algo.

- **Predicciones**: top 10 de cada conferencia (Este y Oeste) de la persona seleccionada.
- **Premios**: MVP, DPOY, ROY, 6MOY, MIP y Entrenador del Año, con la foto del jugador o entrenador elegido.
- **Comparativa**: la predicción de la persona frente a la clasificación real, con los puntos de cada equipo, de cada conferencia y el total.
- **Todos**: ranking con podio y comparación de varias personas a la vez, con o sin la clasificación real, y una leyenda de colores.
- **Puntuación**: explicación del sistema de puntos.
- **Selector de temporada**: aparece cuando hay más de una. Las archivadas muestran su clasificación final congelada.

### Puntuación

| Acierto | Puntos |
| --- | --- |
| Posición exacta | 3 |
| A 1 puesto | 2 |
| A 2 puestos | 1 |
| A 3 o más puestos | 0 |
| Premio acertado | 5 |

Máximo: 30 por conferencia + 30 en premios = **90 puntos**. Hasta que haya partidos jugados, las conferencias no puntúan.

## Admin (`/admin`)

Entras con Google y solo pueden editar las cuentas autorizadas.

- **Predicciones**: crear y quitar participantes, elegir y ordenar su top 10 de cada conferencia arrastrando equipos.
- **Premios**: elegir el jugador o entrenador de cada participante, con buscador y sugerencias.
- **Ganadores reales**: apuntar quién gana cada premio; puntúa al instante.
- **Temporadas**:
  - *Archivar vigente y crear nueva*: guarda la clasificación final como una captura y abre la siguiente (por ejemplo `2027-28`). Un modal permite elegir qué participantes repiten, con las predicciones vacías.
  - *Desarchivar*: la temporada vuelve a usar la clasificación en directo.
  - *Eliminar*: borra la temporada con sus participantes, predicciones y premios. No se puede deshacer.

## Front end

- **Stack**: Vite, React 19, TypeScript y Tailwind CSS v4.
- **Datos**: Firestore en tiempo real (`onSnapshot`) y Google Auth. La clasificación y las plantillas vienen de la API pública de ESPN, y las fotos de entrenadores de Wikipedia.
- **Estado**: `zustand` para los datos compartidos y la temporada elegida; TanStack Query para ESPN y las fotos.
- **Librerías de interfaz**: dnd-kit (arrastrar equipos), motion (animaciones y pestañas), NumberFlow (números animados), auto-animate (listas), Radix Tooltip, Sonner (avisos) y lucide-react (iconos).
- **Diseño**: tema oscuro con los colores del logo (negro, rojo, azul y blanco) y el verde de los Boston Celtics, definidos como tokens en `src/index.css`.
- **Rutas**: sin librería; `src/lib/route.ts` distingue `/` de `/admin`.

```
src/
├── App.tsx              Página pública: cabecera, pestañas y contenido
├── components/
│   ├── AdminPage.tsx    Zona admin (predicciones, premios, ganadores, temporadas)
│   ├── Comparison.tsx   Pestaña Comparativa
│   ├── Overview.tsx     Pestaña Todos (ranking y tablas)
│   ├── ConferencePicks.tsx · AwardsPanel.tsx · PlayerCombobox.tsx
│   ├── SeasonSwitcher.tsx · ScoringRules.tsx · Avatar.tsx · TeamLogo.tsx
├── store/useStore.ts    Datos de Firestore, temporada activa y acciones de admin
├── hooks/               useStandings (en directo o captura) y usePlayers
├── lib/                 scoring, espn, players, photos, firebase, route, types
└── data/                teams (30 equipos) y awards
```
