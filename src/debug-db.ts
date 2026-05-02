// Script de debug pour tester la connexion à la base de données
import { supabase, testConnection } from './lib/supabase';

async function debugDatabase() {
  console.log('🔍 Test de connexion à Supabase...');
  
  // Test de connexion
  const connectionTest = await testConnection();
  console.log('Connexion:', connectionTest);
  
  if (!connectionTest.ok) {
    console.error('❌ Problème de connexion:', connectionTest.error);
    return;
  }
  
  // Test de session utilisateur
  console.log('\n🔍 Test de session utilisateur...');
  const { data: session } = await supabase.auth.getSession();
  console.log('Session:', session);
  
  if (!session.session) {
    console.log('ℹ️ Aucune session active - l\'utilisateur doit se connecter');
    return;
  }
  
  // Test de lecture des étudiants
  console.log('\n🔍 Test de lecture des étudiants...');
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', session.session.user.id);
    
  console.log('Étudiants:', students);
  if (studentsError) {
    console.error('Erreur étudiants:', studentsError);
  }
  
  // Test de lecture des infos école
  console.log('\n🔍 Test de lecture des infos école...');
  const { data: schoolInfo, error: schoolError } = await supabase
    .from('school_info')
    .select('*')
    .eq('user_id', session.session.user.id);
    
  console.log('Info école:', schoolInfo);
  if (schoolError) {
    console.error('Erreur info école:', schoolError);
  }
  
  // Test d'insertion d'un étudiant
  console.log('\n🔍 Test d\'insertion d\'un étudiant...');
  const testStudent = {
    user_id: session.session.user.id,
    first_name: 'Test',
    last_name: 'ÉTUDIANT',
    matricule: 'TEST-001',
    class_name: '6ème',
    school_year: '2024-2025',
  };
  
  const { data: insertedStudent, error: insertError } = await supabase
    .from('students')
    .insert(testStudent)
    .select()
    .single();
    
  if (insertError) {
    console.error('❌ Erreur insertion:', insertError);
  } else {
    console.log('✅ Étudiant inséré:', insertedStudent);
    
    // Nettoyer le test
    await supabase.from('students').delete().eq('id', insertedStudent.id);
    console.log('🧹 Étudiant de test supprimé');
  }
}

// Exporter pour utilisation dans la console
(window as any).debugDatabase = debugDatabase;

export { debugDatabase };