import React from 'react';
import { Student, SchoolInfo, PRINT_CONFIG } from '../types';
import { IDCard } from './IDCard';

interface PrintLayoutProps {
  students: Student[];
  schoolInfo: SchoolInfo;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ students, schoolInfo }) => {
  // Chunk students into groups of 10 (one page each)
  const pages = [];
  for (let i = 0; i < students.length; i += 10) {
    pages.push(students.slice(i, i + 10));
  }

  return (
    <div className="print-container bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white">
      {pages.map((pageStudents, pageIdx) => (
        <div 
          key={pageIdx}
          className="a4-page bg-white shadow-2xl mx-auto mb-8 relative print:shadow-none print:mb-0 print:break-after-page"
          style={{
            width: `${PRINT_CONFIG.paperWidth}mm`,
            height: `${PRINT_CONFIG.paperHeight}mm`,
            padding: `${PRINT_CONFIG.margin}mm`,
          }}
        >
          {/* Grid Layout */}
          <div 
            className="grid grid-cols-2 grid-rows-5 h-full"
            style={{
              gap: `${PRINT_CONFIG.spacing}mm`,
            }}
          >
            {pageStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-center">
                <IDCard student={student} schoolInfo={schoolInfo} />
              </div>
            ))}
            
            {/* Fill empty slots to maintain grid structure if needed */}
            {Array.from({ length: 10 - pageStudents.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-center opacity-0">
                <div style={{ width: '92.5mm', height: '52.4mm' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
