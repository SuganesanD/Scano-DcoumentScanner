import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { jsPDF } from 'jspdf';
@Component({
  selector: 'app-imageto-pdf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imageto-pdf.component.html',
  styleUrl: './imageto-pdf.component.css'
})
export class ImagetoPdfComponent {
  imageUrls: string[] = []; // Array to store URLs of selected images
  images: HTMLImageElement[] = []; // Array to store Image elements
  currentImageIndex: number = 0;
  stream: MediaStream | null = null;

  constructor() { }

  // Method to handle image selection
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.imageUrls = []; // Clear the previous selected images
      this.images = []; // Clear the previous images

      // Read all selected files
      for (let i = 0; i < input.files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          // Store the data URL
          this.imageUrls.push(e.target?.result as string);
          this.createImage(this.imageUrls.length - 1); // Create an image element for each file
        };
        reader.readAsDataURL(input.files[i]);
      }
    }
  }

  // Create an Image element from the selected file data URL
  createImage(index: number): void {
    const imageUrl = this.imageUrls[index];
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      this.images[index] = img;
    };
  }

  // Method to generate the PDF from the multiple images
  generatePDF(): void {
    if (this.images.length === 0) return; // No images to process

    const pdf = new jsPDF();
    const pageWidth = 210; // A4 page width in mm
    const pageHeight = 297; // A4 page height in mm

    this.images.forEach((img, index) => {
      if (index > 0) {
        pdf.addPage(); // Add a new page for each image after the first
      }

      // Calculate scale to fit image within A4 dimensions
      const scaleX = pageWidth / img.width;
      const scaleY = pageHeight / img.height;
      const scale = Math.min(scaleX, scaleY); // Scale to fit within page while maintaining aspect ratio

      // Calculate new width and height
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;

      // Center the image on the A4 page (optional)
      const xOffset = (pageWidth - newWidth) / 2;
      const yOffset = (pageHeight - newHeight) / 2;

      // Add the image to the PDF
      pdf.addImage(img, 'JPEG', xOffset, yOffset, newWidth, newHeight);
    });

    // Save the generated PDF
    pdf.save('images.pdf');
  }
  async captureImage(): Promise<void> {
    try {
      const videoElement = document.createElement('video');
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });

      videoElement.srcObject = this.stream;
      videoElement.play();

      // Create a canvas to capture the frame from the video
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      videoElement.onloadedmetadata = () => {
        // Set canvas dimensions to video resolution
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        context?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Capture the image as data URL
        const capturedImageUrl = canvas.toDataURL('image/jpeg');
        this.imageUrls.push(capturedImageUrl); // Add captured image URL
        this.createImage(this.imageUrls.length - 1);
        this.stopCamera(); // Create Image element
      };
    } catch (err) {
      console.error('Error accessing camera: ', err);
    }
  }

  goToNextImage(): void {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  // Method to go to the previous image
  goToPreviousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }
  stopCamera(): void {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
  }
  startCamera(): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          this.stream = stream;
          resolve(stream);
        })
        .catch((error) => {
          console.error('Error accessing the camera', error);
          reject(error);
        });
    });
  }
  deleteImage(index: number): void {
    // Remove the image from the images array
    this.images.splice(index, 1);

    // Remove the corresponding URL from the imageUrls array
    this.imageUrls.splice(index, 1);

    // Adjust the current image index if needed
    if (this.currentImageIndex >= this.images.length) {
      this.currentImageIndex = this.images.length - 1; // Ensure the index doesn't go out of bounds
    }
  }

}
