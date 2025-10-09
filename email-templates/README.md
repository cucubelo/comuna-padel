# Email Templates para Comuna Padel

Este directorio contiene los templates de correo electrónico personalizados para la aplicación Comuna Padel.

## 📧 Templates Disponibles

### `confirm-signup.html`
Template para confirmación de registro de usuarios con diseño moderno y responsive.

**Características:**
- ✨ Diseño moderno con gradientes y sombras
- 📱 Completamente responsive (móvil y desktop)
- 🎨 Colores consistentes con la marca Comuna Padel
- 🔒 Botón de confirmación prominente
- 📋 Sección de características de la plataforma
- 🌐 Footer con información de contacto

## 🚀 Integración con Supabase

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Accede a tu proyecto Comuna Padel
3. Navega a **Authentication** > **Email Templates**

### Paso 2: Configurar el Template de Confirmación
1. Selecciona **"Confirm signup"** en la lista de templates
2. Reemplaza el contenido HTML por defecto con el contenido de `confirm-signup.html`
3. Asegúrate de mantener la variable `{{ .ConfirmationURL }}` en el botón de confirmación

### Paso 3: Variables Disponibles
Supabase proporciona las siguientes variables que puedes usar en el template:

- `{{ .ConfirmationURL }}` - URL de confirmación (OBLIGATORIO)
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de confirmación
- `{{ .SiteURL }}` - URL base de tu aplicación

### Paso 4: Personalización Adicional
Si necesitas personalizar el template, puedes:

1. **Cambiar colores**: Modifica las variables CSS en la sección `<style>`
2. **Agregar contenido**: Añade secciones adicionales en el HTML
3. **Modificar textos**: Cambia los textos según tus necesidades

## 🎨 Estructura del Diseño

### Header
- Logo y nombre de la marca
- Gradiente azul corporativo
- Subtítulo descriptivo

### Contenido Principal
- Mensaje de bienvenida personalizado
- Caja de confirmación destacada con icono
- Botón de acción principal (CTA)

### Sección de Características
- Lista de beneficios de la plataforma
- Iconos SVG para mejor visualización
- Diseño en tarjetas con bordes coloridos

### Footer
- Información de contacto
- Enlaces sociales
- Texto legal y de privacidad

## 📱 Compatibilidad

El template está optimizado para:
- ✅ Gmail (Web y móvil)
- ✅ Outlook (Web y desktop)
- ✅ Apple Mail (iOS y macOS)
- ✅ Yahoo Mail
- ✅ Thunderbird
- ✅ Clientes móviles nativos

## 🔧 Testing

### Vista Previa Local
Abre `preview.html` en tu navegador para ver cómo se ve el email.

### Testing en Diferentes Clientes
Se recomienda usar herramientas como:
- [Litmus](https://litmus.com)
- [Email on Acid](https://www.emailonacid.com)
- [Mail Tester](https://www.mail-tester.com)

## 📝 Notas Importantes

1. **Variables de Supabase**: Siempre mantén `{{ .ConfirmationURL }}` en el botón principal
2. **Estilos inline**: Los estilos están tanto en `<style>` como inline para máxima compatibilidad
3. **Imágenes**: Se usan iconos SVG inline para evitar problemas de carga
4. **Responsive**: El diseño se adapta automáticamente a pantallas pequeñas

## 🆘 Solución de Problemas

### El template no se ve bien en Outlook
- Asegúrate de que todos los estilos importantes estén inline
- Usa tablas para layouts complejos si es necesario

### Los colores no se muestran correctamente
- Verifica que los códigos de color estén en formato hexadecimal
- Algunos clientes no soportan gradientes CSS

### El botón de confirmación no funciona
- Verifica que `{{ .ConfirmationURL }}` esté correctamente colocado
- Asegúrate de que Supabase esté configurado correctamente

## 📞 Soporte

Si tienes problemas con la integración o personalización del template, contacta al equipo de desarrollo.