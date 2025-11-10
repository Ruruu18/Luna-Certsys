import { jsPDF } from 'jspdf';
import type {
  ResidentInfo,
  CertificateRequest,
  OfficialInfo,
  BarangayInfo,
} from '@/types/certificate';
import { DEFAULT_BARANGAY_INFO } from '@/types/certificate';

export class BarangayCertificateGenerator {
  private doc: jsPDF;
  private readonly pageWidth = 210; // A4 width in mm
  private readonly pageHeight = 297; // A4 height in mm
  private readonly margin = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  /**
   * Generate Barangay Certification
   */
  async generateCertificate(
    request: CertificateRequest,
    officialInfo: OfficialInfo,
    barangayInfo: BarangayInfo = DEFAULT_BARANGAY_INFO,
  ): Promise<jsPDF> {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    await this.drawHeader(barangayInfo);
    await this.drawWatermark(barangayInfo);
    this.drawTitle();
    this.drawBody(request.residentInfo);
    this.drawPurpose(request.purpose);
    this.drawIssuanceDate(request.issueDate || new Date());
    this.drawSignatures(officialInfo);
    this.drawFooter(officialInfo);

    return this.doc;
  }

  /**
   * Draw the header with official information
   */
  private async drawHeader(barangayInfo: BarangayInfo): Promise<void> {
    const centerX = this.pageWidth / 2;

    // Add seal/logo if provided
    if (barangayInfo.sealUrl) {
      try {
        // Note: In production, you'd load the actual image
        // For now, we'll draw a placeholder circle
        this.doc.circle(30, 25, 15);
        this.doc.setFontSize(8);
        this.doc.text('BARANGAY', 30, 25, { align: 'center' });
        this.doc.text('LUNA', 30, 29, { align: 'center' });
        this.doc.text('SEAL', 30, 33, { align: 'center' });
      } catch (error) {
        console.error('Error loading seal:', error);
      }
    }

    // Republic of the Philippines
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Republic of the Philippines', centerX, 20, { align: 'center' });

    // Region
    this.doc.setFontSize(11);
    this.doc.text(barangayInfo.region, centerX, 26, { align: 'center' });

    // Province
    this.doc.text(barangayInfo.province, centerX, 32, { align: 'center' });

    // City
    this.doc.text(barangayInfo.city, centerX, 38, { align: 'center' });

    // Barangay Name
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(barangayInfo.name, centerX, 44, { align: 'center' });

    // Office title
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('OFFICE OF THE PUNONG BARANGAY', centerX, 52, { align: 'center' });
  }

