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
      <div className="bg-emerald-700 text-white p-1 flex items-center gap-2 h-[12mm]">
        {schoolInfo.logoUrl && (
          <img 
            src={schoolInfo.logoUrl} 
            alt="Logo" 
            className="w-8 h-8 object-contain bg-white rounded-sm p-0.5"
            referrerPolicy="no-referrer"
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
      <div className="p-2 flex gap-3 h-[40.4mm]">
        {/* Photo */}
        <div className="flex flex-col gap-1 items-center">
          <div className="w-[22mm] h-[28mm] bg-gray-100 border border-gray-300 flex items-center justify-center overflow-hidden">
            {student.photoUrl ? (
              <img 
                src={student.photoUrl} 
                alt="Student" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="text-[6pt] font-bold text-emerald-800">
            {student.matricule}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div className="space-y-1">
            <div>
              <p className="text-[5pt] text-gray-500 uppercase font-bold">Nom & Prénoms</p>
              <p className="text-[9pt] font-bold text-gray-900 leading-tight">
                {student.lastName} {student.firstName}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-1">
              <div>
                <p className="text-[5pt] text-gray-500 uppercase font-bold">Classe</p>
                <p className="text-[7pt] font-semibold">{student.className}</p>
              </div>
              <div>
                <p className="text-[5pt] text-gray-500 uppercase font-bold">Année Scolaire</p>
                <p className="text-[7pt] font-semibold">{student.schoolYear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <div>
                <p className="text-[5pt] text-gray-500 uppercase font-bold">Né(e) le</p>
                <p className="text-[7pt] font-semibold">{student.birthDate || '----'}</p>
              </div>
              <div>
                <p className="text-[5pt] text-gray-500 uppercase font-bold">à</p>
                <p className="text-[7pt] font-semibold truncate">{student.birthPlace || '----'}</p>
              </div>
            </div>

            {student.examCenter && (
              <div>
                <p className="text-[5pt] text-gray-500 uppercase font-bold">Centre d'examen</p>
                <p className="text-[7pt] font-semibold truncate">{student.examCenter}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end">
            {/* QR Code */}
            <div className="bg-white p-0.5 border border-gray-100">
              <QRCodeSVG 
                value={student.qrCodeData || `${student.matricule}-${student.lastName}`}
                size={35}
                level="L"
              />
            </div>

            {/* Signature/Stamp Placeholder */}
            <div className="text-right">
               <p className="text-[5pt] italic text-gray-400 mb-1">Le Proviseur</p>
               <div className="h-8 w-16 border-b border-gray-200 relative">
                 {schoolInfo.signatureUrl && (
                   <img 
                    src={schoolInfo.signatureUrl} 
                    alt="Signature" 
                    className="absolute inset-0 w-full h-full object-contain opacity-80"
                    referrerPolicy="no-referrer"
                   />
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
    </div>
  );
};
