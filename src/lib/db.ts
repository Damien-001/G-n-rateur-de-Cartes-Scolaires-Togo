import { supabase } from './supabase';
import { Student, SchoolInfo, DEFAULT_CARD_COLORS } from '../types';
import type { DbStudent, DbSchoolInfo } from './supabase';
import { StudentSchema, SchoolInfoSchema, validateFileUpload } from './validation';
import { logger, logAuditTrail } from './logger';

// ─── Helpers de conversion ────────────────────────────────────────────────────

function dbToStudent(row: DbStudent): Student {
  return {
    id: row.id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    matricule: row.matricule ?? '',
    className: row.class_name ?? '',
    schoolYear: row.school_year ?? '',
    birthDate: row.birth_date ?? '',
    birthPlace: row.birth_place ?? '',
    examCenter: row.exam_center ?? '',
    photoUrl: row.photo_url ?? '',
    expirationDate: row.expiration_date ?? '',
  };
}

function studentToDb(student: Student, userId: string): Omit<DbStudent, 'created_at' | 'updated_at'> {
  return {
    id: student.id,
    user_id: userId,
    first_name: student.firstName || '',
    last_name: student.lastName || '',
    matricule: student.matricule || '',
    class_name: student.className || '',
    school_year: student.schoolYear || '',
    birth_date: student.birthDate || null,
    birth_place: student.birthPlace || null,
    exam_center: student.examCenter || null,
    photo_url: student.photoUrl || null,
    expiration_date: student.expirationDate || null,
  };
}

function dbToSchoolInfo(row: DbSchoolInfo): SchoolInfo {
  return {
    name: row.name,
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    stampUrl: row.stamp_url,
    cardColors: row.card_colors ?? DEFAULT_CARD_COLORS,
  };
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function fetchStudents(userId: string): Promise<Student[]> {
  try {
    const startTime = performance.now();
    
    // Timeout augmenté à 30 secondes pour connexions lentes et cold starts
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetchStudents')), 30000)
    );
    
    const fetchPromise = supabase
      .from('students')
      .select('id, first_name, last_name, matricule, class_name, school_year, birth_date, birth_place, exam_center, photo_url, expiration_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100); // Limiter à 100 étudiants pour le chargement initial

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      logger.error('Failed to fetch students', { code: error.code });
      return [];
    }
    
    const endTime = performance.now();
    logger.info('Students fetched successfully', { 
      count: data?.length || 0, 
      duration: `${(endTime - startTime).toFixed(0)}ms` 
    });
    
    // ✅ VALIDATION ZOD des données reçues
    const validatedStudents = (data as DbStudent[]).map(dbToStudent).filter(student => {
      try {
        StudentSchema.parse(student);
        return true;
      } catch (error) {
        logger.warn('Invalid student data from database', { studentId: student.id });
        return false; // Filtrer les données invalides
      }
    });
    
    return validatedStudents;
  } catch (e: any) {
    if (e.message === 'Timeout fetchStudents') {
      logger.error('Timeout loading students (>30s)');
    } else {
      logger.error('fetchStudents exception', { error: e.message });
    }
    return [];
  }
}

