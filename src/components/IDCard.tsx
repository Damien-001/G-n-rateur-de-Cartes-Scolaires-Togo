import React from 'react';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS } from '../types';
import { QRGenerator } from './QRGenerator';
import { formatDateDisplay } from '../lib/utils';

interface IDCardProps {
  student: Student;
  schoolInfo: SchoolInfo;
  showCuttingMarks?: boolean;
}

export const IDCard: React.FC<IDCardProps> = React.memo(({ student, schoolInfo, showCuttingMarks = true }) => {
  const formatDate = (dateStr?: string) => {
    return formatDateDisplay(dateStr);
  };

  const colors = { ...DEFAULT_CARD_COLORS, ...schoolInfo.cardColors };

  const bgTemplate = colors.bgTemplate || 'guilloche';
  const bgOpacity = colors.bgOpacity !== undefined ? colors.bgOpacity / 100 : 0.04;

  const HEADER_BG = colors.headerBg;
  const HEADER_TEXT = colors.headerText;
  const FOOTER_BAR = colors.footerBar;
  const MATRICULE_COLOR = colors.matriculeText;
  const GRAY_LABEL = '#9ca3af';
  const GRAY_VALUE = '#1f2937';
  const GRAY_BG = '#f3f4f6';
  const GRAY_BORDER = '#d1d5db';

  const labelStyle = {
    fontSize: 5.5,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    fontWeight: '800',
    letterSpacing: '0.08em',
    marginBottom: 1.5,
    lineHeight: 1,
  };

  const valueStyle = {
    fontSize: 8.5,
    fontWeight: '800' as const,
    color: '#0f172a',
    lineHeight: 1.1,
  };

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      width: '350px',
      height: '198px',
      fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
      borderRadius: 10,
    }}>

      {/* Header */}
      <div style={{
        backgroundColor: HEADER_BG,
        color: HEADER_TEXT,
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        height: 48,
        boxSizing: 'border-box',
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1 }}>
          {schoolInfo.logoUrl ? (
            <img
              src={schoolInfo.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              style={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                borderRadius: 6,
                padding: 1.5,
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div style={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 6,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, color: HEADER_TEXT }}>🏫</span>
            </div>
          )}
          <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <div style={{
              fontSize: 8.5,
              fontWeight: '900',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: HEADER_TEXT,
              letterSpacing: '0.01em',
            }}>
              {schoolInfo.name}
            </div>
            <div style={{ 
              fontSize: 6.5, 
              opacity: 0.85, 
              color: HEADER_TEXT,
              fontWeight: '700',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}>
              RÉPUBLIQUE TOGOLAISE
            </div>
          </div>
        </div>
        
        {/* Année Scolaire Badge */}
        <div style={{ 
          textAlign: 'right',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
        }}>
          <div style={{
            fontSize: 7,
            fontWeight: '900',
            color: HEADER_TEXT,
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: '1.5px 6px',
            letterSpacing: '0.04em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}>
            Carte d'élève
          </div>
          <div style={{ 
            fontSize: 7.5, 
            fontWeight: '800', 
            color: HEADER_TEXT,
            whiteSpace: 'nowrap',
            opacity: 0.9,
            letterSpacing: '0.02em',
          }}>
            A.S. {student.schoolYear}
          </div>
        </div>
      </div>

      {/* Official Togo Flag Strip separator with diagonal security lines overlay */}
      <div style={{
        display: 'flex',
        height: 4,
        width: '100%',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        zIndex: 2,
      }}>
        {/* Red Canton with white star */}
        <div style={{
          width: 24,
          height: 4,
          backgroundColor: '#d21034',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 10 10" width="3.2" height="3.2" fill="#ffffff">
            <polygon points="5,1 6,4 9,4 7,6 8,9 5,7 2,9 3,6 1,4 4,4" />
          </svg>
        </div>
        {/* 5 Alternating stripes */}
        <div style={{
          flex: 1,
          height: 4,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ flex: 1, backgroundColor: '#006a4e' }} />
          <div style={{ flex: 1, backgroundColor: '#ffc72c' }} />
          <div style={{ flex: 1, backgroundColor: '#006a4e' }} />
          <div style={{ flex: 1, backgroundColor: '#ffc72c' }} />
          <div style={{ flex: 1, backgroundColor: '#006a4e' }} />
        </div>
      </div>

      {/* Body Area */}
      <div style={{
        position: 'relative',
        display: 'flex',
        gap: 10,
        padding: '8px 10px',
        height: 142,
        boxSizing: 'border-box',
        flex: 1,
      }}>

        {/* Background Guilloché & Watermark Patterns */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {/* Guilloche Template */}
          {bgTemplate === 'guilloche' && (
            <svg width="100%" height="100%" opacity={bgOpacity} stroke={HEADER_BG} fill="none">
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
              <circle cx="0" cy="0" r="100" stroke={HEADER_BG} strokeWidth="1" />
              <circle cx="0" cy="0" r="95" stroke={HEADER_BG} strokeWidth="0.5" strokeDasharray="1,2" />
              <circle cx="350" cy="142" r="80" stroke={HEADER_BG} strokeWidth="1" />
              <circle cx="350" cy="142" r="75" stroke={HEADER_BG} strokeWidth="0.5" strokeDasharray="1,2" />
            </svg>
          )}

          {/* Central Watermark (rendered if not minimal) */}
          {bgTemplate !== 'minimal' && (
            <svg viewBox="0 0 120 120" style={{
              position: 'absolute',
              top: '55%',
              left: '52%',
              transform: 'translate(-50%, -50%)',
              width: '94px',
              height: '94px',
              opacity: bgOpacity * 0.8,
              color: HEADER_BG,
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

        {/* Left Column: Photo + Matricule */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 68,
          flexShrink: 0,
          zIndex: 1,
        }}>
          {/* Photo frame with double-bezel borders */}
          <div style={{
            width: 68,
            height: 80,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: 2,
            boxSizing: 'border-box',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f1f5f9',
            }}>
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt="Student"
                  crossOrigin="anonymous"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
          </div>

          {/* Monospace Matricule badge */}
          <div style={{
            fontSize: 6.5,
            fontWeight: '800',
            color: MATRICULE_COLOR,
            backgroundColor: `${MATRICULE_COLOR}12`,
            border: `1px solid ${MATRICULE_COLOR}25`,
            borderRadius: 4,
            padding: '3px 4px',
            letterSpacing: '0.05em',
            textAlign: 'center',
            lineHeight: 1,
            width: 68,
            boxSizing: 'border-box',
            marginTop: 5,
            fontFamily: "'Courier New', Courier, monospace",
            textTransform: 'uppercase',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}>
            {student.matricule}
          </div>
        </div>

        {/* Middle Column: Details Grid */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
          zIndex: 1,
        }}>
          <div>
            {/* Student Name field */}
            <div style={{ marginBottom: 3 }}>
              <div style={labelStyle}>Nom</div>
              <div style={{
                fontSize: 10,
                fontWeight: '900',
                color: '#0f172a',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {student.lastName}
              </div>
              <div style={{ ...labelStyle, marginTop: 2 }}>Prénoms</div>
              <div style={{
                fontSize: 9.5,
                fontWeight: '800',
                color: '#1e293b',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {student.firstName}
              </div>
            </div>

            {/* Inner Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.1fr',
              gap: '4px 6px',
            }}>
              {/* Classe */}
              <div>
                <div style={labelStyle}>Classe</div>
                <div style={valueStyle}>{student.className}</div>
              </div>
              
              {/* Centre d'examen */}
              <div>
                <div style={labelStyle}>Centre d'examen</div>
                <div style={{
                  ...valueStyle,
                  fontSize: 7.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }} title={student.examCenter || '----'}>
                  {student.examCenter || '----'}
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <div style={labelStyle}>Né(e) le</div>
                <div style={valueStyle}>{formatDate(student.birthDate)}</div>
              </div>
              
              {/* Lieu de naissance */}
              <div>
                <div style={labelStyle}>À (Lieu)</div>
                <div style={{
                  ...valueStyle,
                  fontSize: 7.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }} title={student.birthPlace || '----'}>
                  {student.birthPlace || '----'}
                </div>
              </div>
            </div>
          </div>

          {/* Secure Barcode area at bottom of details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <svg viewBox="0 0 100 20" style={{ width: 75, height: 13, opacity: 0.8 }}>
                <rect x="0" width="2.5" height="20" fill="#000" />
                <rect x="4" width="1" height="20" fill="#000" />
                <rect x="6" width="3" height="20" fill="#000" />
                <rect x="11" width="1" height="20" fill="#000" />
                <rect x="13" width="2" height="20" fill="#000" />
                <rect x="16" width="4.5" height="20" fill="#000" />
                <rect x="22" width="1" height="20" fill="#000" />
                <rect x="24" width="2" height="20" fill="#000" />
                <rect x="27" width="3.5" height="20" fill="#000" />
                <rect x="32" width="1" height="20" fill="#000" />
                <rect x="34" width="4" height="20" fill="#000" />
                <rect x="39" width="2" height="20" fill="#000" />
                <rect x="42" width="1" height="20" fill="#000" />
                <rect x="44" width="3" height="20" fill="#000" />
                <rect x="49" width="1" height="20" fill="#000" />
                <rect x="52" width="2.5" height="20" fill="#000" />
                <rect x="56" width="4" height="20" fill="#000" />
                <rect x="61" width="1" height="20" fill="#000" />
                <rect x="63" width="2" height="20" fill="#000" />
                <rect x="66" width="3.5" height="20" fill="#000" />
                <rect x="71" width="1" height="20" fill="#000" />
                <rect x="73" width="4" height="20" fill="#000" />
                <rect x="78" width="2" height="20" fill="#000" />
                <rect x="81" width="1" height="20" fill="#000" />
                <rect x="83" width="3" height="20" fill="#000" />
                <rect x="88" width="1.5" height="20" fill="#000" />
                <rect x="91" width="2" height="20" fill="#000" />
                <rect x="94" width="4" height="20" fill="#000" />
                <rect x="99" width="1" height="20" fill="#000" />
              </svg>
              <div style={{ fontSize: 4.5, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: 0.5, textAlign: 'center', marginTop: 1, lineHeight: 1 }}>
                * {student.matricule || 'STUDENT'} *
              </div>
            </div>
            
            {/* Dynamic Security QR Code & Micro Hologram */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <QRGenerator value={student.matricule || 'PREVIEW'} size={25} fgColor="#0f172a" />
              
              {/* Micro Hologram sticker next to it */}
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff0077 0%, #00ffcc 50%, #ffcc00 100%)',
                opacity: 0.65,
                border: '0.75px solid rgba(255,255,255,0.8)',
                boxShadow: '0 0.5px 1.5px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{ fontSize: 4.5, fontWeight: '900', color: '#ffffff', transform: 'rotate(-15deg)', fontFamily: 'sans-serif', textShadow: '0 0.5px 0.5px rgba(0,0,0,0.2)' }}>RT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expiration, Stamp & Signature */}
        <div style={{
          width: 78,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '1px dashed #e2e8f0',
          paddingLeft: 6,
          boxSizing: 'border-box',
          zIndex: 1,
        }}>
          {/* Expiration date as a green security badge */}
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ ...labelStyle, textAlign: 'center' }}>Expire le</div>
            <div style={{
              fontSize: 7.5,
              fontWeight: '800',
              color: '#047857',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 12,
              padding: '2px 4px',
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box',
              marginTop: 1,
              lineHeight: 1,
            }}>
              {student.expirationDate ? formatDate(student.expirationDate) : '----'}
            </div>
          </div>

          {/* Cachet stamp location */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ fontSize: 5, fontStyle: 'italic', color: '#94a3b8', fontWeight: '800', marginBottom: 1, lineHeight: 1 }}>CACHET</div>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '1px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {schoolInfo.stampUrl ? (
                <img
                  src={schoolInfo.stampUrl}
                  alt="Cachet"
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: 0.95,
                  }}
                />
              ) : (
                <div style={{
                  fontSize: 7,
                  color: '#cbd5e1',
                  textAlign: 'center',
                  lineHeight: 1,
                  fontFamily: 'monospace',
                }}>
                  SEAL
                </div>
              )}
            </div>
          </div>

          {/* Signature Proviseur */}
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 5, fontStyle: 'italic', color: '#94a3b8', fontWeight: '800', lineHeight: 1 }}>LE PROVISEUR</div>
            <div style={{
              height: 18,
              width: '100%',
              borderBottom: '1px solid #f1f5f9',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}>
              {schoolInfo.signatureUrl && (
                <img
                  src={schoolInfo.signatureUrl}
                  alt="Signature"
                  crossOrigin="anonymous"
                  style={{
                    position: 'absolute',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    opacity: 0.95,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: FOOTER_BAR,
        zIndex: 2,
      }} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.student.id === nextProps.student.id &&
    prevProps.student.firstName === nextProps.student.firstName &&
    prevProps.student.lastName === nextProps.student.lastName &&
    prevProps.student.matricule === nextProps.student.matricule &&
    prevProps.student.className === nextProps.student.className &&
    prevProps.student.schoolYear === nextProps.student.schoolYear &&
    prevProps.student.birthDate === nextProps.student.birthDate &&
    prevProps.student.birthPlace === nextProps.student.birthPlace &&
    prevProps.student.examCenter === nextProps.student.examCenter &&
    prevProps.student.photoUrl === nextProps.student.photoUrl &&
    prevProps.student.expirationDate === nextProps.student.expirationDate &&
    prevProps.schoolInfo.name === nextProps.schoolInfo.name &&
    prevProps.schoolInfo.logoUrl === nextProps.schoolInfo.logoUrl &&
    prevProps.schoolInfo.signatureUrl === nextProps.schoolInfo.signatureUrl &&
    prevProps.schoolInfo.stampUrl === nextProps.schoolInfo.stampUrl &&
    JSON.stringify(prevProps.schoolInfo.cardColors) === JSON.stringify(nextProps.schoolInfo.cardColors) &&
    prevProps.showCuttingMarks === nextProps.showCuttingMarks
  );
});
