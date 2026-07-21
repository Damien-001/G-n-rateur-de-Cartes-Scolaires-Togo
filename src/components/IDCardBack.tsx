import React from 'react';
import { Student, SchoolInfo } from '../types';

interface IDCardBackProps {
  student: Student;
  schoolInfo: SchoolInfo;
}

export const IDCardBack: React.FC<IDCardBackProps> = React.memo(({ student, schoolInfo }) => {
  const currentColors = schoolInfo.cardColors || {
    headerBg: '#047857',
    headerText: '#ffffff',
    footerBar: '#059669',
    matriculeText: '#065f46',
  };

  return (
    <div
      style={{
        width: 350,
        height: 198,
        position: 'relative',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1.25px solid #d1d5db',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 8,
        fontFamily: '"Outfit", sans-serif',
        userSelect: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Decorative Guilloche/Stripes Safety Pattern in background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(45deg, ${currentColors.headerBg} 0px, ${currentColors.headerBg} 2px, transparent 2px, transparent 10px)`,
        }}
      />

      {/* Top Banner: Togo Flag Stripes and Motto */}
      <div>
        <div style={{ display: 'flex', height: 4, width: '100%', gap: 1 }}>
          <div style={{ flex: 1, backgroundColor: '#006a4e' }} />
          <div style={{ flex: 1, backgroundColor: '#ffc61e' }} />
          <div style={{ flex: 1, backgroundColor: '#006a4e' }} />
          <div style={{ flex: 1, backgroundColor: '#d21034' }} />
          <div style={{ flex: 1, backgroundColor: '#ffc61e' }} />
        </div>
        <div style={{ 
          fontSize: 5, 
          fontWeight: '800', 
          color: '#475569', 
          textAlign: 'center', 
          letterSpacing: 1.5, 
          textTransform: 'uppercase',
          marginTop: 4,
          lineHeight: 1
        }}>
          République Togolaise • Union - Paix - Solidarité
        </div>
      </div>

      {/* Main instructions content */}
      <div style={{ 
        padding: '0 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 4
      }}>
        <div style={{ 
          fontSize: 6.5, 
          fontWeight: '700', 
          color: currentColors.headerBg, 
          textTransform: 'uppercase', 
          letterSpacing: 0.5,
          textAlign: 'center',
          lineHeight: 1.1
        }}>
          Règlement de la Carte Scolaire
        </div>
        
        <p style={{ 
          fontSize: 5.5, 
          color: '#334155', 
          textAlign: 'justify', 
          lineHeight: 1.3, 
          margin: 0,
          fontWeight: '500'
        }}>
          1. Cette carte est strictement personnelle. Elle doit être présentée à toute réquisition des autorités scolaires ou lors des contrôles d'accès aux examens.
        </p>
        <p style={{ 
          fontSize: 5.5, 
          color: '#334155', 
          textAlign: 'justify', 
          lineHeight: 1.3, 
          margin: 0,
          fontWeight: '500'
        }}>
          2. L'usage frauduleux ou le prêt de cette carte à un tiers expose son titulaire à des sanctions disciplinaires.
        </p>
        <p style={{ 
          fontSize: 5.5, 
          color: '#475569', 
          textAlign: 'center', 
          lineHeight: 1.2, 
          margin: '2px 0 0 0',
          fontStyle: 'italic',
          fontWeight: '600'
        }}>
          En cas de perte, veuillez la rapporter au secrétariat de l'école :<br />
          <strong style={{ color: '#0f172a' }}>{schoolInfo.name || "l'Établissement"}</strong>
        </p>
      </div>

      {/* Bottom Area: Signatures and Stamp */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        borderTop: '0.75px dashed #cbd5e1', 
        paddingTop: 4,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 5, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Année Académique
          </span>
          <span style={{ fontSize: 6.5, color: currentColors.matriculeText, fontWeight: '800' }}>
            {student.schoolYear || '2025-2026'}
          </span>
        </div>

        {/* Principal Stamp and Signature layout */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 28 }}>
          {schoolInfo.signatureUrl && (
            <div style={{ position: 'relative', width: 35, height: 20 }}>
              <img 
                src={schoolInfo.signatureUrl} 
                alt="Signature" 
                style={{ width: '100%', height: '100%', objectContain: 'contain' }} 
              />
              <span style={{ 
                position: 'absolute', 
                bottom: -2, 
                left: 0, 
                right: 0, 
                fontSize: 3.5, 
                color: '#94a3b8', 
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                Le Proviseur
              </span>
            </div>
          )}

          {schoolInfo.stampUrl && (
            <div style={{ 
              width: 22, 
              height: 22, 
              borderRadius: '50%', 
              overflow: 'hidden', 
              opacity: 0.85, 
              border: '0.5px solid rgba(0,0,0,0.05)' 
            }}>
              <img 
                src={schoolInfo.stampUrl} 
                alt="Cachet" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
