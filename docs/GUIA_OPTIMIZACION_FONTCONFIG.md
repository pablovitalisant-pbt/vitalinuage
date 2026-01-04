# Guía de Optimización: FontConfig para WeasyPrint en Windows

**Objetivo:** Reducir el tiempo de generación de PDFs de ~20s a <1s

---

## 🎯 Problema

WeasyPrint usa **FontConfig** (librería Unix/Linux) que en Windows:
1. Escanea `C:\Windows\Fonts` (miles de archivos)
2. Genera caché temporal en cada ejecución
3. Busca coincidencias de fuentes

**Resultado:** ~20 segundos de escaneo en cada generación de PDF.

---

## 🔧 Solución: Configurar FontConfig

### Paso 1: Crear archivo de configuración

Crear `backend/static/fonts/fonts.conf`:

```xml
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- Solo buscar fuentes en este directorio -->
  <dir>.</dir>
  
  <!-- Caché local -->
  <cachedir>cache</cachedir>
  
  <!-- No buscar en directorios del sistema -->
  <dir prefix="default">NONE</dir>
  
  <!-- Aliases para fuentes comunes -->
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Arial</family>
      <family>Calibri</family>
    </prefer>
  </alias>
  
  <alias>
    <family>serif</family>
    <prefer>
      <family>Georgia</family>
    </prefer>
  </alias>
</fontconfig>
```

### Paso 2: Modificar `backend/main.py`

**Antes de importar WeasyPrint**, agregar:

```python
import os

# Font Configuration for WeasyPrint (performance optimization)
FONTS_DIR = os.path.join(os.path.dirname(__file__), "static", "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)

# Configure FontConfig to use only local fonts
os.environ['FONTCONFIG_PATH'] = FONTS_DIR
os.environ['FONTCONFIG_FILE'] = os.path.join(FONTS_DIR, 'fonts.conf')

# Now import WeasyPrint
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

font_config = FontConfiguration()
```

### Paso 3: Crear directorio de caché

```python
# En main.py, después de crear FONTS_DIR
FONTS_CACHE_DIR = os.path.join(FONTS_DIR, "cache")
os.makedirs(FONTS_CACHE_DIR, exist_ok=True)
```

---

## 🧪 Verificación

### Test 1: Verificar que FontConfig usa el archivo correcto

```python
import os
print("FONTCONFIG_PATH:", os.environ.get('FONTCONFIG_PATH'))
print("FONTCONFIG_FILE:", os.environ.get('FONTCONFIG_FILE'))
```

Debe mostrar:
```
FONTCONFIG_PATH: C:\Users\pablo\Documents\Vitalinuage\backend\static\fonts
FONTCONFIG_FILE: C:\Users\pablo\Documents\Vitalinuage\backend\static\fonts\fonts.conf
```

### Test 2: Medir tiempo de generación

```python
import time
start = time.time()
pdf_bytes = HTML(string=html_content).write_pdf(font_config=font_config)
elapsed = time.time() - start
print(f"Tiempo de generación: {elapsed:.3f}s")
```

**Objetivo:** < 1 segundo

---

## 🔄 Alternativa: Usar Fuentes Genéricas

Si FontConfig sigue siendo problemático, simplificar las plantillas:

### Modificar `pdf_templates.py`

**Reemplazar:**
```css
font-family: 'Arial', 'Helvetica', sans-serif;
```

**Por:**
```css
font-family: sans-serif;
```

**Reemplazar:**
```css
font-family: Georgia, 'Times New Roman', serif;
```

**Por:**
```css
font-family: serif;
```

WeasyPrint tiene fuentes genéricas embebidas que no requieren escaneo.

---

## 📊 Comparación de Enfoques

| Enfoque | Tiempo | Ventajas | Desventajas |
|---------|--------|----------|-------------|
| **Sin optimización** | ~20s | Ninguna | Muy lento |
| **FontConfig configurado** | <1s | Rápido, fuentes específicas | Requiere configuración |
| **Fuentes genéricas** | <1s | Muy rápido, sin configuración | Menos control visual |
| **Fuentes embebidas Base64** | <1s | Portátil | Archivos HTML grandes |

---

## 🚀 Implementación Recomendada

### Opción 1: FontConfig (Recomendada)

**Pros:**
- Control total sobre fuentes
- Rendimiento óptimo
- Mantiene diseño exacto

**Contras:**
- Requiere configuración inicial
- Dependiente de FontConfig

### Opción 2: Fuentes Genéricas (Alternativa)

**Pros:**
- Sin configuración
- Rendimiento garantizado
- Portable

**Contras:**
- Menos control visual
- Puede variar entre sistemas

---

## 📝 Checklist de Implementación

- [ ] Crear `backend/static/fonts/fonts.conf`
- [ ] Modificar `backend/main.py` para configurar variables de entorno
- [ ] Crear directorio `backend/static/fonts/cache`
- [ ] Reiniciar servidor
- [ ] Verificar variables de entorno
- [ ] Medir tiempo de generación
- [ ] Confirmar que es <1 segundo
- [ ] Documentar cambios

---

## 🔍 Debugging

### Si el tiempo sigue siendo lento:

1. **Verificar que FontConfig lee el archivo:**
   ```bash
   fc-cache -v
   ```

2. **Verificar que las fuentes están en el directorio:**
   ```bash
   ls backend/static/fonts/*.ttf
   ```

3. **Verificar que el caché se crea:**
   ```bash
   ls backend/static/fonts/cache
   ```

4. **Habilitar logs de WeasyPrint:**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

---

## 📚 Referencias

- [WeasyPrint Documentation](https://doc.courtbouillon.org/weasyprint/)
- [FontConfig Documentation](https://www.freedesktop.org/wiki/Software/fontconfig/)
- [WeasyPrint Font Configuration](https://doc.courtbouillon.org/weasyprint/stable/api_reference.html#fonts)

---

**NOTA:** Esta optimización es **opcional** pero **altamente recomendada** para entornos de producción donde se generan múltiples PDFs.
