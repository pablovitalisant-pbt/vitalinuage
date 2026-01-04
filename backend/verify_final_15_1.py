# Script de Verificación Final - Slice 15.1
# Ejecutar: python -m backend.verify_final_15_1

import sys
import os
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.main import FONTS_DIR
    import requests
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    sys.exit(1)

def verify_fonts_local():
    """Verificar que las fuentes locales existen"""
    print("🔍 Verificando fuentes locales...")
    
    essential_fonts = [
        "arial.ttf",
        "arialbd.ttf",
        "georgia.ttf",
        "georgiab.ttf"
    ]
    
    all_exist = True
    for font in essential_fonts:
        font_path = os.path.join(FONTS_DIR, font)
        if os.path.exists(font_path):
            print(f"   ✅ {font}")
        else:
            print(f"   ❌ {font} NO ENCONTRADA")
            all_exist = False
    
    return all_exist

def verify_server_running():
    """Verificar que el servidor está corriendo"""
    print("\n🔍 Verificando servidor...")
    
    try:
        response = requests.get("http://localhost:8000/api/doctor/profile", timeout=5)
        if response.status_code == 200:
            print("   ✅ Servidor corriendo en http://localhost:8000")
            return True
        else:
            print(f"   ⚠️  Servidor respondió con código {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Servidor no responde: {e}")
        return False

def test_pdf_generation_speed():
    """Probar velocidad de generación de PDFs"""
    print("\n🔍 Probando velocidad de generación de PDFs...")
    
    templates = ["minimal", "modern", "classic"]
    
    # First, set each template
    for template_id in templates:
        try:
            # Update preferences to use this template
            response = requests.put(
                "http://localhost:8000/api/doctor/preferences",
                json={"template_id": template_id},
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"   ⚠️  Error configurando plantilla {template_id}")
                continue
            
            # Generate PDF and measure time
            start_time = time.time()
            pdf_response = requests.get(
                "http://localhost:8000/api/print/test",
                timeout=30
            )
            end_time = time.time()
            
            elapsed = end_time - start_time
            
            if pdf_response.status_code == 200:
                if elapsed < 1.0:
                    print(f"   ✅ {template_id.capitalize()}: {elapsed:.3f}s (INSTANTÁNEO)")
                elif elapsed < 2.0:
                    print(f"   ⚠️  {template_id.capitalize()}: {elapsed:.3f}s (ACEPTABLE)")
                else:
                    print(f"   ❌ {template_id.capitalize()}: {elapsed:.3f}s (LENTO)")
            else:
                print(f"   ❌ {template_id.capitalize()}: Error {pdf_response.status_code}")
                
        except Exception as e:
            print(f"   ❌ {template_id.capitalize()}: {str(e)}")

def main():
    print("\n" + "="*70)
    print("   VERIFICACIÓN FINAL SLICE 15.1 - Rendimiento Instantáneo")
    print("="*70 + "\n")
    
    results = []
    
    # Run verifications
    results.append(("Fuentes locales", verify_fonts_local()))
    results.append(("Servidor corriendo", verify_server_running()))
    
    # Test PDF generation speed
    test_pdf_generation_speed()
    
    # Summary
    print("\n" + "="*70)
    print("   RESUMEN")
    print("="*70 + "\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {name}")
    
    print(f"\n   Total: {passed}/{total} verificaciones básicas pasadas")
    
    if passed == total:
        print("\n   🎉 ¡VERIFICACIÓN COMPLETADA!")
        print("   Las tres plantillas deberían generar PDFs instantáneamente.\n")
        return 0
    else:
        print("\n   ⚠️  Algunas verificaciones fallaron.\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
