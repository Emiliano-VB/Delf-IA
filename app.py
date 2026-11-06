import streamlit as st
import streamlit.components.v1 as components
from google import genai
from google.genai import types
import re
from supabase import create_client, Client

# 1. Configuración de la página
st.set_page_config(page_title="Delf-IA - Tutor Socrático", page_icon="🐬", layout="wide")

# --- ESTILOS CSS PERSONALIZADOS (CELESTE OSCURO / AZUL AGUA PROFUNDO) ---
st.markdown("""
    <style>
    /* Fondo principal celeste oscuro profundo */
    html, body, [data-testid="stAppViewContainer"], .stApp {
        background-color: #0F2A38 !important;
        color: #E0F7FA !important;
    }
    
    /* Fondo de la barra lateral */
    [data-testid="stSidebar"] {
        background-color: #16384C !important;
    }
    
    /* Textos principales en blanco y celeste claro */
    .stApp p, .stApp label, .stApp span, h1, h2, h3, h4, h5, h6 {
        color: #E0F7FA !important;
    }
    
    /* Input de chat y cajas de texto */
    .stTextInput input, [data-testid="stChatInput"] textarea {
        background-color: #1A435A !important;
        color: #FFFFFF !important;
        border: 2px solid #00ACC1 !important;
        border-radius: 8px !important;
    }
    
    /* Tarjetas de mensajes en el chat */
    .stChatMessage {
        background-color: #163B4E !important;
        border-radius: 12px !important;
        padding: 14px !important;
        margin-bottom: 12px !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
        border: 1px solid #00ACC1 !important;
    }
    
    /* Botones principales */
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
    </style>
""", unsafe_allow_html=True)

# SVG del Delfín Pixelado adaptado para fondo oscuro
DOLPHIN_HEADER_HTML = """
<div style="display: flex; align-items: center; gap: 15px; font-family: sans-serif;">
    <svg width="60" height="60" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated;">
      <path d="M7 2H10V3H11V4H12V5H13V6H14V8H13V9H12V10H9V11H7V10H5V9H3V8H2V7H1V6H3V5H5V4H7V2Z" fill="#00E5FF"/>
      <path d="M5 8H9V9H11V10H7V10H5V9H3V8H5Z" fill="#E0F7FA"/>
      <rect x="10" y="4" width="1" height="1" fill="#FFFFFF"/>
      <rect x="10" y="4" width="0.5" height="0.5" fill="#000000"/>
      <rect x="6" y="1" width="2" height="1" fill="#00E5FF"/>
      <path d="M1 5H2V4H1V3H0V6H1V5Z" fill="#00E5FF"/>
      <path d="M1 8H2V9H1V10H0V7H1V8Z" fill="#00E5FF"/>
      <rect x="8" y="3" width="1" height="1" fill="#80DEEA"/>
    </svg>
    <div>
        <h1 style="margin: 0; color: #00E5FF; font-size: 2rem;">Delf-IA</h1>
        <p style="margin: 0; color: #80DEEA; font-size: 1rem;">Tutor de Matemáticas Socrático</p>
    </div>
</div>
"""

sys_instruct = """
Eres Delf-IA, un tutor socrático y empático de matemáticas para estudiantes.

REGLAS OBLIGATORIAS:
1. NUNCA des la respuesta directa ni resuelvas el problema por el alumno.
2. Guíalo paso a paso haciéndole preguntas sencillas y breves.
3. Responde de inmediato de forma motivadora y cercana.
4. NUNCA generes bloques de código, listas de verificación ("No direct answer?", "No metadata?", etc.) ni notas de análisis interno.
"""

# 2. Inicialización de Clientes
try:
    ai_client = genai.Client(api_key=st.secrets["GEMINI_API_KEY"])
    supabase: Client = create_client(st.secrets["SUPABASE_URL"], st.secrets["SUPABASE_KEY"])
except Exception as e:
    st.error(f"Error al inicializar credenciales o servicios: {e}")
    st.stop()

# 3. Estado de la sesión
if "user" not in st.session_state:
    st.session_state.user = None
if "messages" not in st.session_state:
    st.session_state.messages = []

