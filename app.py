
import streamlit as st
import streamlit.components.v1 as components
from google import genai
from google.genai import types
from supabase import create_client, Client
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import re
import time

# ============================================================
# 1. CONFIGURACIÓN GENERAL
# ============================================================

st.set_page_config(
    page_title="Delf-IA - Tutor Socrático",
    page_icon="🐬",
    layout="wide"
)

TIMEZONE = ZoneInfo("America/Monterrey")
TODAY = datetime.now(TIMEZONE).date()

DAILY_GOAL_SECONDS = 20 * 60
XP_PER_ANSWER = 15
MAX_HISTORY_MESSAGES = 20
MAX_SECONDS_PER_INTERACTION = 120

# ============================================================
# 2. DISEÑO VISUAL
# ============================================================

st.markdown("""
<style>
html, body, [data-testid="stAppViewContainer"], .stApp {
    background-color: #0F2A38 !important;
    color: #E0F7FA !important;
}

[data-testid="stSidebar"] {
    background-color: #16384C !important;
}

.stApp p, .stApp label, .stApp span,
h1, h2, h3, h4, h5, h6 {
    color: #E0F7FA !important;
}

.stTextInput input,
[data-testid="stChatInput"] textarea {
    background-color: #1A435A !important;
    color: #FFFFFF !important;
    border: 2px solid #00ACC1 !important;
    border-radius: 8px !important;
}

.stChatMessage {
    background-color: #163B4E !important;
    border-radius: 12px !important;
    padding: 14px !important;
    margin-bottom: 12px !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
    border: 1px solid #00ACC1 !important;
}

.stButton button {
    background-color: #00ACC1 !important;
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: bold !important;
}

.stButton button:hover {
    background-color: #00838F !important;
}

[data-testid="stMetricValue"] {
    color: #00E5FF !important;
}

</style>
""", unsafe_allow_html=True)

# ============================================================
# 3. ENCABEZADO DEL DELFÍN
# ============================================================

DOLPHIN_HEADER_HTML = """
<div style="display:flex;align-items:center;gap:15px;
font-family:sans-serif;">
    <svg width="60" height="60" viewBox="0 0 16 16"
    fill="none" xmlns="http://www.w3.org/2000/svg"
    style="image-rendering:pixelated;">
        <path d="M7 2H10V3H11V4H12V5H13V6H14V8H13V9H12V10H9V11H7V10H5V9H3V8H2V7H1V6H3V5H5V4H7V2Z"
        fill="#00E5FF"/>
        <path d="M5 8H9V9H11V10H7V10H5V9H3V8H5Z"
        fill="#E0F7FA"/>
        <rect x="10" y="4" width="1" height="1" fill="#FFFFFF"/>
        <rect x="10" y="4" width="0.5" height="0.5" fill="#000000"/>
        <rect x="6" y="1" width="2" height="1" fill="#00E5FF"/>
        <path d="M1 5H2V4H1V3H0V6H1V5Z" fill="#00E5FF"/>
        <path d="M1 8H2V9H1V10H0V7H1V8Z" fill="#00E5FF"/>
        <rect x="8" y="3" width="1" height="1" fill="#80DEEA"/>
    </svg>

    <div>
        <h1 style="margin:0;color:#00E5FF;font-size:2rem;">
            Delf-IA
        </h1>
        <p style="margin:0;color:#80DEEA;font-size:1rem;">
            Tutor de Matemáticas Socrático
        </p>
    </div>
</div>
"""

def show_header():
    components.html(DOLPHIN_HEADER_HTML, height=80)

# ============================================================
# 4. INSTRUCCIONES DEL TUTOR
# ============================================================

