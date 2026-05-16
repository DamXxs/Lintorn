// /frontend/src/pages/OrdresReparation/OrPdfTemplate.tsx
// Composant rendu hors-écran, capturé par html2canvas pour générer le PDF OR.
// Styles 100% inline — jamais de variables CSS (le PDF est toujours blanc/noir).
import React from 'react';
import { OrdreReparationDetail } from './orService';
import { ParametresFacturation } from '../../services/api';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  ordre: OrdreReparationDetail;
  parametres: ParametresFacturation;
}

// =============================================================================
// HELPERS
// =============================================================================

const fmt = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

// =============================================================================
// STYLES INLINE (immuables — toujours fond blanc quelle que soit le thème)
// =============================================================================

const S = {
  page: {
    width: '210mm',
    minHeight: '297mm',
    background: '#fff',
    padding: '12mm',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: '10pt',
    color: '#1a1a1a',
    boxSizing: 'border-box' as const,
  },

  // --- EN-TÊTE ---
  entete: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '10px',
  } as React.CSSProperties,

  blocGarage: {
    border: '1.5px solid #1a1a1a',
    background: '#f5f5f5',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,

  logo: {
    width: '70px',
    height: '70px',
    background: '#e0e0e0',
    border: '1px dashed #999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8pt',
    color: '#666',
    flexShrink: 0,
  } as React.CSSProperties,

  garageNom: { fontSize: '13pt', fontWeight: 700, margin: 0 },
  garageInfos: { fontSize: '8.5pt', color: '#444', lineHeight: 1.5, margin: 0 },
  garageSiret: { fontSize: '7.5pt', color: '#666', marginTop: '3px' },

  blocNumero: {
    background: '#1a1a1a',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  orTitre: {
    fontSize: '11pt',
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '2px',
    borderBottom: '1px solid #444',
    paddingBottom: '6px',
    marginBottom: '8px',
  } as React.CSSProperties,

  numeroGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  } as React.CSSProperties,

  numeroLabel: { fontSize: '8pt', color: '#aaa', textTransform: 'uppercase' as const },
  numeroValue: { fontSize: '14pt', fontWeight: 700, marginTop: '2px' },
  numeroValueSm: { fontSize: '12pt', fontWeight: 700, marginTop: '2px' },

  // --- SECTIONS ---
  section: {
    border: '1px solid #1a1a1a',
    marginBottom: '8px',
  } as React.CSSProperties,

  sectionTitre: {
    background: '#1a1a1a',
    color: '#fff',
    padding: '5px 12px',
    fontSize: '9pt',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,

  sectionCorps: {
    padding: '10px 12px',
    background: '#fafafa',
  } as React.CSSProperties,

  // --- CLIENT / VÉHICULE (2 colonnes) ---
  clientVehicule: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '8px',
  } as React.CSSProperties,

  champsGrid: {
    display: 'grid',
    gridTemplateColumns: '90px 1fr',
    rowGap: '5px',
    columnGap: '8px',
    fontSize: '9.5pt',
  } as React.CSSProperties,

  label: { color: '#666', fontSize: '9pt' },
  valeur: { fontWeight: 600 },
  valeurMono: { fontFamily: "'Courier New', monospace", fontWeight: 500 },

  // --- DESCRIPTION ---
  description: {
    background: '#fff',
    padding: '12px',
    minHeight: '120px',
    backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #d8d8d8 23px, #d8d8d8 24px)',
    fontSize: '9.5pt',
    lineHeight: '24px',
    whiteSpace: 'pre-wrap' as const,
  } as React.CSSProperties,

  descriptionVide: {
    color: '#bbb',
    fontStyle: 'italic' as const,
    fontSize: '9pt',
  },

  // --- TABLEAUX ---
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '9pt',
  } as React.CSSProperties,

  th: {
    background: '#e8e8e8',
    border: '1px solid #ccc',
    padding: '6px 8px',
    fontWeight: 700,
    textAlign: 'center' as const,
    fontSize: '9pt',
  } as React.CSSProperties,

  td: {
    border: '1px solid #ccc',
    padding: '6px 8px',
    height: '28px',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  tdCenter: {
    border: '1px solid #ccc',
    padding: '6px 8px',
    height: '28px',
    verticalAlign: 'middle' as const,
    textAlign: 'center' as const,
  } as React.CSSProperties,

  tdMono: {
    border: '1px solid #ccc',
    padding: '6px 8px',
    height: '28px',
    verticalAlign: 'middle' as const,
    fontFamily: "'Courier New', monospace",
    fontSize: '8.5pt',
  } as React.CSSProperties,

  // --- CLÔTURE ---
  cloture: { background: '#fafafa', padding: '10px 12px' },

  clotureGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '12px',
  } as React.CSSProperties,

  clotureLigne: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '9.5pt',
  } as React.CSSProperties,

  clotureTrait: {
    flex: 1,
    borderBottom: '1px solid #1a1a1a',
    height: '18px',
  } as React.CSSProperties,

  signatures: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '8px',
  } as React.CSSProperties,

  signatureTitre: { fontSize: '9pt', fontWeight: 700, marginBottom: '4px' },
  signatureZone: {
    border: '1px dashed #999',
    background: '#fff',
    height: '50px',
  } as React.CSSProperties,

  // --- PIED DE PAGE ---
  pied: {
    borderTop: '1px solid #1a1a1a',
    marginTop: '10px',
    paddingTop: '6px',
    textAlign: 'center' as const,
    fontSize: '8pt',
    color: '#666',
  } as React.CSSProperties,

  piedMention: { fontSize: '7.5pt', color: '#999', marginTop: '2px' },
};