# --- MÓDULO DE AUTENTICACIÓN ---
if st.session_state.user is None:
    components.html(DOLPHIN_HEADER_HTML, height=80)
    
    st.subheader("¡Bienvenido!")
    st.write("Tu tutor personal de matemáticas socrático paso a paso.")
    
    tab_login, tab_register = st.tabs(["Iniciar Sesión", "Registrarse"])
    
    with tab_login:
        email = st.text_input("Correo electrónico", key="login_email")
        password = st.text_input("Contraseña", type="password", key="login_pass")
        if st.button("Entrar", type="primary"):
            try:
                res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                st.session_state.user = res.user
                st.success("¡Inicio de sesión exitoso!")
                st.rerun()
            except Exception as e:
                st.error(f"Error al iniciar sesión: {e}")

    with tab_register:
        reg_email = st.text_input("Correo electrónico", key="reg_email")
        reg_pass = st.text_input("Contraseña", type="password", key="reg_pass")
        first_name = st.text_input("Nombre", key="reg_name")
        last_name = st.text_input("Apellido", key="reg_lastname")
        group_name = st.selectbox("Grupo", ["112", "Grupo A", "Grupo B", "Grupo C"], key="reg_group")
        
        if st.button("Crear Cuenta"):
            try:
                res = supabase.auth.sign_up({"email": reg_email, "password": reg_pass})
                user_id = res.user.id
                
                supabase.table("profiles").insert({
                    "id": user_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "group_name": group_name,
                    "xp": 0,
                    "level": 1,
                    "streak": 1,
                    "minutes_today": 0
                }).execute()
                
                st.success("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.")
            except Exception as e:
                st.error(f"Error en el registro: {e}")

# --- INTERFAZ PRINCIPAL ---
else:
    user_id = st.session_state.user.id
    
    try:
        profile_res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        profile = profile_res.data
    except Exception:
        profile = {"first_name": "Estudiante", "xp": 0, "level": 1, "streak": 1, "minutes_today": 0, "group_name": "112"}

    # BARRA LATERAL
    with st.sidebar:
        st.header(f"👤 {profile.get('first_name', 'Estudiante')}")
        if st.button("Cerrar Sesión"):
            supabase.auth.sign_out()
            st.session_state.user = None
            st.session_state.messages = []
            st.rerun()
            
        st.divider()
        st.subheader("🏆 Tus Logros")
        col1, col2 = st.columns(2)
        col1.metric("Nivel", profile.get("level", 1))
        col2.metric("XP Total", profile.get("xp", 0))
        
        st.metric("🔥 Racha de Días", f"{profile.get('streak', 1)} días")
        
        mins = profile.get("minutes_today", 0)
        st.write(f"⏱️ **Meta Diaria:** {mins}/20 min")
        st.progress(min(mins / 20.0, 1.0))
        
        st.divider()
        st.subheader(f"📊 Tabla de Clasificación ({profile.get('group_name', '112')})")
        try:
            leaderboard = supabase.table("profiles")\
                .select("first_name, xp")\
                .eq("group_name", profile.get("group_name"))\
                .order("xp", desc=True)\
                .limit(5)\
                .execute()
            for idx, member in enumerate(leaderboard.data, start=1):
                st.write(f"**{idx}.** {member['first_name']} — `{member['xp']} XP`")
        except Exception:
            st.caption("No se pudo cargar la tabla de líderes.")

    # ENCABEZADO
    components.html(DOLPHIN_HEADER_HTML, height=80)
    st.caption("¡Aprende paso a paso! Te guiaré para encontrar la respuesta por ti mismo.")
    st.divider()

    if not st.session_state.messages:
        try:
            history_res = supabase.table("chat_history")\
                .select("role, content")\
                .eq("user_id", user_id)\
                .order("created_at", desc=False)\
                .execute()
            st.session_state.messages = history_res.data
        except Exception:
            st.session_state.messages = []

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("Escribe tu duda o problema matemático aquí..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
            
        try:
            supabase.table("chat_history").insert({"user_id": user_id, "role": "user", "content": prompt}).execute()
        except Exception:
            pass

        with st.chat_message("assistant"):
            try:
                formatted_contents = []
                for msg in st.session_state.messages:
                    role = "user" if msg["role"] == "user" else "model"
                    formatted_contents.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=msg["content"])]
                        )
                    )

                response = ai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=formatted_contents,
                    config=types.GenerateContentConfig(
                        system_instruction=sys_instruct
                    )
                )
                
                raw_text = response.text.strip() if response.text else ""
                
                # --- LIMPIEZA AUTOMÁTICA DEL CUADRO NEGRO ---
                clean_text = re.sub(r'```[\s\S]*?```', '', raw_text).strip()
                
                if "¡Hola!" in clean_text:
                    parts = clean_text.split("¡Hola!")
                    clean_text = "¡Hola!" + parts[-1]

                response_text = clean_text.strip()

                st.markdown(response_text)
                st.session_state.messages.append({"role": "assistant", "content": response_text})
                
                try:
                    supabase.table("chat_history").insert({"user_id": user_id, "role": "assistant", "content": response_text}).execute()
                    new_xp = profile.get("xp", 0) + 15
                    new_level = (new_xp // 100) + 1
                    new_mins = profile.get("minutes_today", 0) + 2
                    
                    supabase.table("profiles").update({
                        "xp": new_xp,
                        "level": new_level,
                        "minutes_today": new_mins
                    }).eq("id", user_id).execute()
                except Exception:
                    pass

            except Exception as e:
                st.error(f"Error de conexión: {e}")
