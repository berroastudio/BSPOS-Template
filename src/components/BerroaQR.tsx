import { QRCodeCanvas } from 'qrcode.react';

interface BerroaQRProps {
  value: string;
  size?: number;
  label?: string;
}

export function BerroaQR({ value, size = 100, label }: BerroaQRProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '12px',
      padding: '16px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      width: 'fit-content',
      margin: '0 auto'
    }}>
      <QRCodeCanvas
        value={value}
        size={size}
        level="H"
        includeMargin={false}
        imageSettings={{
          src: "/logo-header.png", // Small logo in the middle
          x: undefined,
          y: undefined,
          height: 20,
          width: 20,
          excavate: true,
        }}
      />
      {label && (
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          color: '#111'
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
