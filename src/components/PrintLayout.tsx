import React from 'react';
import { Student, SchoolInfo } from '../types';
import { IDCard } from './IDCard';
import { IDCardBack } from './IDCardBack';

interface PrintLayoutProps {
  students: Student[];
  schoolInfo: SchoolInfo;
  printMode?: 'recto' | 'recto-verso';
  cardsPerPage?: 8 | 10;
}

export const PrintLayout: React.FC<PrintLayoutProps> = React.memo(({ 
  students, 
  schoolInfo,
  printMode = 'recto',
  cardsPerPage = 10
}) => {
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

  return (
    <div className="print-container print-layout-container" style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '32px 0' }}>
      {pageBatches.map((pageStudents, pageIdx) => {
        const frontPage = (
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

        if (printMode === 'recto') {
          return frontPage;
        }

        // Recto-Verso Mode: generate the mirrored back page
        const backStudents = getBacksOrder(pageStudents);
        const backPage = (
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