SYS_INSTRUCT = """
Eres Delf-IA, un tutor socrático, paciente y empático de
matemáticas para estudiantes de bachillerato técnico.

Tu objetivo es que el estudiante comprenda y resuelva
los problemas por sí mismo.

REGLAS OBLIGATORIAS:

1. Nunca entregues directamente la respuesta final.
2. Nunca resuelvas todo el ejercicio por el estudiante.
3. Guía al estudiante mediante preguntas cortas y sencillas.
4. Explica los conceptos utilizando ejemplos cotidianos.
5. Si el estudiante se equivoca, corrígelo con amabilidad.
6. Divide los problemas difíciles en pequeños pasos.
7. Adapta las explicaciones al nivel del estudiante.
8. Reconoce sus avances y motívalo.
9. No repitas preguntas innecesariamente.
10. No generes bloques de código ni explicaciones internas.
11. Si el estudiante saluda, responde naturalmente.
12. Si pregunta algo que no es matemáticas, explícale
    amablemente que tu especialidad es ayudarle con matemáticas.

ESTILO:
- Español claro.
- Explicaciones breves.
- Lenguaje cercano.
- Una pregunta principal por respuesta.
- No seas demasiado formal.

RECUERDA:
Tu trabajo es enseñar a pensar, no hacer la tarea.
"""

# ============================================================
# 5. CONEXIÓN CON SERVICIOS
# ============================================================

try:
    ai_client = genai.Client(
        api_key=st.secrets["GEMINI_API_KEY"]
    )

    supabase: Client = create_client(
        st.secrets["SUPABASE_URL"],
        st.secrets["SUPABASE_KEY"]
    )

except Exception:
    st.error(
        "No se pudieron inicializar los servicios. "
        "Revisa las credenciales de Streamlit Secrets."
    )
    st.stop()

# ============================================================
# 6. CONFIGURACIÓN DE MODELOS GEMINI
# ============================================================

# Puedes modificar esta lista desde Streamlit Secrets
# utilizando GEMINI_MODELS = "modelo1,modelo2,modelo3"

DEFAULT_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash"
]

configured_models = st.secrets.get("GEMINI_MODELS", "")

if configured_models:
    GEMINI_MODELS = [
        model.strip()
        for model in configured_models.split(",")
        if model.strip()
    ]
else:
    GEMINI_MODELS = DEFAULT_MODELS


def is_retryable_error(error):
    """Determina si vale la pena probar otro modelo."""

    error_text = str(error).upper()

    retry_keywords = [
        "429",
        "RESOURCE_EXHAUSTED",
        "QUOTA",
        "RATE LIMIT",
        "503",
        "UNAVAILABLE",
        "404",
        "NOT_FOUND",
        "MODEL NOT FOUND",
        "NOT SUPPORTED"
    ]

    return any(word in error_text for word in retry_keywords)


def generate_tutor_response(messages):
    """Genera una respuesta probando modelos alternativos."""

    formatted_contents = []

    for msg in messages[-MAX_HISTORY_MESSAGES:]:
        role = "user" if msg["role"] == "user" else "model"

        formatted_contents.append(
            types.Content(
                role=role,
                parts=[
                    types.Part.from_text(text=msg["content"])
                ]
            )
        )

    errors = []

    for model_name in GEMINI_MODELS:

        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=formatted_contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYS_INSTRUCT,
                    temperature=0.5,
                    max_output_tokens=500
                )
            )

            if not response.text:
                raise ValueError("Gemini devolvió una respuesta vacía.")

            return response.text.strip(), model_name

        except Exception as error:

            errors.append(f"{model_name}: {str(error)}")

            # No intentar otros modelos si el problema
            # corresponde a credenciales o permisos.
            if not is_retryable_error(error):
                raise error

    raise RuntimeError(
        "Ningún modelo Gemini pudo responder. "
        + " | ".join(errors)
    )

# ============================================================
# 7. ESTADO DE SESIÓN
# ============================================================

if "user" not in st.session_state:
    st.session_state.user = None

if "messages" not in st.session_state:
    st.session_state.messages = []

if "history_loaded" not in st.session_state:
    st.session_state.history_loaded = False

if "last_activity" not in st.session_state:
    st.session_state.last_activity = time.time()

if "pending_study_seconds" not in st.session_state:
    st.session_state.pending_study_seconds = 0

# ============================================================
# 8. FUNCIONES DE GAMIFICACIÓN
# ============================================================

