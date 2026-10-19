# GitHub, GitHub Pages y PWA

Guía para tener el código en [github.com/bperezglez/more-news](https://github.com/bperezglez/more-news), desplegarlo en **GitHub Pages** e instalarlo como **PWA** en el móvil.

## 1. Subir el código a GitHub (control de versiones)

### 1.1 Repositorio en GitHub

Si aún no existe, créalo en GitHub con el nombre `more-news` (puede estar vacío).

### 1.2 Autenticación (elige una)

**Opción A — HTTPS con token (recomendada)**

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained** (o classic con scope `repo`).
2. Crea un token con acceso de lectura/escritura al repositorio `more-news`.
3. En tu máquina:

```bash
git remote add github https://github.com/bperezglez/more-news.git
# Si ya existe: git remote set-url github https://github.com/bperezglez/more-news.git
git push -u github main
```

Cuando pida contraseña, usa el **token** (no la contraseña de la cuenta).

**Opción B — SSH**

```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
# Añade la clave pública en GitHub → Settings → SSH keys
git remote add github git@github.com:bperezglez/more-news.git
git push -u github main
```

**Opción C — GitHub CLI**

```bash
gh auth login
gh repo set-default bperezglez/more-news
git push -u github main
```

### 1.3 Flujo habitual

```bash
git add .
git commit -m "Describe el cambio"
git push github main
```

Cada push a `main` dispara el despliegue en Pages (ver siguiente sección).

---

## 2. GitHub Pages (sitio publicado)

La app en Pages es **estática**: los titulares se generan en CI desde RSS y se guardan en `public/data/headlines.json`. La lectura integrada del artículo completo (`/api/article`) solo está disponible en **local** o en un host con Node (p. ej. Vercel); en Pages verás el resumen del RSS y el botón para abrir el medio original.

### 2.1 Activar Pages (solo la primera vez)

1. En GitHub, abre el repo **more-news**.
2. **Settings** → **Pages**.
3. En **Build and deployment** → **Source**, elige **GitHub Actions** (no “Deploy from branch”).

### 2.2 Workflow incluido

El archivo `.github/workflows/deploy-github-pages.yml`:

- Se ejecuta en cada **push** a `main`.
- Se puede lanzar a mano: pestaña **Actions** → *Desplegar en GitHub Pages* → **Run workflow**.
- Cada **hora** (cron) vuelve a sincronizar RSS y redeploya.

Variables de build en CI:

- `NEXT_PUBLIC_BASE_PATH=/more-news`
- URL publicada: **https://bperezglez.github.io/more-news/**

Si renombras el repo, cambia `NEXT_PUBLIC_BASE_PATH` en el workflow al nombre del repo (`/<nombre-repo>`).

### 2.3 Comprobar el despliegue

1. **Actions** → workflow en verde.
2. **Settings** → **Pages** → enlace del sitio.
3. Abre la URL en el navegador.

### 2.4 Probar el build de Pages en local (opcional)

```bash
npm run build:pages
# Restaura las APIs tras la prueba:
git checkout -- src/app/api
```

Salida en la carpeta `out/`.

---

## 3. PWA en tu dispositivo

En GitHub Pages la PWA está activa (`manifest.webmanifest` + `sw.js`). El service worker cachea la portada y el JSON de titulares para uso offline limitado.

### 3.1 Android (Chrome)

1. Abre **https://bperezglez.github.io/more-news/**
2. Menú (⋮) → **Instalar aplicación** o **Añadir a pantalla de inicio**.

### 3.2 iPhone / iPad (Safari)

1. Abre la misma URL en Safari.
2. Botón **Compartir** → **Añadir a pantalla de inicio**.

### 3.3 Requisitos

- Sitio servido por **HTTPS** (GitHub Pages lo cumple).
- Para ver cambios del service worker, a veces hace falta cerrar pestañas o esperar a un nuevo despliegue.

---

## 4. Resumen rápido

| Objetivo | Acción |
|----------|--------|
| Código en GitHub | `git remote add github …` + `git push -u github main` |
| Publicar web | Settings → Pages → **GitHub Actions** |
| Actualizar titulares en la web | Push a `main` o esperar al cron horario |
| App en el móvil | Instalar desde la URL de Pages |
| Lectura completa del artículo | `npm run dev` local o despliegue con servidor (Vercel) |

---

## 5. Solución de problemas

| Síntoma | Qué revisar |
|---------|-------------|
| `403` en feeds en CI | Normal en algunos medios; el workflow sigue con el resto de fuentes. |
| Pages en blanco | Que `NEXT_PUBLIC_BASE_PATH` coincida con `/nombre-del-repo`. |
| Workflow no corre | Permisos **Actions** activados en el repo; rama `main`. |
| PWA no ofrece instalar | Usar Chrome/Safari; abrir la URL de Pages, no solo localhost. |

Si quieres dominio propio (`noticias.tudominio.com`), en **Settings → Pages** puedes configurar un **custom domain** y actualizar DNS según la documentación de GitHub.

---

## 6. MCP de GitHub (Cloud Agent / Cursor)

Si pides al agente que suba código con el MCP y ves **`403 Resource not accessible by personal access token`**:

1. **Reconectar en este chat de Cloud Agent** (no basta solo con Cursor Desktop): cuando el agente invoque autenticación MCP, completa el flujo en el navegador.
2. En GitHub, si usas **fine-grained token**, edita el token y asegúrate de:
   - **Repository access**: incluir **`more-news`** (si el repo se creó después del token, hay que añadirlo).
   - **Repository permissions → Contents**: **Read and write**.
   - **Metadata**: al menos Read.
3. Vuelve a pedir al agente que haga el push por MCP.

Mientras el 403 persista, usa **SSH** desde tu máquina:

```bash
git remote set-url github git@github.com:bperezglez/more-news.git
git push -u github main
```
