/**
 * Utilitaires pour la normalisation et l'affichage des dates
 * Supporte les formats scolaires togolais et francophones (JJ/MM/AAAA, JJ-MM-AAAA, AAAA-MM-JJ, séries Excel, etc.)
 */

/**
 * Convertit n'importe quelle chaîne ou valeur de date vers le format ISO strict `AAAA-MM-JJ`
 * obligatoire pour les champs HTML5 `<input type="date">`.
 */
export function normalizeDateToInput(dateVal?: string | number | null): string {
  if (!dateVal && dateVal !== 0) return '';
  const raw = String(dateVal).trim();
  if (!raw || raw === '----' || raw === '—') return '';

  // 1. Déjà au format ISO strict AAAA-MM-JJ
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // 2. Format ISO avec heure / timestamp (ex: 2010-05-12T00:00:00Z ou 2010-05-12 14:30)
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.substring(0, 10);
  }

  // 3. Format AAAA/MM/JJ ou AAAA.MM.JJ
  const ymdMatch = raw.match(/^(\d{4})[/. -](\d{1,2})[/. -](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. Format JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA (standard Togo / Afrique francophone / Excel)
  const dmyMatch = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    let y = dmyMatch[3];
    if (y.length === 2) {
      const numY = parseInt(y, 10);
      y = numY <= 45 ? `20${y}` : `19${y}`;
    }
    return `${y}-${m}-${d}`;
  }

  // 5. Nombres séries Excel (ex: 40310 = 12/05/2010)
  if (/^\d{4,5}$/.test(raw)) {
    const serial = parseInt(raw, 10);
    // Plage typique des dates d'élèves et cartes (de 1980 à 2040)
    if (serial > 25000 && serial < 55000) {
      // 25569 = différence entre l'époque Excel (1900) et l'époque Unix (1970)
      const utcDays = Math.floor(serial - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  // 6. Mois en texte français (ex: "12 mai 2010", "12-juin-2009", "5 janvier 2011")
  const monthsFr: Record<string, string> = {
    janv: '01', janvier: '01',
    fevr: '02', fevrier: '02',
    mars: '03',
    avr: '04', avril: '04',
    mai: '05',
    juin: '06',
    juil: '07', juillet: '07',
    aout: '08',
    sept: '09', septembre: '09',
    oct: '10', octobre: '10',
    nov: '11', novembre: '11',
    dec: '12', decembre: '12',
  };
  const textMatch = raw.match(/^(\d{1,2})\s*[-/ ]\s*([a-zA-Z\u00C0-\u017F]+)\s*[-/ ]\s*(\d{4})$/);
  if (textMatch) {
    const d = textMatch[1].padStart(2, '0');
    const monthKey = textMatch[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (const [key, val] of Object.entries(monthsFr)) {
      if (monthKey.startsWith(key)) {
        return `${textMatch[3]}-${val}-${d}`;
      }
    }
  }

  return raw;
}

/**
 * Formate une date pour l'affichage visuel lisible en français : `JJ/MM/AAAA`.
 */
export function formatDateDisplay(dateVal?: string | number | null): string {
  if (!dateVal && dateVal !== 0) return '----';
  const raw = String(dateVal).trim();
  if (!raw || raw === '----' || raw === '—') return '----';

  // Si au format ISO AAAA-MM-JJ
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parts = raw.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Si format ISO avec heure
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const sub = raw.substring(0, 10).split('-');
    return `${sub[2]}/${sub[1]}/${sub[0]}`;
  }

  // Si déjà JJ/MM/AAAA
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si JJ-MM-AAAA
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Tente la normalisation ISO puis formatage en JJ/MM/AAAA
  const iso = normalizeDateToInput(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const parts = iso.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return raw;
}
