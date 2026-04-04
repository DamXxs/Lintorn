// /frontend/src/pages/Fournisseurs/ModalEmailPreRempli.jsx
import React, { useState, useEffect } from 'react';
import { fetchEmailCommande } from '../../services/fournisseurService';
import './ModalEmailPreRempli.css';

/**
 * ModalEmailPreRempli
 * Affiche l'email de commande pré-rempli pour un fournisseur.
 * Récupère automatiquement les pièces en alerte liées à ce fournisseur.
 *
 * Props :
 *   fournisseur – objet fournisseur (au minimum : id, nom)
 *   onClose     – fn() → ferme le modal
 */
const ModalEmailPreRempli = ({ fournisseur, onClose }) => {
  const [emailData, setEmailData] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [erreur,    setErreur]    = useState(null);
  const [copie,     setCopie]     = useState(false);

  // Charge les données de l'email au montage du composant
  useEffect(() => {
    fetchEmailCommande(fournisseur.id)
      .then(data => setEmailData(data))
      .catch(err => setErreur(err.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, [fournisseur.id]);

  // Copie l'email complet dans le presse-papier
  const handleCopier = () => {
    if (!emailData) return;
    const texte = [
      `À : ${emailData.email_destinataire}`,
      `Objet : ${emailData.sujet}`,
      '',
      emailData.corps,
    ].join('\n');
    navigator.clipboard.writeText(texte);
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  };

  // Ouvre le client mail avec les champs pré-remplis (protocole mailto:)
  const handleOuvrirMail = () => {
    if (!emailData) return;
    const url = `mailto:${emailData.email_destinataire}`
      + `?subject=${encodeURIComponent(emailData.sujet)}`
      + `&body=${encodeURIComponent(emailData.corps)}`;
    window.open(url);
  };

  return (
    <div className="modal-email-overlay" onClick={onClose}>
      <div className="modal-email-box" onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div className="modal-email-header">
          <h2>📧 Email de commande — {fournisseur.nom}</h2>
          <button className="modal-email-close" onClick={onClose} title="Fermer">✕</button>
        </div>

        {/* ── Chargement ── */}
        {loading && (
          <div className="modal-email-loading">
            ⏳ Analyse du stock en cours…
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && erreur && (
          <div className="modal-email-erreur">
            ❌ {erreur}
          </div>
        )}

        {/* ── Aucune pièce en alerte ── */}
        {!loading && !erreur && emailData && !emailData.pieces && (
          <div className="modal-email-vide">
            ✅ Aucune pièce en alerte pour <strong>{fournisseur.nom}</strong>.
            <br />Rien à commander pour l'instant !
          </div>
        )}

        {/* ── Contenu principal ── */}
        {!loading && !erreur && emailData && emailData.pieces && (
          <>
            {/* Infos destinataire */}
            <div className="email-meta">
              <div className="email-meta-ligne">
                <span className="email-meta-label">À :</span>
                <span className="email-meta-valeur email-destinataire">
                  {emailData.email_destinataire}
                </span>
              </div>
              <div className="email-meta-ligne">
                <span className="email-meta-label">Objet :</span>
                <span className="email-meta-valeur">{emailData.sujet}</span>
              </div>
            </div>

            {/* Tableau des pièces concernées */}
            <div className="email-section">
              <h4 className="email-section-titre">
                Pièces concernées
                <span className="email-compteur">{emailData.pieces.length}</span>
              </h4>
              <table className="email-pieces-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Désignation</th>
                    <th className="th-center">Stock actuel</th>
                    <th className="th-center">Minimum</th>
                    <th className="th-center">Qté à commander</th>
                  </tr>
                </thead>
                <tbody>
                  {emailData.pieces.map(p => (
                    <tr
                      key={p.id}
                      className={p.stock_actuel === 0 ? 'tr-rupture' : 'tr-alerte'}
                    >
                      <td><code className="code-ref">{p.reference}</code></td>
                      <td>{p.nom}</td>
                      <td className="td-center td-stock">{p.stock_actuel}</td>
                      <td className="td-center">{p.stock_minimum}</td>
                      <td className="td-center td-qte">{p.quantite_suggeree}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Aperçu du message */}
            <div className="email-section">
              <h4 className="email-section-titre">Aperçu du message</h4>
              <pre className="email-corps-preview">{emailData.corps}</pre>
            </div>

            {/* Actions */}
            <div className="email-actions">
              <button className="email-btn email-btn--copier" onClick={handleCopier}>
                {copie ? '✅ Copié !' : '📋 Copier tout'}
              </button>
              <button className="email-btn email-btn--ouvrir" onClick={handleOuvrirMail}>
                📧 Ouvrir dans le client mail
              </button>
              <button className="email-btn email-btn--fermer" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ModalEmailPreRempli;
