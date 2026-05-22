// /frontend/src/pages/Fournisseurs/ModalEmailPreRempli.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/shared/Modals/Modal';
import { fetchEmailCommande, EmailCommandeData, PieceAlerte } from './fournisseurService';
import { getApiError } from '../../utils/apiError';
import '../../components/shared/Modals/forms.css';
import './ModalEmailPreRempli.css';

// ── TYPES ─────────────────────────────────────────────────────────

interface ModalEmailPreRempliProps {
  fournisseurId: number;
  fournisseurNom: string;
  onClose: () => void;
}

// ── COMPOSANT ─────────────────────────────────────────────────────

const ModalEmailPreRempli: React.FC<ModalEmailPreRempliProps> = ({
  fournisseurId,
  fournisseurNom,
  onClose,
}) => {
  const [emailData, setEmailData]   = useState<EmailCommandeData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [erreur, setErreur]         = useState<string | null>(null);
  const [corpsEdite, setCorpsEdite] = useState('');
  const [copie, setCopie]           = useState(false);

  // ── Chargement du pré-remplissage ────────────────────────────────
  useEffect(() => {
    const charger = async () => {
      setLoading(true);
      setErreur(null);
      try {
        const data = await fetchEmailCommande(fournisseurId);
        setEmailData(data);
        setCorpsEdite(data.corps);
      } catch (err: unknown) {
        setErreur(getApiError(err, 'Impossible de générer l\'email'));
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [fournisseurId]);

  // ── Copie dans le presse-papier ──────────────────────────────────
  const handleCopier = async () => {
    if (!emailData) return;
    const texteComplet = `À : ${emailData.email_destinataire}\nObjet : ${emailData.sujet}\n\n${corpsEdite}`;
    try {
      await navigator.clipboard.writeText(texteComplet);
      setCopie(true);
      setTimeout(() => setCopie(false), 3000);
    } catch {
      setErreur('Impossible de copier dans le presse-papier');
    }
  };

  // ── Ouverture client mail ────────────────────────────────────────
  const handleOuvrir = () => {
    if (!emailData) return;
    const sujetEncode = encodeURIComponent(emailData.sujet);
    const corpsEncode = encodeURIComponent(corpsEdite);
    window.open(
      `mailto:${emailData.email_destinataire}?subject=${sujetEncode}&body=${corpsEncode}`,
      '_blank'
    );
  };

  // ── Footer ───────────────────────────────────────────────────────
  const footer = (
    <>
      <button type="button" className="form-btn form-btn--cancel" onClick={onClose}>
        Fermer
      </button>
      {emailData && (
        <>
          <button
            type="button"
            className="form-btn form-btn--secondary"
            onClick={handleCopier}
          >
            {copie ? '✅ Copié !' : '📋 Copier'}
          </button>
          <button
            type="button"
            className="form-btn form-btn--save"
            onClick={handleOuvrir}
          >
            📧 Ouvrir dans Mail
          </button>
        </>
      )}
    </>
  );

  return (
    <Modal
      title={`Commande — ${fournisseurNom}`}
      titleIcon={<span>📧</span>}
      onClose={onClose}
      footer={footer}
    >
      {loading && (
        <div className="mepr-loading">
          <span className="mepr-spinner" />
          Génération de l'email…
        </div>
      )}

      {erreur && (
        <div className="form-error-global">⚠️ {erreur}</div>
      )}

      {!loading && emailData && (
        <div className="mepr-contenu">

          {/* Pièces en alerte */}
          {emailData.pieces.length > 0 && (
            <div className="mepr-alertes">
              <p className="mepr-alertes__titre">
                🔩 {emailData.pieces.length} pièce{emailData.pieces.length > 1 ? 's' : ''} à commander
              </p>
              <ul className="mepr-alertes__liste">
                {emailData.pieces.map((p: PieceAlerte) => (
                  <li key={p.id} className="mepr-alertes__item">
                    <span className="mepr-piece-ref">{p.reference}</span>
                    <span className="mepr-piece-nom">{p.nom}</span>
                    <span className="mepr-piece-stock">
                      Stock : {p.stock_actuel} → Commande suggérée : <strong>{p.quantite_suggeree}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Champs email */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Destinataire</label>
              <input
                className="form-input"
                value={emailData.email_destinataire}
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Objet</label>
              <input
                className="form-input"
                value={emailData.sujet}
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corps de l'email</label>
              <p className="form-hint">Vous pouvez modifier le texte avant d'envoyer.</p>
              <textarea
                className="form-input form-textarea mepr-textarea"
                value={corpsEdite}
                onChange={e => setCorpsEdite(e.target.value)}
                rows={12}
              />
            </div>
          </div>

        </div>
      )}

      {!loading && !erreur && emailData?.pieces.length === 0 && (
        <div className="mepr-vide">
          ✅ Aucune pièce en alerte pour ce fournisseur en ce moment.
        </div>
      )}
    </Modal>
  );
};

export default ModalEmailPreRempli;