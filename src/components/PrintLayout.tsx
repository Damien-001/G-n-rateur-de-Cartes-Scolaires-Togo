import React from 'react';
import { Student, SchoolInfo } from '../types';
import { IDCard } from './IDCard';

interface PrintLayoutProps {
  students: Student[];
  schoolInfo: SchoolInfo;
}

// A4 at 96dpi: 794px × 1123px
// Card size: 350px × 198px
// 2 columns, 5 rows = 10 cards per page
// Horizontal margin: (794 - 2*350) / 3 = ~31px gap between/around
// Vertical margin: (1123 - 5*198) / 6 = ~30px gap between/around

export const PrintLayout: React.FC<PrintLayoutProps> = ({ students, schoolInfo }) => {
  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += 10) {
    pages.push(students.slice(i, i + 10));
  }

  return (
    <div className="print-container" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: 32 }}>
      {pages.map((pageStudents, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page"
          style={{
            width: 794,
            minHeight: 1123,
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
            margin: '0 auto 32px auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '30px 22px',
            boxSizing: 'border-box',
            gap: 0,
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'repeat(5, auto)',
            gap: '20px 22px',
          }}>
            {pageStudents.map((student) => (
              <div key={student.id} style={{ display: 'flex', justifyContent: 'center' }}>
                <IDCard student={student} schoolInfo={schoolInfo} />
              </div>
            ))}
            {Array.from({ length: 10 - pageStudents.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ width: 350, height: 198, visibility: 'hidden' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
