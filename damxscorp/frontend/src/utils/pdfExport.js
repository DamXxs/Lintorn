import { jsPDF } from 'jspdf';

/**
 * 📄 pdfExport.js — Utilitaire pour générer des PDFs pour devis/factures
 *
 * Fonction principale :
 *   genererPDF(document, type) : Génère et télécharge un PDF
 *
 * Paramètres :
 *   document : Objet devis ou facture complet
 *   type     : 'devis' ou 'facture'
 */

/**
 * Génère et télécharge un PDF pour un devis ou une facture
 * @param {Object} document - Objet devis ou facture complet
 * @param {string} type - 'devis' ou 'facture'
 */
export const genererPDF = (document, type = 'devis') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── EN-TÊTE ────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const titre = type === 'devis' ? 'DEVIS' : 'FACTURE';
  doc.text(titre, pageWidth / 2, 20, { align: 'center' });

  // Numéro
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const numero = document.numero || 'N/A';
  doc.text(`N° ${numero}`, pageWidth / 2, 30, { align: 'center' });

  // ── DATES ──────────────────────────────────────────────────
  doc.setFontSize(10);
  const dateEmission = type === 'devis' ? document.date_creation : document.date_emission;
  doc.text(
    `Date : ${new Date(dateEmission).toLocaleDateString('fr-FR')}`,
    15,
    45
  );

  if (type === 'devis') {
    doc.text(
      `Valide jusqu'au : ${new Date(document.date_validite).toLocaleDateString('fr-FR')}`,
      15,
      52
    );
  } else {
    doc.text(
      `Échéance : ${new Date(document.date_echeance).toLocaleDateString('fr-FR')}`,
      15,
      52
    );
  }

  // ── CLIENT ────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Client :', 15, 65);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const nomClient = `${document.client_nom || ''} ${document.client_prenom || ''}`.trim();
  doc.text(nomClient, 15, 72);
  if (document.client_adresse) doc.text(document.client_adresse, 15, 79);
  if (document.client_telephone) doc.text(`Tél : ${document.client_telephone}`, 15, 86);

  // ── VÉHICULE ───────────────────────────────────────────────
  let yStart = 95;
  if (document.vehicule_info) {
    const v = document.vehicule_info;
    doc.setFont('helvetica', 'bold');
    doc.text('Véhicule :', 15, yStart);
    doc.setFont('helvetica', 'normal');
    const infoVehicule = `${v.marque || ''} ${v.modele || ''} — ${v.immatriculation || ''}`.trim();
    doc.text(infoVehicule, 15, yStart + 7);
    yStart += 20;
  }

  // ── TABLEAU DES LIGNES ────────────────────────────────────
  yStart += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  // En-têtes du tableau
  doc.setFillColor(240, 241, 243);
  doc.rect(15, yStart, 180, 8, 'F');
  doc.setTextColor(26, 26, 26);
  doc.text('Description', 18, yStart + 5.5);
  doc.text('Qté', 115, yStart + 5.5);
  doc.text('Prix unit.', 130, yStart + 5.5);
  doc.text('Montant', 165, yStart + 5.5);

  yStart += 10;

  // Récupérer les lignes selon le type
  const lignes = type === 'devis'
    ? (document.lignes_devis || [])
    : (document.lignes_facture || []);

  // Afficher les lignes
  lignes.forEach((ligne, i) => {
    // Alternance des couleurs de fond
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(15, yStart - 2, 180, 8, 'F');
    }

    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(ligne.description || '', 18, yStart + 4);
    doc.text(String(ligne.quantite), 117, yStart + 4);
    doc.text(`${parseFloat(ligne.prix_unitaire).toFixed(2)} €`, 130, yStart + 4);
    const sousTotal = parseFloat(ligne.prix_unitaire) * ligne.quantite;
    doc.text(`${sousTotal.toFixed(2)} €`, 165, yStart + 4);
    yStart += 10;
  });

  // ── SÉPARATEUR ET TOTAUX ───────────────────────────────────
  yStart += 5;
  doc.setDrawColor(225, 232, 237);
  doc.line(15, yStart, 195, yStart);
  yStart += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);
  doc.text('Montant HT :', 130, yStart);
  doc.text(`${parseFloat(document.montant_ht).toFixed(2)} €`, 165, yStart);
  yStart += 7;

  doc.text('TVA (20%) :', 130, yStart);
  doc.text(`${parseFloat(document.tva).toFixed(2)} €`, 165, yStart);
  yStart += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(41, 128, 185);
  doc.text('Total TTC :', 130, yStart);
  doc.text(`${parseFloat(document.montant_ttc).toFixed(2)} €`, 165, yStart);

  // ── PAIEMENT (factures) ────────────────────────────────────
  if (type === 'facture' && parseFloat(document.montant_paye || 0) > 0) {
    yStart += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(10);
    doc.text('Déjà payé :', 130, yStart);
    doc.text(`${parseFloat(document.montant_paye).toFixed(2)} €`, 165, yStart);
    yStart += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('Solde restant :', 130, yStart);
    doc.text(`${parseFloat(document.solde_restant).toFixed(2)} €`, 165, yStart);
  }

  // ── NOTES ──────────────────────────────────────────────────
  if (document.notes && document.notes.trim()) {
    yStart += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.text('Notes :', 15, yStart);
    doc.setFont('helvetica', 'normal');
    yStart += 7;
    const notesLines = doc.splitTextToSize(document.notes, 165);
    doc.text(notesLines, 15, yStart);
  }

  // ── FOOTER ────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'DamXsCorp — Gestion Garage',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // ── TÉLÉCHARGER ────────────────────────────────────────────
  const filename = `${numero}.pdf`;
  doc.save(filename);
};

export default genererPDF;
