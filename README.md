# Delf-IA — Tutor de Matemáticas Socrático

Aplicación web que enseña matemáticas con el método socrático: en lugar de resolver los problemas, guía al estudiante con preguntas y pistas. Incluye XP, niveles, rachas y tabla de clasificación por grupo.

**Stack:** Next.js (App Router) · Supabase (PostgreSQL + Auth) · Google Gen AI SDK (`@google/genai`) · Vercel.

## Cómo funciona

- El navegador inicia sesión con Supabase y lee el perfil, la tabla de líderes y el historial.
- Para chatear, envía el mensaje a `/api/chat` con su token de sesión. Esa ruta (en el servidor) verifica el token, llama a Gemini, guarda la conversación y suma el XP.
- La `GEMINI_API_KEY` solo existe en el servidor: nunca llega al navegador.

## Desplegar en Vercel

1. **Supabase:** en *SQL Editor* ejecuta [`supabase-rls.sql`](./supabase-rls.sql). Es obligatorio: la anon key es pública y estas políticas son lo que protege los datos de cada alumno.
2. **Supabase → Authentication → URL Configuration:** pon tu dominio de Vercel como *Site URL* (y en *Redirect URLs*), para que funcionen los correos de confirmación.
3. **GitHub:** sube este proyecto a un repositorio.
4. **Vercel:** *Add New → Project*, importa el repositorio (Next.js se detecta solo) y define estas variables de entorno:

   | Variable | Descripción |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon key` de Supabase |
   | `GEMINI_API_KEY` | API key de Google AI Studio (sin prefijo `NEXT_PUBLIC_`) |
   | `GEMINI_MODELS` | (opcional) modelos a intentar, separados por comas |

5. **Deploy.** Si cambias variables después, haz un *Redeploy* para que apliquen.

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # y edita tus claves
npm run dev                   # http://localhost:3000
```

Requiere Node.js 18.18 o superior.

## Tablas de Supabase

- `profiles`: `id`, `first_name`, `last_name`, `group_name`, `xp`, `level`, `streak`, `minutes_today`
- `chat_history`: `user_id`, `role`, `content`, `created_at`

El perfil se crea automáticamente la primera vez que el alumno inicia sesión, con los datos que dio al registrarse.

## Resiliencia ante fallos de la API

- Errores transitorios (429, 500, 502, 503, 504): reintentos con retardo exponencial.
- Errores permanentes (404, 400...): se pasa al siguiente modelo de `GEMINI_MODELS`.
- Respuestas vacías o bloqueadas: se detectan y se reintentan.
- La ruta tiene un límite de 60 s (`maxDuration`); si los reintentos lo agotan, el alumno recibe un aviso para reenviar el mensaje.

## Pendiente / siguientes pasos

- Impedir que un alumno edite su propio XP desde el navegador (mover el XP a una función RPC o a una tabla que solo escriba el servidor).
- Reiniciar `minutes_today` cada día y calcular la `streak` (requiere una columna de última actividad).
- Límite de mensajes por usuario y por día para controlar costos de Gemini.