  /**
   * Draw watermark/seal in the center
   */
  private async drawWatermark(barangayInfo: BarangayInfo): Promise<void> {
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;

    // Set watermark styling with transparency
    this.doc.saveGraphicsState();
    this.doc.setGState({ opacity: 0.1 } as any);
    this.doc.setFontSize(40);
    this.doc.setTextColor(200, 200, 200);

    // Draw circular watermark text
    this.doc.text('SAULOG BARANGAY', centerX, centerY - 10, {
      align: 'center',
      angle: 0,
    });
    this.doc.text('SURIGAO CITY', centerX, centerY + 10, {
      align: 'center',
      angle: 0,
    });

    // Draw large circle
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(2);
    this.doc.circle(centerX, centerY, 50);

    // Reset opacity and colors
    this.doc.restoreGraphicsState();
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Draw the certificate title
   */
  private drawTitle(): void {
    const centerX = this.pageWidth / 2;

    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold-italic');
    this.doc.text('BARANGAY CERTIFICATION', centerX, 70, { align: 'center' });

    // Underline
    this.doc.setLineWidth(0.5);
    this.doc.line(40, 72, 170, 72);
  }

  /**
   * Draw the main body content
   */
  private drawBody(residentInfo: ResidentInfo): void {
    let yPos = 85;

    // TO WHOM IT MAY CONCERN
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TO WHOM IT MAY CONCERN:', this.margin, yPos);

    yPos += 10;

    // Main certification text
    this.doc.setFont('helvetica', 'normal');
    const mainText =
      'This is to certify that, the person whose signature appear herein is a bonafide resident of this ' +
      'Barangay. He/She has never been charged in any kind of offense and has no pending(s) filed before the ' +
      'Lupong Tagapamayapa in this Barangay either civil or criminal case up to date.';

    const splitText = this.doc.splitTextToSize(mainText, this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, yPos);

    yPos += splitText.length * 5 + 10;

    // Draw photo placeholder box (right side)
    const photoX = 150;
    const photoY = yPos - 5;
    this.doc.setDrawColor(0);
    this.doc.setLineWidth(0.3);
    this.doc.rect(photoX, photoY, 35, 35);
    this.doc.setFontSize(8);
    this.doc.text('2x2 Photo', photoX + 17.5, photoY + 17.5, { align: 'center' });

    // Personal Information
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');

    this.doc.text('FULL NAME:', this.margin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(residentInfo.fullName.toUpperCase(), this.margin + 30, yPos);
    yPos += 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ADDRESS:', this.margin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(residentInfo.address, this.margin + 30, yPos);
    yPos += 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DATE OF BIRTH:', this.margin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(residentInfo.dateOfBirth, this.margin + 35, yPos);
    yPos += 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PLACE OF BIRTH:', this.margin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(residentInfo.placeOfBirth, this.margin + 38, yPos);
    yPos += 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GENDER:', this.margin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(residentInfo.gender, this.margin + 25, yPos);
    yPos += 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CIVIL STATUS:', this.margin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(residentInfo.civilStatus, this.margin + 32, yPos);
  }

  /**
   * Draw purpose section
   */
  private drawPurpose(purpose: string): void {
    const yPos = 165;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    const purposeText =
      'This certification is issued upon the request of the above-mentioned person as a requirement for';
    this.doc.text(purposeText, this.margin, yPos);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text(purpose.toUpperCase(), this.margin, yPos + 6);
  }

  /**
   * Draw issuance date
   */
  private drawIssuanceDate(date: Date): void {
    const yPos = 185;
    const centerX = this.pageWidth / 2;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    const dateText = `Issued this ${day} day of ${month}, ${year} at Barangay Luna, Surigao City, Philippines.`;
    const splitText = this.doc.splitTextToSize(dateText, this.pageWidth - 2 * this.margin);
    this.doc.text(splitText, this.margin, yPos);
  }

  /**
   * Draw signature lines
   */
  private drawSignatures(officialInfo: OfficialInfo): void {
    const yPos = 210;
    const leftX = 45;
    const rightX = 145;

    // Signature lines
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, yPos, 80, yPos);
    this.doc.line(130, yPos, 190, yPos);

    // Labels
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('APPLICANT', leftX, yPos + 5, { align: 'center' });
    this.doc.text('Punong Barangay', rightX, yPos + 5, { align: 'center' });

    // Official name
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(officialInfo.punongBarangay.toUpperCase(), rightX, yPos - 2, {
      align: 'center',
    });

    // Year indicator
    const yearText = `2025 - ${new Date().getFullYear()}`;
    this.doc.setFontSize(8);
    this.doc.text(yearText, 175, yPos - 30);
  }

  /**
   * Draw footer with authority section
   */
  private drawFooter(officialInfo: OfficialInfo): void {
    const yPos = 235;
    const centerX = this.pageWidth / 2;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('By the Authority of the Punong Barangay:', centerX, yPos, {
      align: 'center',
    });

    // Kagawad signature line
    this.doc.setLineWidth(0.3);
    this.doc.line(110, yPos + 15, 180, yPos + 15);

    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.text('(SIGNATURE OVER PRINTED NAME)', centerX, yPos + 20, { align: 'center' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Barangay Capitan/Kagawad:', centerX, yPos + 26, { align: 'center' });
    this.doc.text('Capitan/Kagawad on Duty', centerX, yPos + 31, { align: 'center' });

    // Kagawad name
    if (officialInfo.kagawadOnDuty) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(officialInfo.kagawadOnDuty.toUpperCase(), centerX, yPos + 13, {
        align: 'center',
      });
    }
  }

  /**
   * Save the PDF
   */
  save(filename: string = 'Barangay_Certification.pdf'): void {
    this.doc.save(filename);
  }

  /**
   * Get the PDF as blob
   */
  getBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Get the PDF as data URL
   */
  getDataUrl(): string {
    return this.doc.output('dataurlstring');
  }
}

/**
 * Helper function to generate a certificate
 */
export async function generateBarangayCertificate(
  residentInfo: ResidentInfo,
  purpose: string,
  officialInfo: OfficialInfo,
): Promise<jsPDF> {
  const generator = new BarangayCertificateGenerator();

  const request: CertificateRequest = {
    residentInfo,
    purpose,
    requestDate: new Date(),
    issueDate: new Date(),
  };

  return await generator.generateCertificate(request, officialInfo);
}