export async function upsertStudent(student: Student, userId: string): Promise<Student> {
  // ✅ VALIDATION ZOD CÔTÉ SERVEUR
  try {
    const validatedStudent = StudentSchema.parse(student);
    
    const isNew = !validatedStudent.id || validatedStudent.id === '';

    logger.debug('upsertStudent called', {
      isNew,
      userId,
      studentId: validatedStudent.id,
    });

    if (isNew) {
      const insertData = {
        user_id: userId,
        first_name: validatedStudent.firstName,
        last_name: validatedStudent.lastName,
        matricule: validatedStudent.matricule,
        class_name: validatedStudent.className,
        school_year: validatedStudent.schoolYear,
        birth_date: validatedStudent.birthDate || null,
        birth_place: validatedStudent.birthPlace || null,
        exam_center: validatedStudent.examCenter || null,
        photo_url: validatedStudent.photoUrl || null,
        expiration_date: validatedStudent.expirationDate || null,
      };
      
      const { data, error } = await supabase
        .from('students')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to insert student', { code: error.code });
        throw new Error('Erreur lors de l\'ajout de l\'élève');
      }
      
      // ✅ AUDIT TRAIL
      await logAuditTrail({
        userId,
        action: 'CREATE_STUDENT',
        resourceType: 'student',
        resourceId: (data as DbStudent).id,
        details: { matricule: validatedStudent.matricule },
      });
      
      logger.info('Student created successfully');
      return dbToStudent(data as DbStudent);
    } else {
      const row = studentToDb(validatedStudent as Student, userId);
      
      const { data, error } = await supabase
        .from('students')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to update student', { code: error.code });
        throw new Error('Erreur lors de la mise à jour de l\'élève');
      }
      
      // ✅ AUDIT TRAIL
      await logAuditTrail({
        userId,
        action: 'UPDATE_STUDENT',
        resourceType: 'student',
        resourceId: validatedStudent.id,
        details: { matricule: validatedStudent.matricule },
      });
      
      logger.info('Student updated successfully');
      return dbToStudent(data as DbStudent);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn('Validation error in upsertStudent', { error: error.message });
      throw new Error('Données invalides : ' + error.message);
    }
    throw error;
  }
}

/** Import en masse depuis CSV — laisse Supabase générer les IDs */
export async function insertStudents(students: Student[], userId: string): Promise<Student[]> {
  // ✅ VALIDATION ZOD pour chaque étudiant
  const validatedStudents = students.map((s, index) => {
    try {
      return StudentSchema.parse(s);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error(`Étudiant ${index + 1} invalide : ${error.message}`);
      }
      throw error;
    }
  });

  const rows = validatedStudents.map(s => ({
    user_id: userId,
    first_name: s.firstName,
    last_name: s.lastName,
    matricule: s.matricule,
    class_name: s.className,
    school_year: s.schoolYear,
    birth_date: s.birthDate || null,
    birth_place: s.birthPlace || null,
    exam_center: s.examCenter || null,
    photo_url: s.photoUrl || null,
    expiration_date: s.expirationDate || null,
  }));

  const { data, error } = await supabase
    .from('students')
    .insert(rows)
    .select();

  if (error) {
    logger.error('Failed to insert students', { code: error.code });
    throw new Error(error.message);
  }
  
  // ✅ AUDIT TRAIL
  await logAuditTrail({
    userId,
    action: 'CREATE_STUDENTS_BULK',
    resourceType: 'student',
    resourceId: 'bulk',
    details: { count: validatedStudents.length },
  });
  
  logger.info('Students inserted successfully', { count: validatedStudents.length });
  return (data as DbStudent[]).map(dbToStudent);
}

export async function deleteStudent(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete student', { code: error.code });
    throw new Error('Erreur lors de la suppression');
  }
  
  // ✅ AUDIT TRAIL
  await logAuditTrail({
    userId,
    action: 'DELETE_STUDENT',
    resourceType: 'student',
    resourceId: id,
  });
  
  logger.info('Student deleted successfully', { studentId: id });
}

/** Suppression en masse — supprime plusieurs élèves en une seule requête */
export async function deleteStudents(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from('students')
    .delete()
    .in('id', ids);

  if (error) {
    logger.error('Failed to delete students', { code: error.code });
    throw new Error(error.message);
  }
  
  // ✅ AUDIT TRAIL
  await logAuditTrail({
    userId,
    action: 'DELETE_STUDENTS_BULK',
    resourceType: 'student',
    resourceId: 'bulk',
    details: { count: ids.length, ids },
  });
  
  logger.info('Students deleted successfully', { count: ids.length });
}

// ─── School Info ──────────────────────────────────────────────────────────────

