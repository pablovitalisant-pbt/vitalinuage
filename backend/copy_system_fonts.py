# Script para copiar fuentes esenciales del sistema a backend/static/fonts
# Ejecutar: python -m backend.copy_system_fonts

import os
import shutil
from pathlib import Path

# Fuentes esenciales que usan las plantillas
ESSENTIAL_FONTS = [
    # Arial (usado en Minimal y Modern)
    "arial.ttf",
    "arialbd.ttf",  # Arial Bold
    "ariali.ttf",   # Arial Italic
    "arialbi.ttf",  # Arial Bold Italic
    
    # Georgia (usado en Classic)
    "georgia.ttf",
    "georgiab.ttf",  # Georgia Bold
    "georgiai.ttf",  # Georgia Italic
    "georgiaz.ttf",  # Georgia Bold Italic
    
    # Helvetica fallback (común en sistemas)
    "calibri.ttf",
    "calibrib.ttf",
]

def copy_system_fonts():
    """Copia fuentes esenciales del sistema a backend/static/fonts"""
    
    # Rutas
    windows_fonts = Path("C:/Windows/Fonts")
    target_dir = Path(__file__).parent / "static" / "fonts"
    
    # Crear directorio si no existe
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print("📦 Copiando fuentes esenciales del sistema...")
    print(f"   Origen: {windows_fonts}")
    print(f"   Destino: {target_dir}\n")
    
    copied = 0
    skipped = 0
    
    for font_name in ESSENTIAL_FONTS:
        source = windows_fonts / font_name
        target = target_dir / font_name
        
        if source.exists():
            if not target.exists():
                try:
                    shutil.copy2(source, target)
                    print(f"   ✅ Copiada: {font_name}")
                    copied += 1
                except Exception as e:
                    print(f"   ⚠️  Error copiando {font_name}: {e}")
            else:
                print(f"   ⏭️  Ya existe: {font_name}")
                skipped += 1
        else:
            print(f"   ❌ No encontrada en sistema: {font_name}")
    
    print(f"\n📊 Resumen:")
    print(f"   Copiadas: {copied}")
    print(f"   Ya existían: {skipped}")
    print(f"   Total en carpeta: {len(list(target_dir.glob('*.ttf')))}")
    
    # Crear archivo CSS con @font-face
    create_font_css(target_dir)
    
    print("\n✅ Proceso completado")

def create_font_css(fonts_dir):
    """Crea un archivo CSS con @font-face para las fuentes locales"""
    
    css_content = """/* Fuentes locales para WeasyPrint - Generado automáticamente */

@font-face {
    font-family: 'Arial';
    src: url('arial.ttf');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Arial';
    src: url('arialbd.ttf');
    font-weight: bold;
    font-style: normal;
}

@font-face {
    font-family: 'Arial';
    src: url('ariali.ttf');
    font-weight: normal;
    font-style: italic;
}

@font-face {
    font-family: 'Arial';
    src: url('arialbi.ttf');
    font-weight: bold;
    font-style: italic;
}

@font-face {
    font-family: 'Georgia';
    src: url('georgia.ttf');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Georgia';
    src: url('georgiab.ttf');
    font-weight: bold;
    font-style: normal;
}

@font-face {
    font-family: 'Georgia';
    src: url('georgiai.ttf');
    font-weight: normal;
    font-style: italic;
}

@font-face {
    font-family: 'Georgia';
    src: url('georgiaz.ttf');
    font-weight: bold;
    font-style: italic;
}

@font-face {
    font-family: 'Helvetica';
    src: url('calibri.ttf');
    font-weight: normal;
    font-style: normal;
}
"""
    
    css_file = fonts_dir / "fonts.css"
    with open(css_file, "w", encoding="utf-8") as f:
        f.write(css_content)
    
    print(f"\n   📝 Creado: {css_file.name}")

if __name__ == "__main__":
    copy_system_fonts()
