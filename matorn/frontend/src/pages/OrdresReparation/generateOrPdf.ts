// /frontend/src/pages/OrdresReparation/generateOrPdf.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Capture l'élément HTML `elementId` et génère un PDF A4.
 * Gère automatiquement la pagination si le contenu dépasse une page.
 */
export const generateOrPdf = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Élément #${elementId} introuvable dans le DOM`);

  const canvas = await html2canvas(element, {
    scale: 2,              // qualité retina
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth  = pdf.internal.pageSize.getWidth();   // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight();  // 297mm

  // Hauteur de l'image mise à l'échelle de la largeur A4
  const imgRatio  = canvas.height / canvas.width;
  const imgHeight = pageWidth * imgRatio;

  if (imgHeight <= pageHeight + 0.5) {
    // Tient sur une seule page
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
  } else {
    // Multi-page : on découpe l'image en tranches de hauteur pageHeight
    let yOffset = 0;
    let remaining = imgHeight;

    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, -yOffset, pageWidth, imgHeight);
      yOffset    += pageHeight;
      remaining  -= pageHeight;
      if (remaining > 0) pdf.addPage();
    }
  }

  pdf.save(filename);
};
