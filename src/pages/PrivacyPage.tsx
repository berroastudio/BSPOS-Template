import { motion } from 'motion/react';

export function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="privacy-content"
        >
          <h1>Política de Privacidad</h1>
          
          <section>
            <h2>1. Introducción</h2>
            <p>
              Berroa Studio ("nosotros", "nuestro" o "nos") se compromete a proteger tu privacidad. Esta Política de Privacidad 
              explica cómo recopilamos, utilizamos, divulgamos y salvaguardamos tu información cuando visitas nuestro sitio web.
            </p>
          </section>

          <section>
            <h2>2. Información que Recopilamos</h2>
            <p>Podemos recopilar información sobre ti de las siguientes maneras:</p>
            <ul>
              <li><strong>Información que proporcionas voluntariamente:</strong> Nombre, dirección de correo electrónico, número de teléfono, dirección de envío, etc.</li>
              <li><strong>Información recopilada automáticamente:</strong> Dirección IP, tipo de navegador, páginas visitadas, fecha y hora de acceso.</li>
              <li><strong>Cookies:</strong> Utilizamos cookies para mejorar tu experiencia de navegación.</li>
            </ul>
          </section>

          <section>
            <h2>3. Cómo Utilizamos tu Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul>
              <li>Procesar tus transacciones y enviar información relacionada</li>
              <li>Mejorar nuestros servicios y personalicar tu experiencia</li>
              <li>Responder a tus consultas y proporcionar soporte al cliente</li>
              <li>Enviar actualizaciones de marketing (solo si has dado tu consentimiento)</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2>4. Cookies y Tecnologías de Seguimiento</h2>
            <p>
              Utilizamos cookies y tecnologías similares para rastrear tu actividad en nuestro sitio. Puedes controlar las cookies 
              a través de la configuración de tu navegador. Utilizamos:
            </p>
            <ul>
              <li><strong>Cookies Funcionales:</strong> Necesarias para el funcionamiento del sitio</li>
              <li><strong>Cookies Analíticas:</strong> Para entender cómo usas nuestro sitio</li>
              <li><strong>Cookies de Marketing:</strong> Para personalizar publicidad</li>
            </ul>
          </section>

          <section>
            <h2>5. Seguridad de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger tu información personal contra 
              acceso no autorizado, alteración y destrucción.
            </p>
          </section>

          <section>
            <h2>6. Derechos de los Usuarios</h2>
            <p>Tienes derecho a:</p>
            <ul>
              <li>Acceder a tus datos personales</li>
              <li>Solicitar la corrección de datos inexactos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Retirar tu consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section>
            <h2>7. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta Política de Privacidad o sobre nuestras prácticas de privacidad, 
              por favor <a href="/contact">ponte en contacto con nosotros</a>.
            </p>
          </section>

          <section>
            <h2>8. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad de vez en cuando. Te notificaremos de cualquier cambio importante 
              publicando la nueva política en nuestro sitio.
            </p>
            <p><em>Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
