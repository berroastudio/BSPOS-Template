import React from 'react';
import './BSLoading.css';

interface BSLoadingProps {
  label?: string;
  fullPage?: boolean;
}

/**
 * BSLoading — Premium Global Loader for Berroa Studio Storefront
 * Features the Uiverse blob animation and Berroa Studio branding.
 */
export function BSLoading({ label = 'Cargando...', fullPage = false }: BSLoadingProps) {
  const content = (
    <div className="bs-loading-container">
      <div className="spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {label && <div className="bs-loading-text">{label}</div>}
    </div>
  );

  if (fullPage) {
    return <div className="bs-loading-fullpage">{content}</div>;
  }

  return content;
}

export default BSLoading;
