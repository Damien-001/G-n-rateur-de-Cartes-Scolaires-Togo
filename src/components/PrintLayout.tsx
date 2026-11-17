import React, { useState, useEffect } from 'react';
import { Student, SchoolInfo } from '../types';
import { IDCard } from './IDCard';
import { IDCardBack } from './IDCardBack';

interface PrintLayoutProps {
  students: Student[];
  schoolInfo: SchoolInfo;
  printMode?: 'recto' | 'recto-verso';
  cardsPerPage?: 8 | 10;
  fitToScreen?: boolean;
}

export const PrintLayout: React.FC<PrintLayoutProps> = React.memo(({ 
  students, 
  schoolInfo,
  printMode = 'recto',
  cardsPerPage = 10,
  fitToScreen = true
}) => {
  // Calcul dynamique de l'échelle d'affichage mobile
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sur mobile et tablette, calculer la largeur utile (en tenant compte de la barre latérale à partir de 768px)
  const availableContentWidth = windowWidth >= 768 ? windowWidth - 110 : windowWidth - 20;
  const needsScaling = availableContentWidth < 810;
  const autoScale = (needsScaling && fitToScreen) 
    ? Math.min(1, Math.max(0.32, availableContentWidth / 794)) 
    : 1;

  // Split students into pages based on cardsPerPage
  const pageBatches: Student[][] = [];
  for (let i = 0; i < students.length; i += cardsPerPage) {
    pageBatches.push(students.slice(i, i + cardsPerPage));
  }

  const rows = cardsPerPage / 2;

  const referenceStudent: Student = students[0] || ({ schoolYear: schoolInfo.academicYear || '2025-2026' } as Student);

  const commonBackPageElement = (
    <div
      key="back-common-0"
      className="a4-page print-page"
      style={{
        width: 794,
        height: 1123,
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        margin: '0 auto 32px auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: cardsPerPage === 10 ? '16px 22px' : '65px 22px',
        boxSizing: 'border-box',
        position: 'relative',
        pageBreakAfter: 'always',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: `repeat(${rows}, auto)`,
        gap: cardsPerPage === 10 ? '16px 22px' : '20px 22px',
      }}>
        {Array.from({ length: cardsPerPage }).map((_, i) => (
          <div key={`common-back-slot-${i}`} style={{ display: 'flex', justifyContent: 'center' }}>
            <IDCardBack student={referenceStudent} schoolInfo={schoolInfo} />
          </div>
        ))}
      </div>
    </div>
  );

  const wrapWithScale = (pageEl: React.ReactElement, key: string) => {
    if (autoScale < 1) {
      return (
        <div
          key={`scaled-wrapper-${key}`}
          className="a4-page-scale-wrapper"
          style={{
            width: Math.round(794 * autoScale),
            height: Math.round(1123 * autoScale),
            margin: '0 auto 20px auto',
            position: 'relative',
            overflow: 'visible',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${autoScale})`,
              transformOrigin: 'top left',
              width: 794,
              height: 1123,
            }}
          >
            {pageEl}
          </div>
        </div>
      );
    }
    return pageEl;
  };

  return (
    <div className="print-container print-layout-container" style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: autoScale < 1 ? '12px 0 40px 0' : '32px 0' }}>
      {/* 1. Toutes les planches Recto (élèves) */}
      {pageBatches.map((pageStudents, pageIdx) => {
        const frontPageElement = (
          <div
            key={`front-${pageIdx}`}
            className="a4-page print-page"
            style={{
              width: 794,
              height: 1123,
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              margin: '0 auto 32px auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              padding: cardsPerPage === 10 ? '16px 22px' : '65px 22px', // Centrage vertical pour 10 cartes
              boxSizing: 'border-box',
              position: 'relative',
              pageBreakAfter: 'always',
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: `repeat(${rows}, auto)`,
              gap: cardsPerPage === 10 ? '16px 22px' : '20px 22px',
            }}>
              {pageStudents.map((student) => (
                <div key={`front-${student.id}`} style={{ display: 'flex', justifyContent: 'center' }}>
                  <IDCard student={student} schoolInfo={schoolInfo} />
                </div>
              ))}
              {Array.from({ length: cardsPerPage - pageStudents.length }).map((_, i) => (
                <div key={`empty-front-${i}`} style={{ width: 350, height: 205, visibility: 'hidden' }} />
              ))}
            </div>
          </div>
        );

        return wrapWithScale(frontPageElement, `front-${pageIdx}`);
      })}

      {/* 2. Page Verso Unique (Commune à tous les élèves en mode Recto-Verso) */}
      {printMode === 'recto-verso' && students.length > 0 && (
        <React.Fragment key="single-common-verso-wrapper">
          <div className="no-print my-6 text-center">
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs">
              📄 Page Verso Unique (Commune à tous les élèves — à imprimer au dos de toutes les planches recto)
            </span>
          </div>
          {wrapWithScale(commonBackPageElement, 'common-back')}
        </React.Fragment>
      )}
    </div>
  );
});
