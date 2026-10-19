# More News

Agregador **personal** de titulares de periódicos digitales en español. Reúne noticias de varios medios en una sola vista para comparar enfoques y acceder al contenido con enlace al original.

Medios incluidos por defecto:

- El País
- El Confidencial
- 20 Minutos
- ABC

## Requisitos

- Node.js 20+
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

La app queda disponible en [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Añadir otro periódico

Edita `src/lib/newspapers/sources.ts` y añade un objeto con:

| Campo     | Descripción                          |
|-----------|--------------------------------------|
| `id`      | Identificador único (slug)           |
| `name`    | Nombre visible                       |
| `feedUrl` | URL del feed RSS o Atom del medio    |
| `website` | Página principal                     |
| `accent`  | Color de acento en la UI (hex)       |
| `enabled` | `true` / `false` para activar        |

No hace falta modificar rutas API ni componentes: el listado se actualiza solo.

## Cómo funciona

1. **`GET /api/headlines`** — Lee los feeds configurados y devuelve titulares unificados.
2. **`/articulo?url=...`** — Extrae el cuerpo del artículo con [Mozilla Readability](https://github.com/nicklockwood/Readability) y muestra enlace al original del medio.

Los titulares se obtienen vía RSS cuando el periódico lo publica. Si un feed falla, el resto sigue cargando y se muestra un aviso.

## Uso responsable

Esta aplicación está pensada para **consulta personal**. Los contenidos pertenecen a sus respectivos editores. Respeta las condiciones de uso de cada medio y el derecho de autor; la app incluye enlace explícito a la fuente original en cada noticia.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript, Tailwind CSS, shadcn/ui
- `rss-parser`, `@mozilla/readability`

## Repositorio

Código destino: [github.com/bperezglez/more-news](https://github.com/bperezglez/more-news)
