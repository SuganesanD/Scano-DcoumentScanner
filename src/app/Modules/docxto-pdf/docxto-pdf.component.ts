import { Component, ElementRef, ViewChild } from '@angular/core';
import * as mammoth from 'mammoth';

import { jsPDF } from 'jspdf';
@Component({
  selector: 'app-docxto-pdf',
  standalone: true,
  imports: [],
  templateUrl: './docxto-pdf.component.html',
  styleUrl: './docxto-pdf.component.css'
})
export class DocxtoPdfComponent {
  private pdfDoc: jsPDF | null = null;
  public previewContent: string | null = null; // Store the HTML content for preview
  public totalPages: number = 0; // Store total pages
  public currentPage: number = 1; // Store current page

  @ViewChild('previewContainer') previewContainer!: ElementRef;

  constructor() {}

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.docx')) {
      this.convertDocxToHtml(file);  // Convert DOCX to HTML for preview
    } else {
      alert('Please select a valid DOCX file');
    }
  }

  convertDocxToHtml(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer = e.target.result;

      mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
        .then((result: any) => {
          this.previewContent = result.value;  // HTML content for preview
          this.createPagination(result.value); // Create pagination
          const images = result.images;         // Extracted images from DOCX
          this.createPdf(result.value, images); // Create PDF in the background
        })
        .catch((error: any) => {
          console.error('Error extracting DOCX content: ', error);
          alert('Error processing DOCX file');
        });
    };

    reader.readAsArrayBuffer(file);
  }

  createPdf(htmlContent: string, images: any): jsPDF {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const fontSize = 12;
    let currentPage = 1;
  
    doc.setFont('helvetica');
    doc.setFontSize(fontSize);
  
    let verticalPosition = margin + fontSize;
  
    // Convert the structured HTML content into text for PDF rendering.
    const content = this.convertHtmlToPdfContent(htmlContent);
  
    // Add each part of the structured content to the PDF (paragraphs, headings, lists)
    content.forEach(item => {
      if (verticalPosition + fontSize * item.lines.length > pageHeight - margin) {
        this.addPageNumber(doc, currentPage, pageWidth, pageHeight);
        doc.addPage();
        verticalPosition = margin + fontSize;
        currentPage++;
      }
  
      // For paragraphs, headings, or lists, render accordingly
      if (item.type === 'text') {
        item.lines.forEach((line:string)=> {
          doc.text(line, margin, verticalPosition);
          verticalPosition += fontSize;
        });
      } else if (item.type === 'image') {
        doc.addImage(item.imageData, 'JPEG', margin, verticalPosition, 180, 160);
        verticalPosition += 170; // Adjust image spacing
      }
    });
  
    this.addPageNumber(doc, currentPage, pageWidth, pageHeight);  // Add page number to the last page
    this.pdfDoc = doc;  // Assign the created PDF document to the pdfDoc property
  
    return doc;
  }
  
  // Helper function to convert HTML into structured content (paragraphs, headings, lists, etc.)
  convertHtmlToPdfContent(htmlContent: string) {
    const content: Array<any> = [];
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
  
    const children = Array.from(container.childNodes);
  
    children.forEach(child => {
      if (child.nodeName === 'P') {
        content.push({
          type: 'text',
          lines: this.splitTextIntoLines(child.textContent || '')
        });
      } else if (child.nodeName === 'H1' || child.nodeName === 'H2' || child.nodeName === 'H3') {
        content.push({
          type: 'text',
          lines: this.splitTextIntoLines(child.textContent || ''),
          style: 'heading'
        });
      } else if (child.nodeName === 'UL') {
        const listItems = Array.from(child.childNodes).map((li: any) => li.textContent || '');
        listItems.forEach(listItem => {
          content.push({
            type: 'text',
            lines: this.splitTextIntoLines('- ' + listItem)
          });
        });
      } else if (child.nodeName === 'IMG') {
        const imageData = (child as HTMLImageElement).src;
        content.push({
          type: 'image',
          imageData: imageData
        });
      }
    });
  
    return content;
  }
  
  // Helper function to split text into lines based on the page width
  splitTextIntoLines(text: string): string[] {
    const lines = [];
    const maxWidth = 180;  // Maximum width of text in PDF
  
    const doc = new jsPDF();
    lines.push(...doc.splitTextToSize(text, maxWidth));  // Split text into lines
    return lines;
  }
  
  // Utility function to strip HTML tags from the content
  stripHtmlTags(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || ''; // Return plain text without HTML tags
  }

  addPageNumber(doc: jsPDF, pageNumber: number, pageWidth: number, pageHeight: number) {
    const pageNumberText = `Page ${pageNumber}`;
    doc.setFontSize(10);
    const textWidth = doc.getTextDimensions(pageNumberText).w;
    const textX = (pageWidth - textWidth) / 2;
    const textY = pageHeight - 10;
    doc.text(pageNumberText, textX, textY);
  }

  onDownloadClick() {
    if (this.pdfDoc) {
      this.pdfDoc.save('docx-images.pdf');
    } else {
      alert('Please upload a DOCX file first');
    }
  }

  // Create pagination for the preview
  createPagination(htmlContent: string) {
    setTimeout(() => {
      const containerHeight = this.previewContainer.nativeElement.clientHeight;
      const contentHeight = this.previewContainer.nativeElement.scrollHeight;
      this.totalPages = Math.ceil(contentHeight / containerHeight);
      this.currentPage = 1;
    }, 100); // Adjust timeout if needed
  }

  // Navigate to previous page
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToPage();
    }
  }

  // Navigate to next page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToPage();
    }
  }

  // Scroll to the current page
  scrollToPage() {
    const containerHeight = this.previewContainer.nativeElement.clientHeight;
    const scrollPosition = (this.currentPage - 1) * containerHeight;
    this.previewContainer.nativeElement.scrollTop = scrollPosition;
  }

}
