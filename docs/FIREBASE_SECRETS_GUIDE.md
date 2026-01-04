# Guía de Configuración de Secretos Firebase

Para que el despliegue automático funcione, necesitas cargar el secreto `FIREBASE_SERVICE_ACCOUNT_VITALINUAGE` en GitHub.

## Pasos para obtener la Key:
1.  Ve a la [Consola de Firebase](https://console.firebase.google.com/).
2.  Selecciona tu proyecto **vitalinuage-app**.
3.  Ve a **Configuración del Proyecto** (rueda dentada) > **Cuentas de servicio**.
4.  Haz clic en **"Generar nueva clave privada"**.
5.  Se descargará un archivo `.json` en tu computadora.

## Pasos para cargar en GitHub:
1.  Abre el archivo JSON descargado y copia TODO su contenido.
2.  Ve a tu repositorio en GitHub > **Settings** > **Secrets and variables** > **Actions**.
3.  Haz clic en **"New repository secret"**.
4.  **Name:** `FIREBASE_SERVICE_ACCOUNT_VITALINUAGE`
5.  **Secret:** Pega el contenido del JSON.
6.  Haz clic en **"Add secret"**.

Una vez hecho esto, los Actions comenzarán a funcionar.
