import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Student, SchoolInfo } from '../types';
import { User, School, GraduationCap, MapPin, QrCode } from 'lucide-react';

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
        // Assume YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  // Dimensions are calculated in CSS (mm)
  return (
    <div className="relative bg-white border border-gray-200 overflow-hidden print:border-gray-300" 
         style={{ width: '92.5mm', height: '52.4mm' }}>
      
      {/* Cutting Marks */}
      {showCuttingMarks && (
        <>
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-3 h-[0.1mm] bg-black -translate-x-1" />
          <div className="absolute top-0 left-0 w-[0.1mm] h-3 bg-black -translate-y-1" />
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-3 h-[0.1mm] bg-black translate-x-1" />
          <div className="absolute top-0 right-0 w-[0.1mm] h-3 bg-black -translate-y-1" />
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-3 h-[0.1mm] bg-black -translate-x-1" />
          <div className="absolute bottom-0 left-0 w-[0.1mm] h-3 bg-black translate-y-1" />
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-3 h-[0.1mm] bg-black translate-x-1" />
          <div className="absolute bottom-0 right-0 w-[0.1mm] h-3 bg-black translate-y-1" />
        </>
      )}

      {/* Header */}
      <div className="bg-[#047857] text-[#ffffff] p-1 flex items-center gap-2 h-[12mm]">
        {schoolInfo.logoUrl && (
          <img 
            src={schoolInfo.logoUrl} 
            alt="Logo" 
            className="w-8 h-8 object-contain bg-[#ffffff] rounded-sm p-0.5"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        )}
        <div className="flex-1 overflow-hidden">
          <h2 className="text-[8pt] font-bold uppercase leading-tight truncate">
            {schoolInfo.name}
          </h2>
          <p className="text-[6pt] opacity-90">RÉPUBLIQUE TOGOLAISE</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-[3mm] flex gap-[4mm] h-[40.4mm]">
        {/* Photo & QR */}
        <div className="flex flex-col gap-[1.5mm] items-center w-[24mm] shrink-0">
          <div className="w-[22mm] h-[26mm] bg-[#f3f4f6] border border-[#d1d5db] flex items-center justify-center overflow-hidden rounded-sm">
            {student.photoUrl ? (
              <img 
                src={student.photoUrl} 
                alt="Student" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            ) : (
              <User className="w-10 h-10 text-[#d1d5db]" />
            )}
          </div>
          <div className="text-[6.5pt] font-bold text-[#065f46] leading-none tracking-wider">
            {student.matricule}
          </div>
          
          {/* QR Code */}
          <div className="bg-[#ffffff] p-[0.5mm] border border-[#f3f4f6] mt-auto">
            <QRCodeSVG 
              value={student.qrCodeData || `${student.matricule}-${student.lastName}`}
              size={28}
              level="L"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="space-y-[2mm]">
            <div>
              <p className="text-[5pt] text-[#9ca3af] uppercase font-bold leading-none mb-[0.5mm]">Nom & Prénoms</p>
              <p className="text-[9.5pt] font-bold text-[#111827] leading-tight uppercase">
                {student.lastName} {student.firstName}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-[2mm]">
              <div>
                <p className="text-[5pt] text-[#9ca3af] uppercase font-bold leading-none mb-[0.5mm]">Classe</p>
                <p className="text-[7.5pt] font-semibold text-[#1f2937]">{student.className}</p>
              </div>
              <div>
                <p className="text-[5pt] text-[#9ca3af] uppercase font-bold leading-none mb-[0.5mm]">Année Scolaire</p>
                <p className="text-[7.5pt] font-semibold text-[#1f2937]">{student.schoolYear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[2mm]">
              <div>
                <p className="text-[5pt] text-[#9ca3af] uppercase font-bold leading-none mb-[0.5mm]">Né(e) le</p>
                <p className="text-[7.5pt] font-semibold text-[#1f2937]">{formatDate(student.birthDate)}</p>
              </div>
              <div>
                <p className="text-[5pt] text-[#9ca3af] uppercase font-bold leading-none mb-[0.5mm]">à</p>
                <p className="text-[7.5pt] font-semibold text-[#1f2937] truncate">{student.birthPlace || '----'}</p>
              </div>
            </div>

            {student.examCenter && (
              <div>
                <p className="text-[5pt] text-[#9ca3af] uppercase font-bold leading-none mb-[0.5mm]">Centre d'examen</p>
                <p className="text-[7pt] font-semibold text-[#1f2937] truncate leading-tight">{student.examCenter}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end items-end">
            {/* Signature/Stamp Placeholder */}
            <div className="text-right">
               <p className="text-[5pt] italic text-[#9ca3af] mb-[0.5mm]">Le Proviseur</p>
               <div className="h-[8mm] w-[18mm] border-b border-[#e5e7eb] relative">
                 {schoolInfo.signatureUrl && (
                   <img 
                    src={schoolInfo.signatureUrl} 
                    alt="Signature" 
                    className="absolute inset-0 w-full h-full object-contain opacity-90"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                   />
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#059669]" />
    </div>
  );
};
