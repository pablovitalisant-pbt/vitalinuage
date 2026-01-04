# Script de Verificación - Slice 15.1
# Ejecutar: python -m backend.verify_slice_15_1

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.main import app, font_config, FONTS_DIR
    from fastapi.testclient import TestClient
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("Asegúrate de que el servidor esté instalado correctamente.")
    sys.exit(1)

try:
    from PyPDF2 import PdfReader
except ImportError:
    print("⚠️  PyPDF2 no está instalado. Instalando...")
    os.system("pip install PyPDF2")
    from PyPDF2 import PdfReader

import io

def verify_fonts_dir():
    """Verificar que la carpeta de fuentes existe"""
    print("🔍 Verificando carpeta de fuentes...")
    if os.path.exists(FONTS_DIR):
        print(f"   ✅ Carpeta existe: {FONTS_DIR}")
        return True
    else:
        print(f"   ❌ Carpeta NO existe: {FONTS_DIR}")
        return False

def verify_font_config():
    """Verificar que FontConfiguration está inicializada"""
    print("🔍 Verificando FontConfiguration...")
    if font_config is not None:
        print("   ✅ FontConfiguration inicializada")
        return True
    else:
        print("   ❌ FontConfiguration NO inicializada")
        return False

def verify_single_page_pdf():
    """Verificar que el PDF generado tiene exactamente 1 página"""
    print("🔍 Verificando generación de PDF de página única...")
    
    client = TestClient(app)
    
    try:
        # Generate test PDF
        response = client.get("/api/print/test")
        
        if response.status_code != 200:
            print(f"   ❌ Error al generar PDF: {response.status_code}")
            return False
        
        # Read PDF
        pdf_bytes = io.BytesIO(response.content)
        pdf_reader = PdfReader(pdf_bytes)
        
        num_pages = len(pdf_reader.pages)
        
        if num_pages == 1:
            print(f"   ✅ PDF tiene exactamente 1 página")
            return True
        else:
            print(f"   ❌ PDF tiene {num_pages} páginas (esperado: 1)")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def verify_startup_warmup():
    """Verificar que el startup event está registrado"""
    print("🔍 Verificando startup warm-up...")
    
    # Check if startup event is registered
    startup_events = [event for event in app.router.on_startup]
    
    if len(startup_events) > 0:
        print(f"   ✅ {len(startup_events)} evento(s) de startup registrado(s)")
        return True
    else:
        print("   ❌ No hay eventos de startup registrados")
        return False

def main():
    print("\n" + "="*60)
    print("   VERIFICACIÓN SLICE 15.1 - Motor PDF Optimizado")
    print("="*60 + "\n")
    
    results = []
    
    # Run all verifications
    results.append(("Carpeta de fuentes", verify_fonts_dir()))
    results.append(("Font Configuration", verify_font_config()))
    results.append(("Startup warm-up", verify_startup_warmup()))
    results.append(("PDF de página única", verify_single_page_pdf()))
    
    # Summary
    print("\n" + "="*60)
    print("   RESUMEN DE VERIFICACIÓN")
    print("="*60 + "\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {name}")
    
    print(f"\n   Total: {passed}/{total} verificaciones pasadas")
    
    if passed == total:
        print("\n   🎉 ¡TODAS LAS VERIFICACIONES PASARON!")
        print("   El Slice 15.1 está completamente implementado.\n")
        return 0
    else:
        print("\n   ⚠️  Algunas verificaciones fallaron.")
        print("   Revisar los errores arriba.\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
