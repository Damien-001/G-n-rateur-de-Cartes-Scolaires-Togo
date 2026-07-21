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

  const bgTemplate = currentColors.bgTemplate || 'guilloche';
  const bgOpacity = currentColors.bgOpacity !== undefined ? currentColors.bgOpacity / 100 : 0.04;

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
      {/* Background Guilloché & Watermark Patterns */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Guilloche Template */}
        {bgTemplate === 'guilloche' && (
          <svg width="100%" height="100%" opacity={bgOpacity} stroke={currentColors.headerBg} fill="none">
            <path d="M 0,15 Q 30,5 60,15 T 120,15 T 180,15 T 240,15 T 300,15 T 360,15" strokeWidth="0.5" />
            <path d="M 0,35 Q 30,25 60,35 T 120,35 T 180,35 T 240,35 T 300,35 T 360,35" strokeWidth="0.5" />
            <path d="M 0,55 Q 30,45 60,55 T 120,55 T 180,55 T 240,55 T 300,55 T 360,55" strokeWidth="0.5" />
            <path d="M 0,75 Q 30,65 60,75 T 120,75 T 180,75 T 240,75 T 300,75 T 360,75" strokeWidth="0.5" />
            <path d="M 0,95 Q 30,85 60,95 T 120,95 T 180,95 T 240,95 T 300,95 T 360,95" strokeWidth="0.5" />
            <path d="M 0,115 Q 30,105 60,115 T 120,115 T 180,115 T 240,115 T 300,115 T 360,115" strokeWidth="0.5" />
            <path d="M 0,135 Q 30,125 60,135 T 120,135 T 180,135 T 240,135 T 300,135 T 360,135" strokeWidth="0.5" />
          </svg>
        )}

        {/* Flag Template */}
        {bgTemplate === 'flag' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,106,78,0.3) 0%, rgba(255,198,30,0.3) 50%, rgba(210,16,52,0.3) 100%)',
            opacity: bgOpacity * 1.5,
            width: '100%',
            height: '100%'
          }} />
        )}

        {/* Geometric Template */}
        {bgTemplate === 'geometric' && (
          <svg width="100%" height="100%" opacity={bgOpacity * 1.2} fill="none">
            <circle cx="0" cy="0" r="100" stroke={currentColors.headerBg} strokeWidth="1" />
            <circle cx="0" cy="0" r="95" stroke={currentColors.headerBg} strokeWidth="0.5" strokeDasharray="1,2" />
            <circle cx="350" cy="142" r="80" stroke={currentColors.headerBg} strokeWidth="1" />
            <circle cx="350" cy="142" r="75" stroke={currentColors.headerBg} strokeWidth="0.5" strokeDasharray="1,2" />
          </svg>
        )}

        {/* Central Watermark (rendered if not minimal) */}
        {bgTemplate !== 'minimal' && (
          <svg viewBox="0 0 120 120" style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '94px',
            height: '94px',
            opacity: bgOpacity * 0.8,
            color: currentColors.headerBg,
          }}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M45,45 Q60,40 75,45 Q78,65 60,85 Q42,65 45,45 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="60,46 62,52 68,52 63,56 65,62 60,58 55,62 57,56 52,52 58,52" fill="currentColor" />
            <text x="60" y="74" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="monospace" fill="currentColor">RT</text>
            <path d="M36,50 Q28,68 44,84" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1.5" />
            <path d="M84,50 Q92,68 76,84" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1.5" />
            <line x1="15" y1="60" x2="25" y2="60" stroke="currentColor" strokeWidth="0.5" />
            <line x1="95" y1="60" x2="105" y2="60" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        )}
      </div>

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
