# Lotto Activo - Plataforma de Juegos

Plataforma de sorteos construida con React + Vite para operar con juegos en vivo, resultados en tiempo real simulados y estructura preparada para APIs productivas.

## Caracteristicas
- Arquitectura por features (games, streaming, store, ui).
- Estado global con Zustand.
- Carga de datos por juego desde endpoints configurables por entorno.
- Flujo en tiempo real por WebSocket simulado para ganadores.
- Ruleta de ganador con fase de celebracion.
- Podio de ultimos 3 resultados con hora del ultimo sorteo.

## Tecnologias
- React 19
- Vite 5
- Tailwind CSS
- Zustand
- Framer Motion

## Estructura principal
- src/components/ui
- src/store
- src/features/games
- src/features/streaming
- src/config
- docs

## Variables de entorno
Este proyecto usa variables VITE_ para configurar APIs.

Archivo local:
- .env

Plantilla versionable:
- .env.example

Variables actuales:
- VITE_API_BASE_URL
- VITE_API_GAME_LOTTO_ACTIVO
- VITE_API_GAME_LOTTO_INTER
- VITE_API_GAME_MONJE_MILLONARIO
- VITE_API_PRODUCTS_LIST
- VITE_API_PRODUCTS_CATALOG
- VITE_API_PRODUCTS_PRICING
- VITE_API_PRODUCTS_AVAILABILITY

## Scripts
- npm install
- npm run dev
- npm run build
- npm run preview
- npm run lint

## Documentacion viva
- docs/ARCHITECTURE.md: arquitectura y flujo de datos.
- docs/CHANGELOG.md: historial de cambios.
- docs/UPDATING.md: proceso para mantener documentacion actualizada en cada cambio.

## Flujo de integracion de APIs
1. Define endpoints reales en .env.
2. Mantiene VITE_API_BASE_URL para cada entorno.
3. Valida carga de payload por juego.
4. Verifica build antes de publicar.

## Despliegue en Vercel
- Asegura variables VITE_ en Project Settings.
- Ejecuta build de verificacion local.
- Publica rama main.
