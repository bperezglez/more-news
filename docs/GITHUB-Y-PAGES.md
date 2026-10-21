# GitHub y PWA

> **GitHub Pages desactivado:** el despliegue en `github.io` ya no forma parte del flujo. Usa **Vercel** (rama `main`) para producción. Si el sitio antiguo sigue visible, en el repo: **Settings → Pages → Build and deployment → Source: None**.

Guía para tener el código en [github.com/bperezglez/more-news](https://github.com/bperezglez/more-news) e instalarlo como **PWA** en el móvil (desde Vercel o en local).

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

Cada push a `main` actualiza el despliegue en **Vercel** (si el proyecto está conectado al repo).

---

## 2. Quitar GitHub Pages por completo

Si antes publicabas en **https://bperezglez.github.io/more-news/**:

1. **Settings → Pages → Source: None** (deja de servir el sitio estático).
2. El workflow `.github/workflows/deploy-github-pages.yml` ya no está en el repo; no deberían ejecutarse nuevos despliegues.
3. Opcional: en **Actions**, cancela o ignora ejecuciones antiguas del workflow *Desplegar en GitHub Pages*.

La app completa (login, APIs, lectura integrada) solo tiene sentido en **Vercel** o en local (`npm run dev`).

> El script `npm run build:pages` y `scripts/build-pages.sh` siguen en el repo por si quieres probar un export estático en local; no forman parte del despliegue automático.

---

## 3. PWA en tu dispositivo

En producción la PWA está activa (`manifest.webmanifest` + service worker). Instálala desde la **URL de Vercel** del proyecto (HTTPS).

### 3.1 Android (Chrome)

1. Abre la URL de producción en Chrome.
2. Menú (⋮) → **Instalar aplicación** o **Añadir a pantalla de inicio** (o el botón **Instalar app** en la cabecera).

### 3.2 iPhone / iPad (Safari)

1. Abre la misma URL en Safari.
2. Botón **Compartir** → **Añadir a pantalla de inicio**.

### 3.3 Requisitos

- Sitio servido por **HTTPS**.
- Para ver cambios del service worker, a veces hace falta cerrar pestañas o esperar a un nuevo despliegue.

---

## 4. Resumen rápido

| Objetivo | Acción |
|----------|--------|
| Código en GitHub | `git remote add github …` + `git push -u github main` |
| Publicar web | Vercel conectado al repo (`main`) |
| Actualizar titulares en la web | Nuevo deploy en Vercel (push a `main`) |
| App en el móvil | Instalar desde la URL de Vercel |
| Lectura completa del artículo | `npm run dev` local o Vercel |

---

## 5. Solución de problemas

| Síntoma | Qué revisar |
|---------|-------------|
| Sigue viéndose `github.io` | **Settings → Pages → Source: None** |
| PWA no ofrece instalar | Usar Chrome/Safari; abrir la URL de producción, no solo localhost |
| Vercel no redeploya | Proyecto enlazado al repo y rama `main` |

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
