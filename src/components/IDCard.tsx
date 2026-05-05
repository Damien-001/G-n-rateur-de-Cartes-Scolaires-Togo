import React from 'react';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS } from '../types';

interface IDCardProps {
  student: Student;
  schoolInfo: SchoolInfo;
  showCuttingMarks?: boolean;
}

export const IDCard: React.FC<IDCardProps> = React.memo(({ student, schoolInfo, showCuttingMarks = true }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '----';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  const colors = { ...DEFAULT_CARD_COLORS, ...schoolInfo.cardColors };

  const HEADER_BG = colors.headerBg;
  const HEADER_TEXT = colors.headerText;
  const FOOTER_BAR = colors.footerBar;
  const MATRICULE_COLOR = colors.matriculeText;
  const GRAY_LABEL = '#9ca3af';
  const GRAY_VALUE = '#1f2937';
  const GRAY_BG = '#f3f4f6';
  const GRAY_BORDER = '#d1d5db';

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#ffffff',
      border: '1px solid #d1d5db',
      overflow: 'hidden',
      width: '350px',
      height: '198px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      boxSizing: 'border-box',
    }}>

      {/* Cutting marks */}
      {showCuttingMarks && (
        <>
          <div style={{ position: 'absolute', top: 0, left: -4, width: 10, height: 1, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', top: -4, left: 0, width: 1, height: 10, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', top: 0, right: -4, width: 10, height: 1, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', top: -4, right: 0, width: 1, height: 10, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', bottom: 0, left: -4, width: 10, height: 1, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', bottom: -4, left: 0, width: 1, height: 10, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', bottom: 0, right: -4, width: 10, height: 1, backgroundColor: '#000' }} />
          <div style={{ position: 'absolute', bottom: -4, right: 0, width: 1, height: 10, backgroundColor: '#000' }} />
        </>
      )}

      {/* Header */}
      <div style={{
        backgroundColor: HEADER_BG,
        color: HEADER_TEXT,
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        height: 46,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
          {schoolInfo.logoUrl ? (
            <img
              src={schoolInfo.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              style={{
                width: 34,
                height: 34,
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                borderRadius: 3,
                padding: 2,
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: 34,
              height: 34,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 3,
              flexShrink: 0,
            }} />
          )}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: 10,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: HEADER_TEXT,
            }}>
              {schoolInfo.name}
            </div>
            <div style={{ fontSize: 8, opacity: 0.9, color: HEADER_TEXT }}>
              RÉPUBLIQUE TOGOLAISE
            </div>
          </div>
        </div>
        
        {/* Année Scolaire */}
        <div style={{ 
          textAlign: 'right',
          flexShrink: 0,
          paddingRight: 4,
        }}>
          <div style={{ 
            fontSize: 7, 
            opacity: 0.85, 
            color: HEADER_TEXT,
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: 0.3,
            marginBottom: 1,
          }}>
            Année Scolaire
          </div>
          <div style={{ 
            fontSize: 9, 
            fontWeight: 'bold', 
            color: HEADER_TEXT,
            whiteSpace: 'nowrap',
          }}>
            {student.schoolYear}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '8px 10px',
        height: 148,
        boxSizing: 'border-box',
      }}>

        {/* Left column: photo + matricule */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: 72,
          flexShrink: 0,
        }}>
          {/* Photo */}
          <div style={{
            width: 68,
            height: 82,
            backgroundColor: GRAY_BG,
            border: `1px solid ${GRAY_BORDER}`,
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
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
                  objectPosition: 'center',
                }}
              />
            ) : (
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke={GRAY_BORDER} strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>

          {/* Matricule */}
          <div style={{
            fontSize: 7,
            fontWeight: 'bold',
            color: MATRICULE_COLOR,
            letterSpacing: 0.5,
            textAlign: 'center',
            lineHeight: 1,
          }}>
            {student.matricule}
          </div>
        </div>

        {/* Right column: info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {/* Colonnes 1 et 2 : Toutes les infos */}
            <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Nom & Prénoms */}
              <div style={{ marginBottom: 0 }}>
                <div style={{
                  fontSize: 6,
                  color: GRAY_LABEL,
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  marginBottom: 1,
                  letterSpacing: 0.3,
                }}>
                  Noms et Prénoms
                </div>
                <div style={{
                  fontSize: 13,
                  fontWeight: 'bold',
                  color: '#111827',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {student.lastName} {student.firstName}
                </div>
              </div>

              {/* Ligne 1: Classe + Centre d'examen */}
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                    Classe
                  </div>
                  <div style={{ fontSize: 9, fontWeight: '600', color: GRAY_VALUE }}>
                    {student.className}
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                    Centre d'examen
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: '600',
                    color: GRAY_VALUE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {student.examCenter || '----'}
                  </div>
                </div>
              </div>

              {/* Ligne 2: Né(e) le + Lieu */}
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                    Né(e) le
                  </div>
                  <div style={{ fontSize: 9, fontWeight: '600', color: GRAY_VALUE, marginBottom: 3 }}>
                    {formatDate(student.birthDate)}
                  </div>
                  
                  {/* Signature sous la date de naissance */}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 6, fontStyle: 'italic', color: GRAY_LABEL, marginBottom: 2 }}>
                      Le Proviseur
                    </div>
                    <div style={{
                      height: 24,
                      width: 60,
                      borderBottom: '1px solid #e5e7eb',
                      position: 'relative',
                    }}>
                      {schoolInfo.signatureUrl && (
                        <img
                          src={schoolInfo.signatureUrl}
                          alt="Signature"
                          crossOrigin="anonymous"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            opacity: 0.9,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                    à
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: '600',
                    color: GRAY_VALUE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 3,
                  }}>
                    {student.birthPlace || '----'}
                  </div>
                  
                  {/* Date d'expiration sous le lieu de naissance */}
                  <div>
                    <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                      Expire le
                    </div>
                    <div style={{
                      fontSize: 9,
                      fontWeight: '600',
                      color: GRAY_VALUE,
                    }}>
                      {student.expirationDate ? formatDate(student.expirationDate) : '----'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 3: Cachet sur toute la hauteur (3 lignes) */}
            <div style={{ flex: '0 0 40%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 6, fontStyle: 'italic', color: GRAY_LABEL, marginBottom: 2 }}>
                  Cachet
                </div>
                <div style={{
                  height: 60,
                  width: 60,
                  border: '1px dashed #e5e7eb',
                  borderRadius: '50%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                        opacity: 0.9,
                      }}
                    />
                  ) : (
                    <div style={{
                      fontSize: 14,
                      color: GRAY_BORDER,
                      textAlign: 'center',
                      lineHeight: 1,
                    }}>
                      ○
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer green bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: FOOTER_BAR,
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
