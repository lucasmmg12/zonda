import React from 'react';

/**
 * Fondo arquitectónico de Ingeniería Contable y Financiera en tonos Verde Bosque Profundo (#064e3b / #047857)
 * con opacidad ultra-sutil (filigrana transparente) para acompañar el diseño de líneas del ERP.
 */
export const AccountingWatermarkBackground: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. Gran Curva Financiera de Flujo de Fondos y Velas Contables (Abajo Derecha / Centro) */}
      <svg
        className="absolute right-[-40px] bottom-[-20px] w-[980px] h-[560px] text-[#064e3b] opacity-[0.055]"
        viewBox="0 0 980 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Líneas de coordenadas horizontales y verticales de libro mayor */}
        <line x1="40" y1="60" x2="940" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="40" y1="160" x2="940" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="40" y1="260" x2="940" y2="260" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="40" y1="360" x2="940" y2="360" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="40" y1="460" x2="940" y2="460" stroke="currentColor" strokeWidth="1.5" />

        {/* Columnas verticales de balance */}
        <line x1="160" y1="40" x2="160" y2="480" stroke="currentColor" strokeWidth="1" />
        <line x1="340" y1="40" x2="340" y2="480" stroke="currentColor" strokeWidth="1" />
        <line x1="520" y1="40" x2="520" y2="480" stroke="currentColor" strokeWidth="1" />
        <line x1="700" y1="40" x2="700" y2="480" stroke="currentColor" strokeWidth="1" />
        <line x1="880" y1="40" x2="880" y2="480" stroke="currentColor" strokeWidth="1" />

        {/* Barras de volumen patrimonial de fondo */}
        <rect x="90" y="340" width="28" height="120" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="190" y="290" width="28" height="170" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="290" y="310" width="28" height="150" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="390" y="230" width="28" height="230" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="490" y="260" width="28" height="200" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="590" y="180" width="28" height="280" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="690" y="210" width="28" height="250" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <rect x="790" y="120" width="28" height="340" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />

        {/* Curva de Tendencia de Activo Neto */}
        <path
          d="M 60 410 C 160 390, 220 300, 310 320 C 400 340, 460 210, 560 230 C 660 250, 740 110, 910 85"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Segunda curva de Proyección Presupuestaria */}
        <path
          d="M 60 440 C 180 420, 260 360, 360 350 C 460 340, 550 280, 670 250 C 770 220, 830 175, 910 150"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          fill="none"
        />

        {/* Nodos de auditoría sobre la curva */}
        <circle cx="310" cy="320" r="5" fill="currentColor" />
        <circle cx="560" cy="230" r="5" fill="currentColor" />
        <circle cx="910" cy="85" r="6" fill="currentColor" />
        <circle cx="910" cy="85" r="13" stroke="currentColor" strokeWidth="1.2" />

        {/* Etiquetas técnicas de filigrana contable */}
        <text x="52" y="52" fill="currentColor" fontSize="11" fontWeight="700" letterSpacing="2">
          ECUACIÓN PATRIMONIAL // ACTIVO = PASIVO + PATRIMONIO NETO
        </text>
        <text x="712" y="75" fill="currentColor" fontSize="10" fontWeight="600" letterSpacing="1.5">
          ∑ DEBE === ∑ HABER [PARTIDA DOBLE]
        </text>
      </svg>

      {/* 2. Rueda de Balance / Ratio Financiero y Esquema de Cuenta T (Arriba Derecha) */}
      <svg
        className="absolute right-[4%] top-[68px] w-[460px] h-[460px] text-[#064e3b] opacity-[0.045]"
        viewBox="0 0 460 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="230" cy="230" r="190" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 6" />
        <circle cx="230" cy="230" r="150" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="230" cy="230" r="105" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" />
        <circle cx="230" cy="230" r="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="230" y1="20" x2="230" y2="440" stroke="currentColor" strokeWidth="1" />
        <line x1="20" y1="230" x2="440" y2="230" stroke="currentColor" strokeWidth="1" />
        <path
          d="M 230 230 L 360 120 A 170 170 0 0 1 395 270 Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <text x="145" y="218" fill="currentColor" fontSize="11" fontWeight="700" letterSpacing="2">
          DEBE (ACTIVO)
        </text>
        <text x="242" y="218" fill="currentColor" fontSize="11" fontWeight="700" letterSpacing="2">
          HABER (PASIVO)
        </text>
        <text x="165" y="252" fill="currentColor" fontSize="10" fontWeight="600" letterSpacing="1.5">
          AUDITORÍA FISCAL RG 4597
        </text>
      </svg>

      {/* 3. Esquema de Mayor Contable "Cuenta T" y Símbolos Matemáticos (Izquierda / Centro) */}
      <svg
        className="absolute left-[260px] top-[140px] w-[520px] h-[420px] text-[#064e3b] opacity-[0.04]"
        viewBox="0 0 520 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gran Cuenta T Contable de Fondo */}
        <line x1="40" y1="70" x2="480" y2="70" stroke="currentColor" strokeWidth="2.5" />
        <line x1="260" y1="70" x2="260" y2="370" stroke="currentColor" strokeWidth="2.5" />
        <text x="90" y="55" fill="currentColor" fontSize="13" fontWeight="800" letterSpacing="3">
          1.1.01 // DÉBITOS
        </text>
        <text x="290" y="55" fill="currentColor" fontSize="13" fontWeight="800" letterSpacing="3">
          2.1.01 // CRÉDITOS
        </text>

        {/* Renglones simulados de asiento */}
        <line x1="60" y1="110" x2="230" y2="110" stroke="currentColor" strokeWidth="1.2" />
        <line x1="290" y1="110" x2="460" y2="110" stroke="currentColor" strokeWidth="1.2" />
        <line x1="60" y1="150" x2="210" y2="150" stroke="currentColor" strokeWidth="1.2" />
        <line x1="290" y1="150" x2="440" y2="150" stroke="currentColor" strokeWidth="1.2" />
        <line x1="60" y1="190" x2="240" y2="190" stroke="currentColor" strokeWidth="1.2" />
        <line x1="290" y1="190" x2="450" y2="190" stroke="currentColor" strokeWidth="1.2" />
        <line x1="40" y1="330" x2="480" y2="330" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="40" y1="365" x2="480" y2="365" stroke="currentColor" strokeWidth="2" />

        {/* Símbolos de Sumatoria y Balance */}
        <text x="45" y="315" fill="currentColor" fontSize="44" fontWeight="800">
          ∑
        </text>
        <text x="435" y="315" fill="currentColor" fontSize="40" fontWeight="800">
          $
        </text>
      </svg>
    </div>
  );
};
