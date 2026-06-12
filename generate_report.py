"""
Generador del Reporte Final de ZonaGamer App.

Crea un documento Word (.docx) con los 4 entregables del proyecto:
  1. Seguimiento en Azure Boards (tablas por sprint)
  2. Arquitectura de Backend (diagrama)
  3. Arquitectura de la APP (diagrama)
  4. Diagrama de Flujo CI/CD

Uso:
    pip install python-docx matplotlib
    python generate_report.py

Genera ReporteFinal_ZonaGamer.docx en la raiz del repositorio.
"""

import os
import tempfile

import matplotlib

matplotlib.use("Agg")
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

# --------------------------------------------------------------------------- #
# Colores por estado
# --------------------------------------------------------------------------- #
STATE_COLORS = {
    "Completado": "C6EFCE",   # verde
    "En Progreso": "FFEB9C",  # amarillo
    "Pendiente": "FCE4B8",    # naranja
}
HEADER_FILL = "1F3864"        # azul oscuro para encabezados de tabla

# --------------------------------------------------------------------------- #
# Datos del Entregable 1 (Azure Boards)
# --------------------------------------------------------------------------- #
COLUMNS = [
    "Tipo", "Título/Descripción", "Área/Módulo", "Sprint",
    "Asignado a", "Prioridad", "Estado", "Fecha Inicio Plan", "Fecha Fin Plan",
]

AREA = "Desarrollo de Aplicación Móvil"