def get_level(xp):
    return (xp // 100) + 1


def get_streak(previous_streak, last_study_date):

    if not last_study_date:
        return 1

    if isinstance(last_study_date, str):
        last_study_date = datetime.fromisoformat(
            last_study_date
        ).date()

    elif isinstance(last_study_date, datetime):
        last_study_date = last_study_date.date()

    if last_study_date == TODAY:
        return previous_streak

    if last_study_date == TODAY - timedelta(days=1):
        return previous_streak + 1

    return 1


def update_student_progress(profile, user_id):

    previous_date = profile.get("last_study_date")

    if previous_date:
        if isinstance(previous_date, str):
            previous_date = datetime.fromisoformat(
                previous_date
            ).date()

        elif isinstance(previous_date, datetime):
            previous_date = previous_date.date()

    old_streak = profile.get("streak", 0) or 0

    new_streak = get_streak(
        old_streak,
        previous_date
    )

    old_xp = profile.get("xp", 0) or 0

    new_xp = old_xp + XP_PER_ANSWER

    # Tiempo estimado de actividad desde la interacción anterior.
    new_seconds = (
        profile.get("study_seconds_today", 0) or 0
    ) + st.session_state.pending_study_seconds

    new_minutes = new_seconds // 60

    updated_profile = {
        "xp": new_xp,
        "level": get_level(new_xp),
        "streak": new_streak,
        "minutes_today": new_minutes,
        "study_seconds_today": new_seconds,
        "last_study_date": TODAY.isoformat()
    }

    supabase.table("profiles").update(
        updated_profile
    ).eq("id", user_id).execute()

    st.session_state.pending_study_seconds = 0

    return updated_profile


def reset_daily_progress_if_needed(profile, user_id):

    seconds = profile.get("study_seconds_today", 0) or 0

    last_date = profile.get("last_study_date")

    if isinstance(last_date, str):
        try:
            last_date = datetime.fromisoformat(last_date).date()
        except ValueError:
            last_date = None

    elif isinstance(last_date, datetime):
        last_date = last_date.date()

    if last_date != TODAY:

        supabase.table("profiles").update({
            "minutes_today": 0,
            "study_seconds_today": 0
        }).eq("id", user_id).execute()

        profile["minutes_today"] = 0
        profile["study_seconds_today"] = 0

    return profile

# ============================================================
# 9. LIMPIEZA DE RESPUESTAS
# ============================================================

def clean_response(raw_text):

    clean_text = re.sub(
        r"```[\s\S]*?```",
        "",
        raw_text
    ).strip()

    clean_text = re.sub(
        r"<think>[\s\S]*?</think>",
        "",
        clean_text,
        flags=re.IGNORECASE
    ).strip()

    return clean_text

# ============================================================
# 10. AUTENTICACIÓN
# ============================================================

if st.session_state.user is None:

    show_header()

    st.subheader("¡Bienvenido!")
    st.write(
        "Tu tutor personal de matemáticas socrático paso a paso."
    )

    tab_login, tab_register = st.tabs([
        "Iniciar Sesión",
        "Registrarse"
    ])

    # ---------------- INICIAR SESIÓN ----------------

    with tab_login:

        email = st.text_input(
            "Correo electrónico",
            key="login_email"
        )

        password = st.text_input(
            "Contraseña",
            type="password",
            key="login_pass"
        )

        if st.button("Entrar", type="primary"):

            if not email or not password:
                st.warning("Completa tu correo y contraseña.")

            else:
                try:
                    res = supabase.auth.sign_in_with_password({
                        "email": email,
                        "password": password
                    })

                    st.session_state.user = res.user
                    st.session_state.messages = []
                    st.session_state.history_loaded = False

                    st.success("¡Inicio de sesión exitoso!")
                    st.rerun()

                except Exception:
                    st.error(
                        "No se pudo iniciar sesión. "
                        "Verifica tus datos e inténtalo nuevamente."
                    )

    # ---------------- REGISTRO ----------------

    with tab_register:

        reg_email = st.text_input(
            "Correo electrónico",
            key="reg_email"
        )

        reg_pass = st.text_input(
            "Contraseña",
            type="password",
            key="reg_pass"
        )

        first_name = st.text_input(
            "Nombre",
            key="reg_name"
        )

        last_name = st.text_input(
            "Apellido",
            key="reg_lastname"
        )

        group_name = st.selectbox(
            "Grupo",
            ["112", "Grupo A", "Grupo B", "Grupo C"],
            key="reg_group"
        )

        if st.button("Crear Cuenta"):

            if not all([
                reg_email,
                reg_pass,
                first_name,
                last_name
            ]):

                st.warning("Completa todos los campos.")

            elif len(reg_pass) < 6:

                st.warning(
                    "La contraseña debe tener al menos "
                    "6 caracteres."
                )

            else:

                try:
                    res = supabase.auth.sign_up({
                        "email": reg_email,
                        "password": reg_pass
                    })

                    if not res.user:
                        st.error(
                            "No se pudo crear el usuario."
                        )

                    else:

                        supabase.table("profiles").insert({
                            "id": res.user.id,
                            "first_name": first_name,
                            "last_name": last_name,
                            "group_name": group_name,
                            "xp": 0,
                            "level": 1,
                            "streak": 0,
                            "minutes_today": 0,
                            "study_seconds_today": 0,
                            "last_study_date": None
                        }).execute()

                        st.success(
                            "¡Cuenta creada! "
                            "Ya puedes iniciar sesión."
                        )

                        st.info(
                            "Si tienes activada la confirmación "
                            "por correo, confirma tu dirección "
                            "antes de entrar."
                        )

                except Exception as e:
                    st.error(
                        f"No se pudo completar el registro: {e}"
                    )

# ============================================================
# 11. INTERFAZ PRINCIPAL
# ============================================================

else:

    user_id = st.session_state.user.id

    # ---------------- CARGAR PERFIL ----------------

    try:

        profile_res = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )

        profile = profile_res.data

        profile = reset_daily_progress_if_needed(
            profile,
            user_id
        )

    except Exception:

        st.error(
            "No se pudo cargar tu perfil. "
            "Revisa la conexión con Supabase y "
            "que exista tu registro en profiles."
        )

        st.stop()

    # ========================================================
    # 12. BARRA LATERAL
    # ========================================================

    with st.sidebar:

        st.header(
            f"👤 {profile.get('first_name', 'Estudiante')}"
        )

        st.caption(
            f"Grupo: {profile.get('group_name', 'Sin grupo')}"
        )

        if st.button("Cerrar Sesión"):

            try:
                supabase.auth.sign_out()
            except Exception:
                pass

            st.session_state.user = None
            st.session_state.messages = []
            st.session_state.history_loaded = False
            st.session_state.pending_study_seconds = 0

            st.rerun()

        st.divider()

        st.subheader("🏆 Tus Logros")

        col1, col2 = st.columns(2)

        col1.metric(
            "Nivel",
            profile.get("level", 1)
        )

        col2.metric(
            "XP Total",
            profile.get("xp", 0)
        )

        st.metric(
            "🔥 Racha de Días",
            f"{profile.get('streak', 0)} días"
        )

        # META DIARIA

        seconds = profile.get(
            "study_seconds_today", 0
        ) or 0

        minutes = seconds // 60

        st.write(
            f"⏱️ **Meta Diaria:** {minutes}/20 min"
        )

        st.progress(
            min(seconds / DAILY_GOAL_SECONDS, 1.0)
        )

        if seconds >= DAILY_GOAL_SECONDS:
            st.success("¡Meta diaria completada! 🎉")

        else:
            remaining = max(
                0,
                DAILY_GOAL_SECONDS - seconds
            )

            st.caption(
                f"Te faltan {remaining // 60} minutos "
                f"para completar tu meta."
            )

        st.divider()

        # ====================================================
        # 13. CLASIFICACIÓN POR GRUPO
        # ====================================================

        st.subheader(
            f"📊 Clasificación "
            f"({profile.get('group_name', '112')})"
        )

        try:

            leaderboard = (
                supabase.table("profiles")
                .select("first_name, xp")
                .eq(
                    "group_name",
                    profile.get("group_name")
                )
                .order("xp", desc=True)
                .limit(5)
                .execute()
            )

            if leaderboard.data:

                for idx, member in enumerate(
                    leaderboard.data,
                    start=1
                ):

                    st.write(
                        f"**{idx}.** "
                        f"{member['first_name']} — "
                        f"`{member['xp']} XP`"
                    )

            else:
                st.caption("Todavía no hay estudiantes.")

        except Exception:

            st.caption(
                "No se pudo cargar la clasificación."
            )

    # ========================================================
    # 14. ENCABEZADO PRINCIPAL
    # ========================================================

    show_header()

    st.caption(
        "¡Aprende paso a paso! "
        "Te guiaré para encontrar la respuesta por ti mismo."
    )

    st.divider()

    # ========================================================
    # 15. CARGAR HISTORIAL
    # ========================================================

    if not st.session_state.history_loaded:

        try:

            history_res = (
                supabase.table("chat_history")
                .select("role, content")
                .eq("user_id", user_id)
                .order("created_at", desc=False)
                .limit(100)
                .execute()
            )

            st.session_state.messages = [
                msg for msg in history_res.data
                if msg.get("role") in ["user", "assistant"]
            ]

        except Exception:

            st.warning(
                "No se pudo recuperar el historial anterior."
            )

            st.session_state.messages = []

        st.session_state.history_loaded = True

    # ========================================================
    # 16. MOSTRAR CONVERSACIÓN
    # ========================================================

    if not st.session_state.messages:

        st.info(
            "🐬 ¡Hola! Soy Delf-IA. "
            "¿Qué tema de matemáticas quieres aprender hoy?"
        )

    for msg in st.session_state.messages:

        with st.chat_message(msg["role"]):

            st.markdown(msg["content"])

    # ========================================================
    # 17. CHAT CON GEMINI
    # ========================================================

    if prompt := st.chat_input(
        "Escribe tu duda o problema matemático aquí..."
    ):

        # Calcular tiempo estimado de actividad.
        now = time.time()

        elapsed = max(
            0,
            min(
                int(now - st.session_state.last_activity),
                MAX_SECONDS_PER_INTERACTION
            )
        )

        st.session_state.pending_study_seconds = elapsed
        st.session_state.last_activity = now

        # Guardar mensaje del estudiante.
        user_message = {
            "role": "user",
            "content": prompt
        }

        st.session_state.messages.append(user_message)

        with st.chat_message("user"):
            st.markdown(prompt)

        try:

            supabase.table("chat_history").insert({
                "user_id": user_id,
                "role": "user",
                "content": prompt
            }).execute()

        except Exception:

            st.warning(
                "No se pudo guardar tu mensaje en el historial."
            )

        # GENERAR RESPUESTA

        with st.chat_message("assistant"):

            with st.spinner(
                "🐬 Delf-IA está pensando..."
            ):

                try:

                    raw_text, used_model = generate_tutor_response(
                        st.session_state.messages
                    )

                    response_text = clean_response(raw_text)

                    if not response_text:
                        raise ValueError(
                            "La respuesta quedó vacía después de limpiarla."
                        )

                    st.markdown(response_text)

                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": response_text
                    })

                    # Guardar respuesta.
                    supabase.table("chat_history").insert({
                        "user_id": user_id,
                        "role": "assistant",
                        "content": response_text
                    }).execute()

                    # Actualizar XP, nivel, racha y tiempo.
                    updated_profile = update_student_progress(
                        profile,
                        user_id
                    )

                    st.session_state.last_activity = time.time()

                    st.toast(
                        f"+{XP_PER_ANSWER} XP 🏆",
                        icon="🐬"
                    )

                    if used_model != GEMINI_MODELS[0]:

                        st.caption(
                            "Se utilizó un modelo alternativo "
                            "de Gemini."
                        )

                    # Actualizar la información visual.
                    st.rerun()

                except Exception as e:

                    st.error(
                        "🐬 No pude generar una respuesta "
                        "en este momento."
                    )

                    error_text = str(e).upper()

                    if (
                        "429" in error_text
                        or "RESOURCE_EXHAUSTED" in error_text
                        or "QUOTA" in error_text
                    ):

                        st.warning(
                            "Se agotó la cuota disponible "
                            "de los modelos configurados. "
                            "Inténtalo después de que se "
                            "restablezca o revisa tus cuotas "
                            "en Google AI Studio."
                        )

                    elif (
                        "API_KEY" in error_text
                        or "PERMISSION_DENIED" in error_text
                        or "401" in error_text
                        or "403" in error_text
                    ):

                        st.warning(
                            "Revisa tu GEMINI_API_KEY "
                            "y los permisos de tu proyecto."
                        )

                    else:

                        st.warning(
                            "Ocurrió un problema de conexión "
                            "o configuración. Revisa los "
                            "registros de Streamlit Cloud."
                        )

                    # El mensaje del estudiante permanece
                    # en pantalla aunque Gemini falle.
                    # No se otorgan XP por respuestas fallidas.
