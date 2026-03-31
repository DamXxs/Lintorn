// /frontend/src/components/Factures/FactureDocument.jsx
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './FactureDocument.css';

const FactureDocument = ({ facture }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant && montant !== 0) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(montant));
  };

  const telechargerPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // En-tête
    doc.setFontSize(24);
    doc.text('FACTURE', 20, 20);

    doc.setFontSize(11);
    doc.text(`Numéro: ${facture.numero}`, 20, 30);
    doc.text(`Émise le: ${formatDate(facture.date_emission)}`, 20, 37);
    doc.text(`Échéance: ${formatDate(facture.date_echeance)}`, 20, 44);

    // Infos client
    doc.setFontSize(12);
    doc.text('CLIENT', 20, 55);
    doc.setFontSize(10);
    const nomClient = `${facture.client_prenom} ${facture.client_nom}`;
    doc.text(nomClient, 20, 62);
    if (facture.client_adresse) {
      doc.text(facture.client_adresse, 20, 69);
    }
    if (facture.client_telephone) {
      doc.text(`Tél: ${facture.client_telephone}`, 20, 76);
    }
    if (facture.client_email) {
      doc.text(`Email: ${facture.client_email}`, 20, 83);
    }

    // Infos véhicule
    let yPosition = 90;
    if (facture.vehicule_info) {
      doc.setFontSize(12);
      doc.text('VÉHICULE', 20, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      const vehiculeInfo = `${facture.vehicule_info.marque} ${facture.vehicule_info.modele} (${facture.vehicule_info.immatriculation})`;
      doc.text(vehiculeInfo, 20, yPosition);
      yPosition += 10;
    } else {
      yPosition += 3;
    }

    // Tableau lignes
    doc.setFontSize(10);
    const startY = yPosition;
    const tableData = [];

    if (facture.lignes_facture && facture.lignes_facture.length > 0) {
      facture.lignes_facture.forEach((ligne) => {
        tableData.push([
          ligne.description,
          ligne.quantite.toString(),
          formatMontant(ligne.prix_unitaire),
          formatMontant(ligne.montant),
        ]);
      });

      autoTable(doc, {
        startY: startY,
        head: [['Description', 'Quantité', 'Prix unitaire', 'Montant']],
        body: tableData,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    // Récupérer la position après le tableau
    yPosition = (doc.lastAutoTable?.finalY ?? yPosition + 20);
    yPosition += 5;

    // Totaux
    doc.setFontSize(10);
    doc.text('Total HT:', 120, yPosition);
    doc.text(formatMontant(facture.montant_ht), 180, yPosition, {
      align: 'right',
    });
    yPosition += 7;

    doc.text('TVA:', 120, yPosition);
    doc.text(formatMontant(facture.tva), 180, yPosition, {
      align: 'right',
    });
    yPosition += 7;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total TTC:', 120, yPosition);
    doc.text(formatMontant(facture.montant_ttc), 180, yPosition, {
      align: 'right',
    });

    // Paiement
    yPosition += 12;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Montant payé:', 120, yPosition);
    doc.text(formatMontant(facture.montant_paye), 180, yPosition, {
      align: 'right',
    });
    yPosition += 7;

    doc.text('Solde restant:', 120, yPosition);
    doc.text(formatMontant(facture.solde_restant), 180, yPosition, {
      align: 'right',
    });

    // Notes
    if (facture.notes) {
      yPosition += 12;
      doc.setFontSize(10);
      doc.text('Notes:', 20, yPosition);
      yPosition += 5;
      const notesText = doc.splitTextToSize(facture.notes, 170);
      doc.text(notesText, 20, yPosition);
    }

    // Télécharger
    doc.save(`${facture.numero}.pdf`);
  };

  const imprimerDocument = () => {
    window.print();
  };

  return (
    <div className="facture-document">
      <div className="facture-document__preview" id="facture-print">
        <div className="facture-document__header">
          <h1>FACTURE</h1>
          <p className="facture-document__numero">{facture.numero}</p>
          <p>Émise le {formatDate(facture.date_emission)}</p>
          <p>Échéance: {formatDate(facture.date_echeance)}</p>
        </div>

        <div className="facture-document__section">
          <h2>CLIENT</h2>
          <p>
            {facture.client_prenom} {facture.client_nom}
          </p>
          {facture.client_adresse && <p>{facture.client_adresse}</p>}
          {facture.client_telephone && <p>Tél: {facture.client_telephone}</p>}
          {facture.client_email && <p>Email: {facture.client_email}</p>}
        </div>

        {facture.vehicule_info && (
          <div className="facture-document__section">
            <h2>VÉHICULE</h2>
            <p>
              {facture.vehicule_info.marque} {facture.vehicule_info.modele}
            </p>
            <p>Immatriculation: {facture.vehicule_info.immatriculation}</p>
          </div>
        )}

        {facture.lignes_facture && facture.lignes_facture.length > 0 && (
          <div className="facture-document__section">
            <table className="facture-document__table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {facture.lignes_facture.map((ligne) => (
                  <tr key={ligne.id}>
                    <td>{ligne.description}</td>
                    <td className="text-right">{ligne.quantite}</td>
                    <td className="text-right">
                      {formatMontant(ligne.prix_unitaire)}
                    </td>
                    <td className="text-right">
                      {formatMontant(ligne.montant)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="facture-document__totaux">
          <div className="facture-document__total-row">
            <span>Total HT</span>
            <strong>{formatMontant(facture.montant_ht)}</strong>
          </div>
          <div className="facture-document__total-row">
            <span>TVA</span>
            <strong>{formatMontant(facture.tva)}</strong>
          </div>
          <div className="facture-document__total-row facture-document__total-ttc">
            <span>Total TTC</span>
            <strong>{formatMontant(facture.montant_ttc)}</strong>
          </div>
        </div>

        <div className="facture-document__paiement">
          <div className="facture-document__paiement-row">
            <span>Montant payé</span>
            <strong>{formatMontant(facture.montant_paye)}</strong>
          </div>
          <div className="facture-document__paiement-row">
            <span>Solde restant</span>
            <strong>{formatMontant(facture.solde_restant)}</strong>
          </div>
        </div>

        {facture.notes && (
          <div className="facture-document__notes">
            <h3>Notes</h3>
            <p>{facture.notes}</p>
          </div>
        )}
      </div>

      <div className="facture-document__actions no-print">
        <button
          className="facture-document__btn-imprimer"
          onClick={imprimerDocument}
        >
          🖨️ Imprimer
        </button>
        <button
          className="facture-document__btn-telecharger"
          onClick={telechargerPDF}
        >
          💾 Télécharger PDF
        </button>
      </div>
    </div>
  );
};

export default FactureDocument;
