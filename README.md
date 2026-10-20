# More News

Agregador **personal** de titulares de periódicos digitales en español. Reúne noticias de varios medios en una sola vista y **solo lista las que se pueden leer enteras en abierto** dentro de la app.

Medios configurados en `sources.ts` (26). Cada uno tiene pestaña; el botón **Medios** elige cuáles quieres ver (se guarda en el navegador). Los que tienen RSS bloqueado en el servidor siguen en la lista pero pueden ir vacíos hasta tener feed válido.

Algunos medios pueden ir desactivados (`enabled: false`) si su RSS bloquea el servidor desde el datacenter (Vozpópuli, Público, El Economista, Sport, EFE). Puedes probar otra URL de feed y activarlos en `src/lib/newspapers/sources.ts`.

## Requisitos

- Node.js 20+
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

La app queda disponible en [http://127.0.0.1:43123](http://127.0.0.1:43123).

En local, si no defines `APP_USERNAME` y `APP_PASSWORD`, la app no pide login. Para probarlo, copia `.env.example` a `.env.local` y rellénalo.

## Añadir otro periódico

Edita `src/lib/newspapers/sources.ts` y añade un objeto con:

| Campo     | Descripción                          |
|-----------|--------------------------------------|
| `id`      | Identificador único (slug)           |
| `name`    | Nombre visible                       |
| `feedUrl` | URL del feed RSS o Atom del medio    |
| `website` | Página principal                     |
| `accent`  | Color de acento en la UI (hex)       |
| `role`    | `principal` (se lista) o `contraste` (solo para buscar cobertura abierta) |
| `enabled` | `true` / `false` para activar        |

No hace falta modificar rutas API ni componentes: el listado se actualiza solo.

## Cómo funciona

1. Se leen los RSS de todos los medios configurados.
2. Para cada titular de un medio principal se abre el artículo y se comprueba si es de pago con las marcas que publican los propios medios (`isAccessibleForFree` de schema.org y `article:content_tier`).
3. Si es abierto, se lee con [Mozilla Readability](https://github.com/mozilla/readability).
4. Si es de pago, está bloqueado o no se puede extraer, se busca **la misma noticia en otro medio** (coincidencia de palabras del titular y la entradilla en una ventana de 48 h) y se usa la primera cobertura que esté en abierto.
5. En la pestaña **Todos**, las noticias legibles se ordenan por relevancia (posición en portada del RSS y cuántos medios cubren el mismo hecho). Al **final** van las de pago o sin alternativa en abierto, para que decidas si abrir el original. En cada medio (pestaña) solo se listan las legibles.

En la vista de lectura de una noticia sustituida se avisa de que el original es de pago y se enlaza al original y a una búsqueda en PressReader, que puedes leer con tu carné de biblioteca a través de eBiblio. El contenido de PressReader no se reproduce en la app: su licencia solo permite leerlo en su plataforma.

API: `GET /api/headlines` (listado legible) y `GET /api/article?url=` (solo devuelve artículos abiertos; los de pago responden 403). Solo acepta URLs de los medios configurados.

## Acceso con usuario y contraseña

| Variable       | Descripción |
|----------------|-------------|
| `APP_USERNAME` | Usuario de acceso |
| `APP_PASSWORD` | Contraseña |
| `AUTH_SECRET`  | Clave para firmar la cookie de sesión (`openssl rand -hex 32`). Si la cambias, se cierran todas las sesiones |

La sesión dura 30 días (cookie `httpOnly`). En producción, si faltan las variables, la app queda cerrada y lo indica en el login.

## Despliegue en Vercel (recomendado)

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub y pulsa **Add New → Project**.
2. Importa `bperezglez/more-news`. Vercel detecta Next.js; no cambies los comandos de build.
3. En **Environment Variables** añade `APP_USERNAME`, `APP_PASSWORD` y `AUTH_SECRET`.
4. **Deploy**. Cada push a `main` vuelve a desplegar.

Nota: algunos medios (sobre todo El País) bloquean a menudo las peticiones desde centros de datos; esas noticias se sustituyen por otra cobertura abierta o se ocultan.

## Uso responsable

Esta aplicación está pensada para **consulta personal**. Los contenidos pertenecen a sus respectivos editores. Respeta las condiciones de uso de cada medio y el derecho de autor; la app incluye enlace explícito a la fuente original en cada noticia.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript, Tailwind CSS, shadcn/ui
- `rss-parser`, `@mozilla/readability`, `linkedom`

## Repositorio y despliegue

- Repositorio: [github.com/bperezglez/more-news](https://github.com/bperezglez/more-news)
- **GitHub + GitHub Pages + PWA**: guía paso a paso en [docs/GITHUB-Y-PAGES.md](docs/GITHUB-Y-PAGES.md)

Comandos útiles:

```bash
npm run sync:headlines   # genera public/data/headlines.json con el listado legible
npm run build:pages      # simula el build de GitHub Pages
```

En **GitHub Pages** la URL será `https://bperezglez.github.io/more-news/`. Pages es estático: **no admite contraseña** ni lectura integrada (solo muestra titulares y enlaces). Si quieres que todo sea privado, usa Vercel y desactiva Pages.
