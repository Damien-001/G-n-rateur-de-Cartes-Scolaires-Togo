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

  const getBacksOrder = (pageStudents: Student[]) => {
    const ordered: (Student | null)[] = [];
    for (let r = 0; r < cardsPerPage; r += 2) {
      const left = pageStudents[r] || null;
      const right = pageStudents[r + 1] || null;
      // Mirror horizontally for back page (right card back goes to left column on print flip)
      ordered.push(right);
      ordered.push(left);
    }
    return ordered;
  };

  const rows = cardsPerPage / 2;

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
              padding: cardsPerPage === 10 ? '30px 22px' : '65px 22px', // Adjust margin for vertical centering
              boxSizing: 'border-box',
              position: 'relative',
              pageBreakAfter: 'always',
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: `repeat(${rows}, auto)`,
              gap: '20px 22px',
            }}>
              {pageStudents.map((student) => (
                <div key={`front-${student.id}`} style={{ display: 'flex', justifyContent: 'center' }}>
                  <IDCard student={student} schoolInfo={schoolInfo} />
                </div>
              ))}
              {Array.from({ length: cardsPerPage - pageStudents.length }).map((_, i) => (
                <div key={`empty-front-${i}`} style={{ width: 350, height: 198, visibility: 'hidden' }} />
              ))}
            </div>
          </div>
        );

        const frontPage = wrapWithScale(frontPageElement, `front-${pageIdx}`);

        if (printMode === 'recto') {
          return frontPage;
        }

        // Recto-Verso Mode: generate the mirrored back page
        const backStudents = getBacksOrder(pageStudents);
        const backPageElement = (
          <div
            key={`back-${pageIdx}`}
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
              padding: cardsPerPage === 10 ? '30px 22px' : '65px 22px',
              boxSizing: 'border-box',
              position: 'relative',
              pageBreakAfter: 'always',
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: `repeat(${rows}, auto)`,
              gap: '20px 22px',
            }}>
              {backStudents.map((student, i) => (
                <div key={`back-slot-${i}`} style={{ display: 'flex', justifyContent: 'center' }}>
                  {student ? (
                    <IDCardBack student={student} schoolInfo={schoolInfo} />
                  ) : (
                    <div style={{ width: 350, height: 198, visibility: 'hidden' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

        const backPage = wrapWithScale(backPageElement, `back-${pageIdx}`);

        return (
          <React.Fragment key={`page-pair-${pageIdx}`}>
            {frontPage}
            {backPage}
          </React.Fragment>
        );
      })}
    </div>
  );
});