// Lignes vides pour les tableaux (6 lignes minimum pour pièces, 4 pour interventions)
const LIGNES_VIDES_PIECES = 6;
const LIGNES_VIDES_INTERVENTIONS = 4;

// =============================================================================
// COMPOSANT
// =============================================================================

const OrPdfTemplate: React.FC<Props> = ({ ordre, parametres }) => {
  const nomGarage  = parametres.nom_garage  || 'GARAGE';
  const adresse    = parametres.adresse_garage || '';
  const telephone  = parametres.telephone_garage || '';
  const email      = parametres.email_garage || '';
  const siret      = parametres.siret || '';
  const numeroTva  = parametres.numero_tva || '';

  // Nombre de lignes vides à ajouter dans les tables pour atteindre le min
  const lignesVidesPieces = Math.max(0, LIGNES_VIDES_PIECES - ordre.pieces.length);
  const lignesVidesInterv = Math.max(0, LIGNES_VIDES_INTERVENTIONS - ordre.interventions.length);

  return (
    <div id="or-pdf-template" style={S.page}>

      {/* ============ EN-TÊTE ============ */}
      <header style={S.entete}>

        <div style={S.blocGarage}>
          <div style={S.logo}>LOGO</div>
          <div>
            <p style={S.garageNom}>{nomGarage}</p>
            <p style={S.garageInfos}>
              {adresse && <>{adresse}<br /></>}
              {telephone && <>Tél : {telephone}</>}
              {telephone && email && ' • '}
              {email && <>{email}</>}
            </p>
            {(siret || numeroTva) && (
              <p style={S.garageSiret}>
                {siret && <>SIRET : {siret}</>}
                {siret && numeroTva && ' • '}
                {numeroTva && <>TVA : {numeroTva}</>}
              </p>
            )}
          </div>
        </div>

        <div style={S.blocNumero}>
          <div style={S.orTitre}>ORDRE DE RÉPARATION</div>
          <div style={S.numeroGrid}>
            <div>
              <div style={S.numeroLabel}>N° OR</div>
              <div style={S.numeroValue}>{ordre.numero}</div>
            </div>
            <div>
              <div style={S.numeroLabel}>Date d'ouverture</div>
              <div style={S.numeroValueSm}>{fmt(ordre.date_ouverture)}</div>
            </div>
          </div>
        </div>

      </header>

      {/* ============ CLIENT + VÉHICULE ============ */}
      <section style={S.clientVehicule}>

        <div style={S.section}>
          <div style={S.sectionTitre}>Client</div>
          <div style={S.sectionCorps}>
            <div style={S.champsGrid}>
              <span style={S.label}>Nom :</span>
              <span style={S.valeur}>{ordre.client_nom} {ordre.client_prenom}</span>
              <span style={S.label}>Téléphone :</span>
              <span style={S.valeur}>{ordre.client_telephone || '—'}</span>
              <span style={S.label}>Email :</span>
              <span style={S.valeur}>{ordre.client_email || '—'}</span>
            </div>
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitre}>Véhicule / Engin</div>
          <div style={S.sectionCorps}>
            <div style={S.champsGrid}>
              <span style={S.label}>Désignation :</span>
              <span style={S.valeur}>
                {ordre.vehicule_marque} {ordre.vehicule_modele}
                {ordre.vehicule_annee ? ` (${ordre.vehicule_annee})` : ''}
              </span>
              <span style={S.label}>Identifiant :</span>
              <span style={S.valeurMono}>{ordre.vehicule_immatriculation || '—'}</span>
              <span style={S.label}>Km entrée :</span>
              <span style={S.valeur}>
                {ordre.kilometrage_entree
                  ? `${ordre.kilometrage_entree.toLocaleString('fr-FR')} km`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* ============ DESCRIPTION DES TRAVAUX ============ */}
      <section style={S.section}>
        <div style={S.sectionTitre}>Description des travaux demandés / effectués</div>
        <div style={S.description}>
          {ordre.description_travaux
            ? ordre.description_travaux
            : <span style={S.descriptionVide}>—</span>
          }
        </div>
      </section>

      {/* ============ PIÈCES SORTIES ============ */}
      <section style={S.section}>
        <div style={S.sectionTitre}>Pièces sorties du stock</div>
        <div style={S.sectionCorps}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '50px' }}>Qté</th>
                <th style={S.th}>Désignation</th>
                <th style={{ ...S.th, width: '140px' }}>Référence</th>
              </tr>
            </thead>
            <tbody>
              {ordre.pieces.map(p => (
                <tr key={p.id}>
                  <td style={S.tdCenter}>{p.quantite}</td>
                  <td style={S.td}>{p.designation_snapshot}</td>
                  <td style={S.tdMono}>{p.reference_snapshot}</td>
                </tr>
              ))}
              {Array.from({ length: lignesVidesPieces }).map((_, i) => (
                <tr key={`vide-piece-${i}`}>
                  <td style={S.td}>&nbsp;</td>
                  <td style={S.td}>&nbsp;</td>
                  <td style={S.td}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ INTERVENTIONS / MAIN D'ŒUVRE ============ */}
      <section style={S.section}>
        <div style={S.sectionTitre}>Temps passé / Interventions</div>
        <div style={S.sectionCorps}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '85px' }}>Date</th>
                <th style={{ ...S.th, width: '140px' }}>Type intervention</th>
                <th style={{ ...S.th, width: '120px' }}>Mécanicien</th>
                <th style={{ ...S.th, width: '70px' }}>Durée</th>
                <th style={S.th}>Détail / Notes</th>
              </tr>
            </thead>
            <tbody>
              {ordre.interventions.map(i => (
                <tr key={i.id}>
                  <td style={S.tdCenter}>{fmt(i.date)}</td>
                  <td style={S.td}>{i.type_intervention_label}</td>
                  <td style={S.td}>{i.mecanicien_nom}</td>
                  <td style={S.tdCenter}>{i.duree_formatee}</td>
                  <td style={S.td}>{i.detail || ''}</td>
                </tr>
              ))}
              {Array.from({ length: lignesVidesInterv }).map((_, i) => (
                <tr key={`vide-interv-${i}`}>
                  <td style={S.td}>&nbsp;</td>
                  <td style={S.td}>&nbsp;</td>
                  <td style={S.td}>&nbsp;</td>
                  <td style={S.td}>&nbsp;</td>
                  <td style={S.td}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ CLÔTURE ============ */}
      <section style={S.section}>
        <div style={S.sectionTitre}>Clôture de l'intervention</div>
        <div style={S.cloture}>
          <div style={S.clotureGrid}>
            <div style={S.clotureLigne}>
              <span style={S.label}>Date de fin :</span>
              <span style={S.clotureTrait}>{ordre.date_cloture ? fmt(ordre.date_cloture) : ''}</span>
            </div>
            <div style={S.clotureLigne}>
              <span style={S.label}>Km / h sortie :</span>
              <span style={S.clotureTrait}>
                {ordre.kilometrage_sortie ? `${ordre.kilometrage_sortie.toLocaleString('fr-FR')} km` : ''}
              </span>
            </div>
            <div style={S.clotureLigne}>
              <span style={S.label}>Heure sortie :</span>
              <span style={S.clotureTrait}>{ordre.heure_sortie || ''}</span>
            </div>
          </div>

          <div style={S.signatures}>
            <div>
              <div style={S.signatureTitre}>Signature du mécanicien :</div>
              <div style={S.signatureZone} />
            </div>
            <div>
              <div style={S.signatureTitre}>Signature du client (validation sortie) :</div>
              <div style={S.signatureZone} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ PIED DE PAGE ============ */}
      <footer style={S.pied}>
        Document interne — {nomGarage} — {ordre.numero}
        <div style={S.piedMention}>
          Ce document n'est pas une facture. Une facture sera émise séparément à la sortie du véhicule.
        </div>
      </footer>

    </div>
  );
};

export default OrPdfTemplate;
