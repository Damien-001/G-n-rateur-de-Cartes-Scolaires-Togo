import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS } from '../types';

interface IDCardProps {
  student: Student;
  schoolInfo: SchoolInfo;
  showCuttingMarks?: boolean;
}

export const IDCard: React.FC<IDCardProps> = ({ student, schoolInfo, showCuttingMarks = true }) => {
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
        gap: 8,
        height: 46,
        boxSizing: 'border-box',
      }}>
        {schoolInfo.logoUrl ? (
          <img
            src={schoolInfo.logoUrl}
            alt="Logo"
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

      {/* Body */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '8px 10px',
        height: 148,
        boxSizing: 'border-box',
      }}>

        {/* Left column: photo + matricule + QR */}
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
          }}>
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt="Student"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

          {/* QR Code */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: 1,
            border: `1px solid ${GRAY_BG}`,
            marginTop: 'auto',
          }}>
            <QRCodeCanvas
              value={student.qrCodeData || `${student.matricule}-${student.lastName}`}
              size={32}
              level="L"
            />
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
          <div>
            {/* Nom & Prénoms */}
            <div style={{ marginBottom: 6 }}>
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

            {/* Classe + Année */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
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
                  Année Scolaire
                </div>
                <div style={{ fontSize: 9, fontWeight: '600', color: GRAY_VALUE }}>
                  {student.schoolYear}
                </div>
              </div>
            </div>

            {/* Né(e) le + Lieu */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                  Né(e) le
                </div>
                <div style={{ fontSize: 9, fontWeight: '600', color: GRAY_VALUE }}>
                  {formatDate(student.birthDate)}
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
                }}>
                  {student.birthPlace || '----'}
                </div>
              </div>
            </div>

            {/* Centre d'examen */}
            {student.examCenter && (
              <div>
                <div style={{ fontSize: 6, color: GRAY_LABEL, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 1, letterSpacing: 0.3 }}>
                  Centre d'examen
                </div>
                <div style={{
                  fontSize: 8,
                  fontWeight: '600',
                  color: GRAY_VALUE,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {student.examCenter}
                </div>
              </div>
            )}
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
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
};
