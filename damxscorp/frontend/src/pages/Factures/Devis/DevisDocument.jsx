// /frontend/src/components/Devis/DevisDocument.jsx
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DevisDocument.css';

const DevisDocument = ({ devis }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(montant));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // En-tête — titre gauche + infos droite sur la même zone
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(`DEVIS N° ${devis.numero}`, margin, yPosition);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Date : ${formatDate(devis.date_creation)}`, pageWidth - margin, yPosition - 6, { align: 'right' });
    doc.text(`Validité : ${formatDate(devis.date_validite)}`, pageWidth - margin, yPosition, { align: 'right' });

    yPosition += 10;

    // Informations client
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('CLIENT', margin, yPosition);
    yPosition += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`${devis.client_nom} ${devis.client_prenom}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Tél. : ${devis.client_telephone}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Email : ${devis.client_email}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Adresse : ${devis.client_adresse}`, margin, yPosition);

    yPosition += 10;

    // Véhicule si présent
    if (devis.vehicule_info) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('VÉHICULE', margin, yPosition);
      yPosition += 7;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(
        `${devis.vehicule_info.marque} ${devis.vehicule_info.modele} (${devis.vehicule_info.immatriculation})`,
        margin,
        yPosition
      );
      yPosition += 10;
    }

    // Tableau des lignes
    if (devis.lignes_devis && devis.lignes_devis.length > 0) {
      const tableData = devis.lignes_devis.map((ligne) => [
        ligne.description,
        `${ligne.quantite}`,
        formatMontant(ligne.prix_unitaire),
        formatMontant(ligne.sous_total),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Description', 'Quantité', 'Prix unitaire', 'Montant']],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc.lastAutoTable?.finalY ?? yPosition) + 10;
    }

    // Notes si présentes (placées AVANT les totaux en bas)
    if (devis.notes) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text('Notes :', margin, yPosition);
      yPosition += 5;

      doc.setFont(undefined, 'normal');
      const notesLines = doc.splitTextToSize(devis.notes, contentWidth);
      doc.text(notesLines, margin, yPosition);
    }

    // ── Totaux toujours en bas de page à droite ──────────────────────────
    // On réserve 30 mm depuis le bas pour les 3 lignes de totaux
    const totauxY   = pageHeight - margin - 24;
    const labelsX   = pageWidth - margin - 80;
    const amountX   = pageWidth - margin;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    // Ligne séparatrice au-dessus des totaux
    doc.setDrawColor(200, 200, 200);
    doc.line(labelsX, totauxY - 4, pageWidth - margin, totauxY - 4);

    doc.text('Montant HT :', labelsX, totauxY);
    doc.text(formatMontant(devis.montant_ht), amountX, totauxY, { align: 'right' });

    doc.text(`TVA (${devis.tva_pourcentage ?? 20} %) :`, labelsX, totauxY + 7);
    doc.text(formatMontant(devis.tva), amountX, totauxY + 7, { align: 'right' });

    // Ligne séparatrice avant TTC
    doc.line(labelsX, totauxY + 11, pageWidth - margin, totauxY + 11);

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL TTC :', labelsX, totauxY + 18);
    doc.text(formatMontant(devis.montant_ttc), amountX, totauxY + 18, { align: 'right' });

    doc.save(`devis-${devis.numero}.pdf`);
  };

  return (
    <div className="devis-document">
      <div className="devis-document__actions">
        <button className="devis-document__btn" onClick={handlePrint}>
          🖨️ Imprimer
        </button>
        <button className="devis-document__btn" onClick={handleDownloadPDF}>
          📥 Télécharger PDF
        </button>
      </div>

      <div className="devis-document__content">
        {/* En-tête */}
        <div className="devis-document__header">
          <h1 className="devis-document__title">DEVIS N° {devis.numero}</h1>
          <div className="devis-document__header-info">
            <p><strong>Date :</strong> {formatDate(devis.date_creation)}</p>
            <p><strong>Validité :</strong> {formatDate(devis.date_validite)}</p>
          </div>
        </div>

        {/* Infos Client */}
        <div className="devis-document__section">
          <h2 className="devis-document__section-title">CLIENT</h2>
          <div className="devis-document__client-info">
            <p><strong>{devis.client_nom} {devis.client_prenom}</strong></p>
            <p>Tél. : {devis.client_telephone}</p>
            <p>Email : {devis.client_email}</p>
            <p>Adresse : {devis.client_adresse}</p>
          </div>
        </div>

        {/* Véhicule si présent */}
        {devis.vehicule_info && (
          <div className="devis-document__section">
            <h2 className="devis-document__section-title">VÉHICULE</h2>
            <p>
              {devis.vehicule_info.marque} {devis.vehicule_info.modele} ({devis.vehicule_info.immatriculation})
            </p>
          </div>
        )}

        {/* Tableau lignes */}
        {devis.lignes_devis && devis.lignes_devis.length > 0 && (
          <table className="devis-document__table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="devis-document__th-center">Quantité</th>
                <th className="devis-document__th-right">Prix unitaire</th>
                <th className="devis-document__th-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {devis.lignes_devis.map((ligne) => (
                <tr key={ligne.id}>
                  <td>{ligne.description}</td>
                  <td className="devis-document__td-center">{ligne.quantite}</td>
                  <td className="devis-document__td-right">{formatMontant(ligne.prix_unitaire)}</td>
                  <td className="devis-document__td-right">
                    {formatMontant(ligne.sous_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totaux */}
        <div className="devis-document__totals">
          <div className="devis-document__total-row">
            <span>Montant HT :</span>
            <span>{formatMontant(devis.montant_ht)}</span>
          </div>
          <div className="devis-document__total-row">
            <span>TVA (20%) :</span>
            <span>{formatMontant(devis.tva)}</span>
          </div>
          <div className="devis-document__total-row devis-document__total-ttc">
            <span>Montant TTC :</span>
            <span>{formatMontant(devis.montant_ttc)}</span>
          </div>
        </div>

        {/* Notes */}
        {devis.notes && (
          <div className="devis-document__notes">
            <h3>Notes</h3>
            <p>{devis.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevisDocument;