SPRINT1_TITLES = [
    ("Validar evento", "Sprint 1", "04/02/2026", "06/02/2026"),
    ("Registrar cuenta", "Sprint 1", "06/02/2026", "10/02/2026"),
    ("Iniciar sesion", "Sprint 1", "10/02/2026", "13/02/2026"),
    ("Mostrar permisos asignados", "Sprint 1", "13/02/2026", "14/02/2026"),
    ("validar cuentas", "Sprint 1", "14/02/2026", "17/02/2026"),
    ("registrar usuario", "Angel", "17/02/2026", "19/02/2026"),
    ("registrar asociado", "Angel", "17/02/2026", "19/02/2026"),
    ("mostrar catalogo de especialidades / registrar especialidad", "Angel", "17/02/2026", "19/02/2026"),
    ("edditar especialidad", "Angel", "17/02/2026", "19/02/2026"),
    ("borrar especialidad", "Angel", "17/02/2026", "19/02/2026"),
    ("mostrar catalogo de servicios", "Angel", "17/02/2026", "19/02/2026"),
    ("registrar servicios", "Angel", "17/02/2026", "19/02/2026"),
    ("editar servicio", "Angel", "17/02/2026", "19/02/2026"),
    ("actualizar informacion", "Angel", "17/02/2026", "19/02/2026"),
    ("mostrar listado de publicaciones", "Angel", "17/02/2026", "19/02/2026"),
    ("validar publicacion", "Angel", "17/02/2026", "19/02/2026"),
    ("editar publicacion", "Angel", "17/02/2026", "19/02/2026"),
    ("borrar publicacion", "Angel", "17/02/2026", "19/02/2026"),
    ("actualizar publicacion", "Angel", "17/02/2026", "19/02/2026"),
    ("habilitar/deshabilitar publicacion", "Angel", "17/02/2026", "19/02/2026"),
    ("mostrar listado de eventos", "Angel", "17/02/2026", "19/02/2026"),
    ("registrar evento", "Angel", "17/02/2026", "19/02/2026"),
    ("actializar informacion de evento", "Angel", "17/02/2026", "19/02/2026"),
    ("habilitar/deshabilitar evento", "Angel", "17/02/2026", "19/02/2026"),
    ("mostrar recursos multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("validar recursos multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("registrar recurso multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("editar recurso multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("borrar recurso multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("habilitar/deshabilitar recurso multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("actualizar recurso multimedia", "Angel", "17/02/2026", "19/02/2026"),
    ("reemplazar archivo multimedia", "Angel", "17/02/2026", "19/02/2026"),
]
# Sprint 1: todas Historia, prioridad baja, estado Completado
SPRINT1 = [
    ["Historia", title, AREA, "Sprint 1", assignee, "baja", "Completado", inicio, fin]
    for (title, assignee, inicio, fin) in SPRINT1_TITLES
]

# Sprint 2: (tipo, titulo, estado)
SPRINT2_ROWS = [
    ("Task", "Guard por el rol", "En Progreso"),
    ("Task", "ocultar opciones según rol", "En Progreso"),
    ("Task", "bloquear navegacion", "Completado"),
    ("Task", "pruebas con 3 usuarios demos", "Completado"),
    ("Historia", "Recuperar contraseña", "Pendiente"),
    ("Historia", "confirmar asistencia evento", "Completado"),
    ("Task", "modelo / tabla de asistentes", "Completado"),
    ("Task", "toogle asistir / cancelar", "Completado"),
    ("Task", "ui estados + contador", "Completado"),
    ("Task", "pruebas: pdoble click / cancelar", "Completado"),
    ("Historia", "moderar publicacion", "Completado"),
    ("Task", "accion bloquear/ desbloquear", "Completado"),
    ("Task", "campo estatus", "Completado"),
    ("Task", "filtrar en listados", "Completado"),
    ("Task", "pruebas de visibilidad por rol", "Completado"),
    ("Historia", "borrar servicio", "Completado"),
    ("Task", "ui boton + eliminar modal confirmacion", "Completado"),
    ("Task", "Logica de borrado", "Completado"),
    ("Task", "actualizar listado y manejar errores", "Completado"),
    ("Task", "prueba: borrar, cancelar, borrar en uso", "Completado"),
    ("Task", "borrar usuario", "Pendiente"),
]
SPRINT2 = [
    [tipo, titulo, AREA, "Sprint 2", "Angel", "alta", estado, "25/02/2026", "27/03/2026"]
    for (tipo, titulo, estado) in SPRINT2_ROWS
]

# Sprint 3: (tipo, titulo) -- todos Completado, prioridad alta
SPRINT3_ROWS = [
    ("Épica", "Sincronización"),
    ("Feature", "Descarga inicial"),
    ("Historia", "Descargar datos al iniciar sesión"),
    ("Task", "Implementar pullUserData(userid) en syncEngine.ts"),
    ("Task", "Descargar desde Firebase: Publicaciones y Eventos"),
    ("Task", "Upsert en SQLite (insert/update sin duplicar)"),
    ("Task", "Refrescar UI leyendo SQLite (re-fetch local)"),
]
SPRINT3 = [
    [tipo, titulo, AREA, "Sprint 3", "Angel", "alta", "Completado", "15/04/2026", "30/04/2026"]
    for (tipo, titulo) in SPRINT3_ROWS
]

# Sprint 4: (tipo, titulo) -- todos Completado, prioridad alta
SPRINT4_ROWS = [
    ("Épica", "Contenedores y Despliegue"),
    ("Feature", "Contenedor (Docker) del servicio a desplegar"),
    ("Historia", "Dockerizar un servicio mínimo"),
    ("Task", "Crear mini API GET /health y GET /version (Node/Express o FastAPI)"),
    ("Task", "Crear Dockerfile del servicio"),
    ("Task", "Probar local"),
    ("Task", "Evidencia: captura"),
]
SPRINT4 = [
    [tipo, titulo, AREA, "Sprint 4", "Angel", "alta", "Completado", "06/05/2026", "22/05/2026"]
    for (tipo, titulo) in SPRINT4_ROWS
]


# --------------------------------------------------------------------------- #
# Utilidades de tabla
# --------------------------------------------------------------------------- #
def _shade_cell(cell, hex_color):
    """Aplica color de fondo a una celda."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = tc_pr.makeelement(qn("w:shd"), {})
        tc_pr.append(shd)
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)


def _set_cell_text(cell, text, bold=False, color=None, size=8):
    """Escribe texto en una celda controlando estilo de fuente."""
    cell.text = ""
    para = cell.paragraphs[0]
    run = para.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    if color is not None:
        run.font.color.rgb = color


def add_sprint_table(document, rows):
    """Agrega una tabla 'Table Grid' con encabezado en negrita y color por estado."""
    table = document.add_table(rows=1, cols=len(COLUMNS))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Encabezado
    header_cells = table.rows[0].cells
    for idx, name in enumerate(COLUMNS):
        _set_cell_text(header_cells[idx], name, bold=True,
                       color=RGBColor(0xFF, 0xFF, 0xFF), size=8)
        _shade_cell(header_cells[idx], HEADER_FILL)

    # Filas de datos
    estado_idx = COLUMNS.index("Estado")
    for row in rows:
        cells = table.add_row().cells
        fill = STATE_COLORS.get(row[estado_idx])
        for idx, value in enumerate(row):
            _set_cell_text(cells[idx], str(value), bold=False, size=8)
            if fill:
                _shade_cell(cells[idx], fill)
    return table


def add_legend(document):
    """Agrega una leyenda de colores por estado."""
    p = document.add_paragraph()
    p.add_run("Leyenda de estados: ").bold = True
    table = document.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    labels = ["Completado", "En Progreso", "Pendiente"]
    for idx, label in enumerate(labels):
        cell = table.rows[0].cells[idx]
        _set_cell_text(cell, label, bold=True, size=9)
        _shade_cell(cell, STATE_COLORS[label])


# --------------------------------------------------------------------------- #
# Diagramas con matplotlib
# --------------------------------------------------------------------------- #
def _box(ax, x, y, w, h, text, facecolor, fontsize=10, textcolor="black"):
    rect = mpatches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.5, edgecolor="#333333", facecolor=facecolor,
    )
    ax.add_patch(rect)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fontsize, color=textcolor, wrap=True)


def _arrow(ax, x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color="#444444", lw=2))


def generate_backend_diagram(path):
    fig, ax = plt.subplots(figsize=(9, 9))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis("off")
    ax.set_title("Entregable 2 — Arquitectura de Backend (FastAPI / Render)",
                 fontsize=13, fontweight="bold")

    # Contenedor Docker / Render
    container = mpatches.FancyBboxPatch(
        (0.5, 0.6), 9, 9.4, boxstyle="round,pad=0.02,rounding_size=0.1",
        linewidth=2, edgecolor="#0db7ed", facecolor="#eaf6fb", linestyle="--")
    ax.add_patch(container)
    ax.text(5, 9.7, "Contenedor Docker (python:3.11-slim) — Render: zonagamer-app.onrender.com",
            ha="center", va="center", fontsize=9, color="#0b6fa4", fontweight="bold")

    _box(ax, 3, 10.9, 4, 0.9, "Cliente Móvil\n(React Native + Expo)", "#cfe2f3", 10)

    _box(ax, 2.5, 8.0, 5, 0.9, "FastAPI (app/main.py) — Uvicorn :8000", "#b6d7a8", 10)
    _box(ax, 2.5, 6.7, 5, 0.8, "CORSMiddleware (allow_origins=['*'])", "#d9ead3", 9)

    _box(ax, 0.9, 5.0, 2.6, 1.0, "health.router\n/health", "#fff2cc", 9)
    _box(ax, 3.7, 5.0, 2.6, 1.0, "auth.router\n/auth/register\n/auth/login", "#fff2cc", 9)
    _box(ax, 6.5, 5.0, 2.6, 1.0, "sync.router\n/sync/push\n/sync/pull", "#fff2cc", 9)

    _box(ax, 2.5, 3.4, 5, 0.9, "SQLAlchemy ORM\n(models.py · database.py)", "#f9cb9c", 9)
    _box(ax, 2.5, 1.6, 5, 1.0, "PostgreSQL (Supabase)\nAutenticación: Passlib + Bcrypt", "#ead1dc", 9)

    _arrow(ax, 5, 10.9, 5, 8.9)   # cliente -> fastapi
    _arrow(ax, 5, 8.0, 5, 7.5)    # fastapi -> cors
    _arrow(ax, 5, 6.7, 2.2, 6.0)  # cors -> health
    _arrow(ax, 5, 6.7, 5.0, 6.0)  # cors -> auth
    _arrow(ax, 5, 6.7, 7.8, 6.0)  # cors -> sync
    _arrow(ax, 2.2, 5.0, 4.0, 4.3)
    _arrow(ax, 5.0, 5.0, 5.0, 4.3)
    _arrow(ax, 7.8, 5.0, 6.0, 4.3)
    _arrow(ax, 5, 3.4, 5, 2.6)    # sqlalchemy -> postgres

    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def generate_app_diagram(path):
    fig, ax = plt.subplots(figsize=(9, 11))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 13)
    ax.axis("off")
    ax.set_title("Entregable 3 — Arquitectura de la APP (React Native + Expo)",
                 fontsize=13, fontweight="bold")

    layers = [
        (11.4, "1. Punto de entrada: index.ts → App.tsx", "#cfe2f3"),
        (10.0, "2. Inicialización: initDb() (zonagamer.db) + AuthProvider (AuthContext)", "#d9ead3"),
        (8.6, "3. Navegación: StackNavigator\nAuth Stack: Login / Register  |  Main Stack: Home, Eventos, Juegos, Torneos, Establecimientos, Moderación", "#fff2cc"),
        (6.9, "4. Servicios locales:\nevents.local.ts · games.local.ts · tournaments.local.ts\nestablecimientos.local.ts · auth.local.ts · auth.api.ts", "#f9cb9c"),
        (5.0, "5. Capa de datos:\ndb.ts (expo-sqlite, WAL) · outbox.ts · syncEngine.ts", "#ead1dc"),
        (3.4, "API remota\nzonagamer-app.onrender.com", "#cfe2f3"),
    ]
    heights = [0.9, 1.0, 1.3, 1.4, 1.4, 1.0]
    for (y, text, color), h in zip(layers, heights):
        _box(ax, 0.6, y, 8.8, h, text, color, 9)

    tops = [y + h for (y, _, _), h in zip(layers, heights)]
    bottoms = [y for (y, _, _) in layers]
    for i in range(len(layers) - 1):
        _arrow(ax, 5, bottoms[i], 5, tops[i + 1])

    # Nota lateral de tecnologías / patrones
    note = ("Stack: TypeScript strict · expo-sqlite · AsyncStorage · React Navigation\n"
            "react-native-maps + Google Maps API · netinfo · EAS (dev/preview/prod)\n"
            "Patrones: Outbox Pattern (offline-first) · MVVM (Screens + Hooks/ViewModels)")
    ax.text(5, 2.4, note, ha="center", va="center", fontsize=8.5,
            bbox=dict(boxstyle="round,pad=0.4", facecolor="#f3f3f3", edgecolor="#999999"))

    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def generate_cicd_diagram(path):
    fig, ax = plt.subplots(figsize=(11, 9))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 12)
    ax.axis("off")
    ax.set_title("Entregable 4 — Diagrama de Flujo CI/CD (EAS + Docker)",
                 fontsize=13, fontweight="bold")

    _box(ax, 4.0, 10.9, 4, 0.9, "Desarrollador\npush / PR a GitHub\n(Alrnrzma/zonagamer-app)", "#cfe2f3", 9)
    _box(ax, 4.0, 9.4, 4, 0.8, "Trigger según rama", "#d9ead3", 9)

    # Tres ramas
    _box(ax, 0.4, 7.2, 3.5, 1.4,
         "feature/* o develop\n→ EAS Build 'development'\n(internal, developmentClient: true)", "#fff2cc", 8.5)
    _box(ax, 4.25, 7.2, 3.5, 1.4,
         "release/preview\n→ EAS Build 'preview'\n(internal, Android APK)", "#fff2cc", 8.5)
    _box(ax, 8.1, 7.2, 3.5, 1.4,
         "main/production\n→ EAS Build 'production'\n(autoIncrement: true) + Docker Build", "#fff2cc", 8.5)

    _box(ax, 0.4, 5.6, 3.5, 0.9, "Distribución interna", "#d9d2e9", 8.5)
    _box(ax, 4.25, 5.6, 3.5, 0.9, "Pruebas en dispositivo", "#d9d2e9", 8.5)
    _box(ax, 8.1, 5.6, 3.5, 0.9, "App Stores", "#d9d2e9", 8.5)

    _box(ax, 7.6, 3.9, 4.0, 1.0,
         "Docker Build\n(python:3.11-slim, EXPOSE 8000)", "#f9cb9c", 8.5)
    _box(ax, 7.6, 2.4, 4.0, 0.9, "Deploy Render", "#b6d7a8", 9)
    _box(ax, 7.6, 0.9, 4.0, 0.9, "PostgreSQL (Supabase)", "#ead1dc", 9)

    _box(ax, 0.6, 2.4, 4.5, 0.9, "Usuarios finales", "#cfe2f3", 9)

    # Flechas principales
    _arrow(ax, 6, 10.9, 6, 10.2)
    _arrow(ax, 6, 9.4, 2.15, 8.6)
    _arrow(ax, 6, 9.4, 6.0, 8.6)
    _arrow(ax, 6, 9.4, 9.85, 8.6)

    _arrow(ax, 2.15, 7.2, 2.15, 6.5)
    _arrow(ax, 6.0, 7.2, 6.0, 6.5)
    _arrow(ax, 9.85, 7.2, 9.85, 6.5)

    # production -> docker build (la rama main genera tambien Docker)
    _arrow(ax, 9.85, 7.2, 9.6, 4.9)
    _arrow(ax, 9.6, 3.9, 9.6, 3.3)   # docker -> render
    _arrow(ax, 9.6, 2.4, 9.6, 1.8)   # render -> postgres

    # App Stores -> usuarios finales -> HTTPS REST -> Render
    _arrow(ax, 8.1, 6.0, 5.1, 3.0)   # app stores -> usuarios
    _arrow(ax, 5.1, 2.85, 7.6, 2.85) # usuarios -> render (HTTPS REST)
    ax.text(6.35, 3.05, "HTTPS REST", ha="center", va="center", fontsize=8, color="#0b6fa4")

    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


# --------------------------------------------------------------------------- #
# Construcción del documento
# --------------------------------------------------------------------------- #
def add_cover(document):
    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("REPORTE FINAL — ZonaGamer App")
    run.bold = True
    run.font.size = Pt(28)
    run.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

    for text, size in [
        ("Proyecto de Desarrollo de Software", 16),
        ("Junio 2026", 14),
        ("Alumno: Angel", 14),
    ]:
        p = document.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text)
        r.font.size = Pt(size)

    document.add_paragraph()
    intro = document.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    intro.add_run(
        "Repositorio: Alrnrzma/zonagamer-app").italic = True
    document.add_page_break()


def build_document(images):
    document = Document()

    # Márgenes amplios para tablas anchas
    section = document.sections[0]
    section.left_margin = Inches(0.6)
    section.right_margin = Inches(0.6)

    add_cover(document)

    # ----- Entregable 1 -----
    document.add_heading("Entregable 1: Seguimiento en Azure Boards", level=1)
    document.add_paragraph(
        "Seguimiento de los elementos de trabajo (Historias, Tasks, Features y Épicas) "
        "organizados por sprint según el plan de trabajo del proyecto ZonaGamer. "
        "El estado de cada elemento se resalta con color."
    )
    add_legend(document)

    document.add_heading("Sprint 1 — Unidad 1: Requerimientos (04/02/2026 – 19/02/2026)", level=2)
    add_sprint_table(document, SPRINT1)

    document.add_heading("Sprint 2 — Unidad 2: CI/CD (20/02/2026 – 27/03/2026)", level=2)
    add_sprint_table(document, SPRINT2)

    document.add_heading("Sprint 3 — Unidad 3: Contenedores (15/04/2026 – 30/04/2026)", level=2)
    add_sprint_table(document, SPRINT3)

    document.add_heading("Sprint 4 — Unidad 4: Despliegue en la Nube (06/05/2026 – 22/05/2026)", level=2)
    add_sprint_table(document, SPRINT4)

    document.add_page_break()

    # ----- Entregable 2 -----
    document.add_heading("Entregable 2: Arquitectura de Backend", level=1)
    document.add_paragraph(
        "El backend está construido con FastAPI y servido por Uvicorn en el puerto 8000. "
        "Utiliza SQLAlchemy como ORM sobre PostgreSQL (Supabase), con autenticación basada "
        "en Passlib + Bcrypt. El servicio se empaqueta en un contenedor Docker "
        "(python:3.11-slim) y se despliega en Render (zonagamer-app.onrender.com)."
    )
    document.add_heading("Componentes principales", level=2)
    for item in [
        "Framework: FastAPI (app/main.py)",
        "Servidor ASGI: Uvicorn (puerto 8000)",
        "ORM: SQLAlchemy",
        "Base de datos: PostgreSQL (Supabase)",
        "Autenticación: Passlib + Bcrypt",
        "Contenedor: Docker (python:3.11-slim)",
        "Hosting: Render (zonagamer-app.onrender.com)",
        "Routers: health (/health), auth (/auth/register, /auth/login), sync (/sync/push, /sync/pull)",
        "CORS: CORSMiddleware (allow_origins=['*'])",
        "Archivos clave: backend/app/main.py, models.py, database.py, routers/, Dockerfile, requirements.txt",
    ]:
        document.add_paragraph(item, style="List Bullet")
    document.add_heading("Diagrama de arquitectura backend", level=2)
    document.add_picture(images["backend"], width=Inches(6.5))
    document.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    document.add_page_break()

    # ----- Entregable 3 -----
    document.add_heading("Entregable 3: Arquitectura de la APP", level=1)
    document.add_paragraph(
        "La aplicación móvil está desarrollada con React Native + Expo (Android/iOS/Web) "
        "en TypeScript strict. Sigue un enfoque offline-first basado en el patrón Outbox y "
        "una arquitectura MVVM (Screens + Hooks/ViewModels). La persistencia local usa "
        "expo-sqlite (modo WAL, zonagamer.db) y la sesión se guarda en AsyncStorage."
    )
    document.add_heading("Componentes principales", level=2)
    for item in [
        "Framework: React Native + Expo (Android/iOS/Web)",
        "Lenguaje: TypeScript strict",
        "Persistencia local: expo-sqlite (SQLite, WAL mode, zonagamer.db)",
        "Sesión: AsyncStorage",
        "Navegación: React Navigation Stack (StackNavigator.tsx)",
        "Mapas: react-native-maps + Google Maps API",
        "Conectividad: @react-native-community/netinfo",
        "Build: EAS (perfiles development/preview/production)",
        "Patrón de datos: Outbox Pattern (offline-first)",
        "Patrón UI: MVVM (Screens + Hooks/ViewModels)",
    ]:
        document.add_paragraph(item, style="List Bullet")
    document.add_heading("Diagrama de arquitectura de la app", level=2)
    document.add_picture(images["app"], width=Inches(6.0))
    document.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    document.add_page_break()

    # ----- Entregable 4 -----
    document.add_heading("Entregable 4: Diagrama de Flujo CI/CD", level=1)
    document.add_paragraph(
        "El pipeline de integración y entrega continua se basa en eas.json y "
        "backend/Dockerfile. Las builds de la app móvil se generan con EAS según la rama, "
        "mientras que el backend se construye como imagen Docker y se despliega en Render "
        "conectado a PostgreSQL (Supabase)."
    )
    document.add_heading("Flujo del pipeline", level=2)
    for item in [
        "Desarrollador → push/PR a GitHub (Alrnrzma/zonagamer-app)",
        "feature/* o develop → EAS Build 'development' (internal, developmentClient: true) → Distribución interna",
        "release/preview → EAS Build 'preview' (internal, Android APK) → Pruebas en dispositivo",
        "main/production → EAS Build 'production' (autoIncrement: true) + Docker Build → App Stores + Render",
        "Docker Build (python:3.11-slim, EXPOSE 8000) → Deploy Render → PostgreSQL (Supabase)",
        "App Stores → Usuarios finales → HTTPS REST → Render",
    ]:
        document.add_paragraph(item, style="List Bullet")
    document.add_heading("Diagrama de flujo CI/CD", level=2)
    document.add_picture(images["cicd"], width=Inches(6.8))
    document.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

    return document


def main():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(repo_root, "ReporteFinal_ZonaGamer.docx")

    with tempfile.TemporaryDirectory() as tmp:
        images = {
            "backend": os.path.join(tmp, "backend.png"),
            "app": os.path.join(tmp, "app.png"),
            "cicd": os.path.join(tmp, "cicd.png"),
        }
        print("Generando diagramas...")
        generate_backend_diagram(images["backend"])
        generate_app_diagram(images["app"])
        generate_cicd_diagram(images["cicd"])

        print("Construyendo documento Word...")
        document = build_document(images)
        document.save(output_path)

    print(f"Documento generado: {output_path}")


if __name__ == "__main__":
    main()
