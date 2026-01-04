# Especificación Slice 15.2 (Fase A) - Talonario Mapper

**Estado:** Borrador  
**Fecha:** 2026-01-03

---

## 1. Visión General
El objetivo es permitir a los médicos imprimir el contenido de una prescripción (texto) sobre hojas pre-impresas físicas (talonarios, recetarios con membrete). El sistema debe permitir "mapear" dónde cae cada campo (Nombre, Fecha, Diagnóstico, etc.) sobre una imagen de referencia del talonario físico.

## 2. Propuesta Técnica: Sistema de Coordenadas
Para garantizar la precisión milimétrica en la impresión física, utilizaremos un sistema de coordenadas basado en **Unidades Físicas (Milímetros)** relativas a la esquina superior izquierda del papel A5.

### ¿Por qué Milímetros?
- **Independencia de Resolución:** Los píxeles dependen de la pantalla y la resolución de la imagen subida. Los mm son constantes en el mundo físico.
- **Formato Estándar:** Trabajamos estricta y únicamente con **A5 (148mm x 210mm)**.
- **Motor PDF:** WeasyPrint maneja unidades CSS absolutas (`mm`, `cm`, `in`) con precisión nativa.

### Flujo de Datos
1. **Frontend (Calibración):**
   - Usuario sube foto del talonario.
   - Frontend conoce el aspect ratio de A5 (148/210 ≈ 0.70).
   - Usuario arrastra "cajas" (inputs) sobre la imagen.
   - Al guardar, el frontend calcula la posición en % y la convierte a **milímetros**.
   - Ejemplo: Si una caja está al 10% del borde izquierdo, `x = 148mm * 0.10 = 14.8mm`.

2. **Backend (Persistencia):**
   - Guarda coordenadas exactas en mm (`x`, `y`) y tamaño de fuente (`pt`).

3. **Backend (Impresión):**
   - Genera un PDF A5 en blanco (o con imagen de fondo tenue para debug).
   - Coloca elementos usando `position: absolute; left: {x}mm; top: {y}mm;`.

---

## 3. Modelo de Datos (SQLAlchemy)

Archivo: `backend/models.py`

```python
class PrescriptionMap(Base):
    __tablename__ = "prescription_maps"

    id = Column(String, primary_key=True, index=True)
    doctor_id = Column(String, ForeignKey("doctors.id"))
    name = Column(String)  # Ej: "Recetario Clínica Centenario"
    
    # Ruta de la imagen de referencia (para mostrar en frontend)
    background_image_path = Column(String) 
    
    # Dimensiones de referencia (deberían ser siempre ~148x210 para A5, pero guardamos por si acaso)
    canvas_width_mm = Column(Float, default=148.0)
    canvas_height_mm = Column(Float, default=210.0)
    
    # Configuración de campos (JSON)
    # Estructura:
    # [
    #   {
    #     "field_key": "patient_name",   # Identificador interno
    #     "x_mm": 15.5,                  # Posición absoluta X
    #     "y_mm": 40.2,                  # Posición absoluta Y
    #     "font_size_pt": 12,            # Tamaño de letra
    #     "max_width_mm": 80.0,          # Ancho máximo (para wrap o truncar)
    #     "font_family": "sans-serif"    # Opcional
    #   },
    #   ...
    # ]
    fields_config = Column(JSON)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relación
    # doctor = relationship("Doctor", back_populates="maps")
```

---

## 4. Contrato de API

### 4.1. Gestión de Mapas

#### `POST /api/maps`
Crea un nuevo mapa de prescripción.
- **Body:** `Multipart/form-data`
  - `image`: Archivo de imagen (opcional si solo edita).
  - `data`: JSON string con `name`, `fields_config`.
- **Respuesta:** `PrescriptionMap` object.

#### `GET /api/maps`
Lista mapas del doctor autenticado.
- **Respuesta:** `List[PrescriptionMap]`

#### `GET /api/maps/{id}`
Obtiene detalle de un mapa.

#### `PUT /api/maps/{id}`
Actualiza coordenadas o imagen.

### 4.2. Impresión Mapeada

#### `GET /api/print/mapped/{consultation_id}`
Genera el PDF usando un mapa específico.
- **Query Params:** 
  - `map_id` (Required): ID del mapa a utilizar.
  - `debug` (Optional): `true` para imprimir la imagen de fondo con baja opacidad (para verificar alineación).
- **Respuesta:** PDF binario (Stream).

---

## 5. Implementación en WeasyPrint
Se utilizará una plantilla Jinja2 genérica que itera sobre los campos configurados.

```html
<!-- Plantilla Mapped -->
<div style="position: relative; width: 148mm; height: 210mm;">
    {% if debug_mode %}
        <img src="{{ background_image_base64 }}" style="position: absolute; width: 100%; opacity: 0.3; z-index: 0;">
    {% endif %}

    {% for field in configured_fields %}
        <div style="
            position: absolute; 
            left: {{ field.x_mm }}mm; 
            top: {{ field.y_mm }}mm; 
            font-size: {{ field.font_size_pt }}pt;
            width: {{ field.max_width_mm }}mm;
            /* Debug helper */
            {% if debug_mode %}border: 1px dashed red;{% endif %}
        ">
            {{ field.value }}
        </div>
    {% endfor %}
</div>
```

---

## 6. Plan de Validación (Pruebas)
1. **Test de Esquema:** Verificar que `fields_config` acepta y valida la estructura JSON correcta.
2. **Test de Coordenadas:** Crear un mapa con coordenadas conocidas (0,0) y verificar en el HTML generado que `left: 0mm; top: 0mm`.
3. **Test de Impresión:** Generar PDF y verificar (visualmente o por análisis de texto) que el contenido no está en flujo normal, sino posicionado absolutamente.
