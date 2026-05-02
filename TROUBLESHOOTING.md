# Guide de Dépannage - Générateur de Cartes Scolaires

## Problème : Les données ne s'ajoutent pas

### Étapes de diagnostic

1. **Vérifier la connexion à Supabase**
   - Ouvrez la console du navigateur (F12)
   - Tapez `debugDatabase()` et appuyez sur Entrée
   - Vérifiez les messages de connexion

2. **Vérifier l'authentification**
   - Assurez-vous d'être connecté à l'application
   - Si vous n'êtes pas connecté, créez un compte ou connectez-vous

3. **Vérifier la base de données**
   - Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
   - Connectez-vous à votre projet
   - Vérifiez que les tables `students` et `school_info` existent

4. **Mettre à jour le schéma de la base de données**
   - Dans Supabase Dashboard > SQL Editor
   - Exécutez le contenu du fichier `supabase/migration_add_stamp_url.sql`
   - Puis exécutez le contenu du fichier `supabase/schema.sql`

### Solutions courantes

#### Erreur de connexion Supabase
```
❌ VITE_SUPABASE_URL non configurée dans .env
❌ VITE_SUPABASE_ANON_KEY non configurée dans .env
```

**Solution :**
1. Vérifiez le fichier `.env` à la racine du projet
2. Assurez-vous que les variables sont correctement définies :
   ```
   VITE_SUPABASE_URL="https://votre-projet.supabase.co"
   VITE_SUPABASE_ANON_KEY="votre-clé-anon"
   ```
3. Redémarrez le serveur de développement

#### Erreur de permissions
```
❌ Erreur insertion: new row violates row-level security policy
```

**Solution :**
1. Allez dans Supabase Dashboard > Authentication > Policies
2. Vérifiez que les politiques RLS sont correctement configurées
3. Exécutez le script `supabase/schema.sql` pour recréer les politiques

#### Colonne manquante
```
❌ Erreur insertion: column "stamp_url" does not exist
```

**Solution :**
1. Exécutez la migration : `supabase/migration_add_stamp_url.sql`
2. Ou recréez la table avec le nouveau schéma : `supabase/schema.sql`

### Commandes de debug

Dans la console du navigateur (F12), vous pouvez utiliser :

```javascript
// Tester la connexion à la base de données
debugDatabase()

// Vérifier la session utilisateur
supabase.auth.getSession().then(console.log)

// Tester l'insertion manuelle
supabase.from('students').insert({
  user_id: 'votre-user-id',
  first_name: 'Test',
  last_name: 'ÉTUDIANT',
  matricule: 'TEST-001',
  class_name: '6ème',
  school_year: '2024-2025'
}).then(console.log)
```

### Vérification des logs

1. **Console du navigateur** : Ouvrez F12 > Console pour voir les messages de debug
2. **Supabase Logs** : Dashboard > Logs pour voir les erreurs côté serveur
3. **Network Tab** : F12 > Network pour voir les requêtes HTTP

### Contact

Si le problème persiste :
1. Copiez les messages d'erreur de la console
2. Notez les étapes que vous avez suivies
3. Vérifiez que votre projet Supabase est actif et accessible