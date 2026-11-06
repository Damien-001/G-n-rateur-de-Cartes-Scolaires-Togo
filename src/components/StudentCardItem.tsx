import React from 'react';
import { Users, Edit2, Trash2 } from 'lucide-react';
import { Student } from '../types';

interface StudentCardItemProps {
  student: Student;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export const StudentCardItem: React.FC<StudentCardItemProps> = React.memo(({
  student,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onToggleSelect(student.id)}
      className={`group relative bg-white rounded-2xl p-5 border transition-all duration-350 cursor-pointer select-none hover:translate-y-[-3px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.025)] ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-100/70 shadow-[0_4px_12px_rgba(5,150,105,0.08)]'
          : 'border-gray-100/90 shadow-[0_2px_8px_rgba(0,0,0,0.01)]'
      }`}
    >
      {/* Selector Checkbox upper right */}
      <div
        className={`absolute top-4 right-4 w-5.5 h-5.5 rounded-full border flex items-center justify-center transition-all duration-200 ${
          isSelected
            ? 'bg-emerald-600 border-emerald-600 text-white scale-100 opacity-100'
            : 'bg-white border-gray-300 opacity-80 xl:opacity-0 xl:group-hover:opacity-100 scale-90'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex gap-3.5 sm:gap-4 min-w-0">
        {/* Double Bezel for Photo */}
        <div className={`w-16 h-20 rounded-xl overflow-hidden border flex-shrink-0 transition-all duration-200 ${
          isSelected ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-gray-100 bg-gray-50'
        }`}>
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Users className="w-7 h-7 text-gray-300" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-800 transition-colors duration-200 truncate">
            {student.lastName} {student.firstName}
          </h3>
          <p className="text-sm text-gray-500 font-semibold truncate">{student.className}</p>
          <p className="text-xs text-emerald-800 font-extrabold mt-2 bg-emerald-50/50 inline-block max-w-full truncate px-2.5 py-0.5 rounded-full border border-emerald-100/50 letter-spacing-wide">
            {student.matricule}
          </p>
        </div>
      </div>

      {/* Edit and Delete Actions - Always visible on mobile & tablet touch screens */}
      <div
        className="mt-3 flex items-center justify-end gap-1 opacity-100 xl:opacity-60 xl:group-hover:opacity-100 transition-opacity duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(student)}
          title="Modifier"
          className="p-2 xl:p-1.5 text-gray-600 xl:text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer active:scale-90"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(student.id)}
          title="Supprimer"
          className="p-2 xl:p-1.5 text-gray-600 xl:text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer active:scale-90"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
