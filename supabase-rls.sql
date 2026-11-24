-- Políticas de seguridad (Row Level Security) para Delf-IA.
-- Ejecútalo en Supabase: SQL Editor -> New query -> pega esto -> Run.
--
-- IMPORTANTE: en la versión de Vercel la anon key viaja en el navegador, así que
-- sin RLS cualquiera con esa clave podría leer o modificar los datos de todos.

alter table public.profiles enable row level security;
alter table public.chat_history enable row level security;

-- ---------- profiles ----------
-- Cualquier alumno con sesión puede leer perfiles (necesario para la tabla de clasificación).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

-- Cada alumno solo crea y edita su propio perfil.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- chat_history ----------
-- Cada alumno solo lee y escribe su propio historial.
drop policy if exists "chat_select_own" on public.chat_history;
create policy "chat_select_own"
  on public.chat_history for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_insert_own" on public.chat_history;
create policy "chat_insert_own"
  on public.chat_history for insert to authenticated
  with check (auth.uid() = user_id);

-- Limitación conocida: la política de update deja a un alumno editar su propia fila,
-- incluido `xp`. Para impedir trampas habría que mover el XP a una función RPC
-- (security definer) o a una tabla aparte que solo escriba el servidor.

-- ---------- achievements (vitrina de logros) ----------
-- Ya aplicado en el proyecto. Cada alumno solo ve y crea sus propios logros.
create table if not exists public.achievements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  level smallint not null check (level between 1 and 5),
  name text not null,
  topic text,
  created_at timestamptz not null default now()
);
create index if not exists achievements_user_idx on public.achievements (user_id, created_at desc);
alter table public.achievements enable row level security;
drop policy if exists "achievements_select_own" on public.achievements;
create policy "achievements_select_own" on public.achievements for select to authenticated using (auth.uid() = user_id);
drop policy if exists "achievements_insert_own" on public.achievements;
create policy "achievements_insert_own" on public.achievements for insert to authenticated with check (auth.uid() = user_id);