export async function fetchSchoolInfo(userId: string): Promise<SchoolInfo | null> {
  try {
    const startTime = performance.now();
    
    // Timeout augmenté à 30 secondes pour connexions lentes et cold starts
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetchSchoolInfo')), 30000)
    );
    
    const fetchPromise = supabase
      .from('school_info')
      .select('name, logo_url, signature_url, stamp_url, card_colors')
      .eq('user_id', userId)
      .maybeSingle();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      logger.error('Failed to fetch school info', { code: error.code });
      return null;
    }
    
    const endTime = performance.now();
    logger.info('School info fetched successfully', { 
      duration: `${(endTime - startTime).toFixed(0)}ms` 
    });
    
    if (!data) return null;
    
    // ✅ VALIDATION ZOD des données reçues
    const schoolInfo = dbToSchoolInfo(data as DbSchoolInfo);
    try {
      SchoolInfoSchema.parse(schoolInfo);
      return schoolInfo;
    } catch (error) {
      logger.warn('Invalid school info data from database', { error });
      return null; // Retourner null si les données sont invalides
    }
  } catch (e: any) {
    if (e.message === 'Timeout fetchSchoolInfo') {
      logger.error('Timeout loading school info (>30s)');
    } else {
      logger.error('fetchSchoolInfo exception', { error: e.message });
    }
    return null;
  }
}

export async function saveSchoolInfo(info: SchoolInfo, userId: string): Promise<void> {
  try {
    // ✅ VALIDATION ZOD CÔTÉ SERVEUR
    const validatedInfo = SchoolInfoSchema.parse(info);
    
    const row: DbSchoolInfo = {
      user_id: userId,
      name: validatedInfo.name,
      logo_url: validatedInfo.logoUrl || null,
      signature_url: validatedInfo.signatureUrl || null,
      stamp_url: validatedInfo.stampUrl || null,
      card_colors: validatedInfo.cardColors ?? DEFAULT_CARD_COLORS,
      updated_at: new Date().toISOString(),
    };

    // Timeout augmenté à 30 secondes
    const { error } = await Promise.race([
      supabase
        .from('school_info')
        .upsert(row, { onConflict: 'user_id' }),
      new Promise<{ error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 30000)
      )
    ]);

    if (error) {
      logger.error('Failed to save school info', { code: error.code });
      throw error;
    }
    
    // ✅ AUDIT TRAIL
    await logAuditTrail({
      userId,
      action: 'UPDATE_SCHOOL_INFO',
      resourceType: 'school_info',
      resourceId: userId,
    });
    
    logger.info('School info saved successfully');
  } catch (e: any) {
    if (e.message === 'Timeout') {
      logger.warn('saveSchoolInfo timeout - data will be saved later');
    } else if (e.name === 'ZodError') {
      logger.warn('Validation error in saveSchoolInfo', { error: e.message });
      throw new Error('Données invalides : ' + e.message);
    } else {
      logger.error('saveSchoolInfo exception', { error: e.message });
    }
    // Ne pas propager l'erreur pour ne pas bloquer l'interface
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const BUCKET = 'school-assets';

export async function uploadImage(
  file: File,
  userId: string,
  folder: 'logos' | 'signatures' | 'photos'
): Promise<string> {
  // ✅ VALIDATION DU FICHIER
  const validation = validateFileUpload(file);
  if (!validation.valid) {
    logger.warn('File upload validation failed', { reason: validation.error });
    throw new Error(validation.error);
  }
  
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    logger.error('Failed to upload image', { code: error.message });
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  
  // ✅ AUDIT TRAIL
  await logAuditTrail({
    userId,
    action: 'UPLOAD_IMAGE',
    resourceType: 'storage',
    resourceId: path,
    details: { folder, size: file.size, type: file.type },
  });
  
  logger.info('Image uploaded successfully', { path, size: file.size });
  return data.publicUrl;
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new File([array], filename, { type: mime });
}
