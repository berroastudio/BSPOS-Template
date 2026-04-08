import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

interface CustomDesignFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productType: 'topper' | 'custom-print' | 'embroidery' | 'other';
  description: string;
  budget: '' | 'under-100' | '100-500' | '500-1000' | '1000+';
  deadline: string;
  specialRequests: string;
  attachmentUrl?: string;
}

interface CustomDesignFormProps {
  tenantId?: string;
  onSuccess?: (quoteNumber: string) => void;
  onError?: (error: string) => void;
}

const PRODUCT_TYPES = [
  { value: 'topper', label: '🎂 Topper' },
  { value: 'custom-print', label: '🖼️ Impresión Personalizada' },
  { value: 'embroidery', label: '🪡 Bordado' },
  { value: 'other', label: '✨ Otro' }
];

const BUDGET_OPTIONS = [
  { value: 'under-100', label: 'Menos de $100' },
  { value: '100-500', label: '$100 - $500' },
  { value: '500-1000', label: '$500 - $1,000' },
  { value: '1000+', label: 'Más de $1,000' }
];

export default function CustomDesignForm({ tenantId, onSuccess, onError }: CustomDesignFormProps) {
  const [formData, setFormData] = useState<CustomDesignFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    productType: 'topper',
    description: '',
    budget: '',
    deadline: '',
    specialRequests: '',
    attachmentUrl: ''
  });

  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value as any
    }));
    setError(null);
  };

  const handleAddAttachment = () => {
    const url = formData.attachmentUrl?.trim();
    if (url && !attachments.includes(url)) {
      setAttachments([...attachments, url]);
      setFormData(prev => ({
        ...prev,
        attachmentUrl: ''
      }));
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setAttachments(attachments.filter(a => a !== url));
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.customerEmail.trim()) {
      setError('El email es requerido');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      setError('Email inválido');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La descripción del diseño es requerida');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        productType: formData.productType,
        description: formData.description,
        budget: formData.budget || undefined,
        deadline: formData.deadline || undefined,
        specialRequests: formData.specialRequests || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        tenantId
      };

      const response = await fetch('/api/custom-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar solicitud de diseño');
      }

      const data = await response.json();

      setQuoteNumber(data.quoteNumber);
      setQuoteId(data.quoteId);
      setSubmitted(true);

      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        productType: 'topper',
        description: '',
        budget: '',
        deadline: '',
        specialRequests: '',
        attachmentUrl: ''
      });
      setAttachments([]);

      if (onSuccess) {
        onSuccess(data.quoteNumber);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted && quoteNumber) {
    return (
      <div className="custom-design-success">
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '20px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginTop: 0 }}>✅ ¡Solicitud de Diseño Recibida!</h3>
          <p>Gracias por tu confianza. Nuestro equipo de diseñadores revisará tu solicitud y se pondrá en contacto contigo en los próximos días.</p>
          
          <div style={{
            backgroundColor: '#fff',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '12px',
            fontFamily: 'monospace'
          }}>
            <strong>Número de Referencia:</strong>
            <br />
            {quoteNumber}
          </div>

          <p style={{ fontSize: '12px', color: '#555', marginTop: '12px' }}>
            Guarda este número para futuras referencias. Te enviaremos más información al email que proporcionaste.
          </p>
        </div>

        <Button
          onClick={() => {
            setSubmitted(false);
            setQuoteNumber(null);
            setQuoteId(null);
          }}
          variant="secondary"
        >
          Hacer otra solicitud
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="custom-design-form">
      <h2>✨ Solicitud de Diseño Personalizado</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Cuéntanos tu visión y nuestro equipo de diseñadores la hará realidad.
      </p>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* ─────────────────────────────────────── */}
      {/* INFORMACIÓN DEL CLIENTE */}
      {/* ─────────────────────────────────────── */}
      <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #eee', borderRadius: '4px' }}>
        <legend style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>Información de Contacto</legend>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="customerName" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Nombre Completo *
          </label>
          <Input
            id="customerName"
            name="customerName"
            type="text"
            value={formData.customerName}
            onChange={handleChange}
            placeholder="Tu nombre"
            disabled={loading}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="customerEmail" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Email *
          </label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={handleChange}
            placeholder="tu@email.com"
            disabled={loading}
            required
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="customerPhone" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Teléfono
          </label>
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            value={formData.customerPhone}
            onChange={handleChange}
            placeholder="+1-809-555-0100"
            disabled={loading}
          />
        </div>
      </fieldset>

      {/* ─────────────────────────────────────── */}
      {/* DETALLES DEL DISEÑO */}
      {/* ─────────────────────────────────────── */}
      <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #eee', borderRadius: '4px' }}>
        <legend style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>Detalles del Diseño</legend>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="productType" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Tipo de Producto *
          </label>
          <select
            id="productType"
            name="productType"
            value={formData.productType}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: 'inherit'
            }}
          >
            {PRODUCT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Descripción del Diseño *
          </label>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Cuéntanos tu visión en detalle. Incluye colores, estilos, elementos específicos, etc.
          </p>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ej: Topper de mermaid con cola de purpurina, colores turquesa y dorado, 15cm de altura..."
            disabled={loading}
            required
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="specialRequests" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Solicitudes Especiales
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            placeholder="Material específico, técnica preferida, restricciones, etc."
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </fieldset>

      {/* ─────────────────────────────────────── */}
      {/* DETALLES PRÁCTICOS */}
      {/* ─────────────────────────────────────── */}
      <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #eee', borderRadius: '4px' }}>
        <legend style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>Detalles Prácticos</legend>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="budget" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Presupuesto Estimado
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: 'inherit'
            }}
          >
            <option value="">-- Seleccionar rango --</option>
            {BUDGET_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="deadline" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
            Fecha de Entrega Deseada
          </label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </fieldset>

      {/* ─────────────────────────────────────── */}
      {/* ARCHIVOS ADJUNTOS */}
      {/* ─────────────────────────────────────── */}
      <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #eee', borderRadius: '4px' }}>
        <legend style={{ fontSize: '14px', fontWeight: 'bold', paddingLeft: '8px' }}>Archivos de Referencia (Opcional)</legend>
        
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
          Puedes proporcionar URLs de imágenes de referencia, inspiración o bocetos.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <Input
            type="url"
            value={formData.attachmentUrl}
            onChange={e => setFormData(prev => ({ ...prev, attachmentUrl: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <Button
            type="button"
            onClick={handleAddAttachment}
            disabled={loading || !formData.attachmentUrl}
            variant="secondary"
            style={{ whiteSpace: 'nowrap' }}
          >
            Agregar
          </Button>
        </div>

        {attachments.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
              Archivos agregados ({attachments.length}):
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {attachments.map((url, idx) => (
                <li key={idx} style={{ marginBottom: '6px', fontSize: '12px' }}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                    Archivo {idx + 1}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(url)}
                    disabled={loading}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </fieldset>

      <Button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px'
        }}
      >
        {loading ? '⏳ Enviando solicitud...' : '✨ Enviar Solicitud de Diseño'}
      </Button>

      <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', textAlign: 'center' }}>
        Nuestro equipo revisará tu solicitud y se pondrá en contacto dentro de 24-48 horas.
      </p>
    </form>
  );
}
