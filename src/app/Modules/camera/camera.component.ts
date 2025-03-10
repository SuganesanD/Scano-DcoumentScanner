import { CommonModule } from '@angular/common';
import { Component, ElementRef, output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Tesseract from 'tesseract.js';
import { CouchService } from '../../Services/couch.service';
import { HttpClient } from '@angular/common/http';
import {v4 as uuidv4} from 'uuid';
import { ChatbotService } from '../../Services/chatbot.service';
import * as cv from '@techstark/opencv-js'
import { ChatBotComponent } from "../chat-bot/chat-bot.component";

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatBotComponent],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.css'
})
export class CameraComponent {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  capturedPhoto: string | null = null;
  croppedImage: string = "";
  stream: MediaStream| null=null;
  private context!: CanvasRenderingContext2D;
  extractedText: string = '';
  textExtracted: string = '';
  private startX: number = 0;
  private startY: number = 0;
  private width: number = 0;
  private height: number = 0;
  private isDrawing: boolean = false;
  documentid: any;
  userid:string=localStorage.getItem("userId")||'';
  date:Date=new Date()
  onlyDate = this.date.toISOString().split("T")[0];
  document_name:string='capturedImage';
  finalCapturedPhoto: string='';
  summarizedText: string='';
 extractedTextfinal: string='';
  summarylevel:string="Give me a general paragraph on"
 constructor(readonly couch:CouchService,readonly http: HttpClient,private chat :ChatbotService){}
  ngOnInit(): void {
    this.initializeCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async initializeCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }
  

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      
    }
  }
  selectFullImage() {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
  
    if (ctx) {
        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d');
  
        fullCanvas.width = canvas.width;
        fullCanvas.height = canvas.height;
  
        if (fullCtx) {
            // Copy the entire image
            fullCtx.drawImage(canvas, 0, 0);
  
            // Convert to Data URL and set as cropped image
            this.croppedImage = fullCanvas.toDataURL();
            // Update preview with full image
        }
    }
  
    
  }

  capturePhoto(): void {
    
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedPhoto = canvas.toDataURL('image/png');
      this.context = context;
      console.log("Captured photo: ", this.capturedPhoto);
      this.finalCapturedPhoto=this.capturedPhoto.split(',')[1];
      
      this.stopCamera()
      this.stream=null
      
    }
    console.log(this.stream);
   
    
  }

  retakeButton(){
    this.capturedPhoto=null
    this.initializeCamera()
  

  }
  // Handle mouse events for drawing the cropping rectangle
  onMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    this.startX = event.offsetX;
    this.startY = event.offsetY;
    console.log('Mouse Down:', this.startX, this.startY);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) return;

    const canvas = this.canvasElement.nativeElement;
    const context = this.context;

    this.width = event.offsetX - this.startX;
    this.height = event.offsetY - this.startY;

    // Draw the image and the cropping rectangle
    const image = new Image();
    image.src = this.capturedPhoto!;

    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.strokeStyle = 'green';
      context.lineWidth = 2;
      context.strokeRect(this.startX, this.startY, this.width, this.height);
    };

    console.log('Mouse Move:', { x: event.offsetX, y: event.offsetY, width: this.width, height: this.height });
  }

  onMouseUp(event: MouseEvent): void {
    this.isDrawing = false;
    console.log('Mouse Up:', { x: this.startX, y: this.startY, width: this.width, height: this.height });
  }

  cropImage(): void {
    const canvas = this.canvasElement.nativeElement;
    const croppedCanvas = document.createElement('canvas');
    const croppedContext = croppedCanvas.getContext('2d')!;

    if (this.width === 0 || this.height === 0) {
      console.error('Invalid crop area');
      return;
    } else {
      console.log(this.width + " " + this.height);
    }

    // Create a cropped canvas with the selected area
    croppedCanvas.width = Math.abs(this.width);
    croppedCanvas.height = Math.abs(this.height);

    // Draw the cropped portion of the image
    croppedContext.drawImage(
      canvas,
      this.startX, this.startY, this.width, this.height, // Source rectangle
      0, 0, Math.abs(this.width), Math.abs(this.height) // Destination rectangle
    );

    this.croppedImage = croppedCanvas.toDataURL('image/png'); // Set the cropped image as base64
    console.log('Cropped Image Data URL:', this.croppedImage, croppedCanvas); // Check the cropped image data URL

    // Enhance the quality of the cropped image
   
  }

  // Preprocess Image for better OCR accuracy
  async preprocessImage(imageData: string,factor:number): Promise<string> {
    const img = new Image();
    img.src = imageData;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    // Convert image to OpenCV Mat
    const src = cv.imread(canvas);
    const dst = new cv.Mat();

    // Apply bilateral filter for noise reduction
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);

    // Apply CLAHE for contrast improvement
    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(dst, dst);

    // Apply thresholding
    cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    // Apply morphological operations to further clean the image
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);

    // Convert back to imageData
    cv.imshow(canvas, dst);
    const preprocessedImage = canvas.toDataURL('image/png');

    // Cleanup
    src.delete();
    dst.delete();
    clahe.delete();
    kernel.delete();

    return preprocessedImage 
  }

  // Function to extract text using Tesseract.js
  extractTextFromImage(imageData: string): void {
    if (!imageData) {
      console.error("No image data to process for OCR");
      return;
    }

    console.log("Image : " + imageData);

    // Use Tesseract.js to recognize text from the image
    Tesseract.recognize(imageData, 'eng')
    .then(({ data: { text } }) => {
      this.extractedText=text
      console.log(this.extractedText);
            // this.selectedContents.push(text);
            this.chat.extractedText=this.extractedText
            this.chat.summarylevel=this.summarylevel
            
            
    })
    .catch((error) => console.error('OCR Error:', error));



  

  
}
userMessage: string = '';  // Model for user input
messages: any[] = [];  // Array to store messages

// Send message function


addtocouch(){
  this.generateuuid();
  console.log(this.documentid);
 
  const document_data={
    _id: this.documentid,  
    data:{
    userid: this.userid,  
    uploaded_document_name: this.document_name, 
    summarized_document_name: `summary-${this.document_name}`, 
    date:this.onlyDate,
    summarized_document_content: this.summarizedText, 
    type:"documents"
    }, // Summarized document content
    _attachments: {
      [this.document_name]: {
        content_type: "image/png",  // MIME type of the attachment
        data: this.finalCapturedPhoto
         // Base64 encoded attachment content
      }  
  }
}
console.log(document_data);
console.log(this.capturedPhoto)



  
  if(this.document_name ){
    console.log("inside the add");
    console.log(document_data)
    
  this.couch.add_document(document_data).subscribe({
    next:(response)=>{
      alert("document_data added successfully");
      
      console.log(response);
    },
    error:(error)=>{
      alert("oops! document_data is not added!");
    }
  })
}
}
generateuuid(){
  this.documentid=`document_2_"${uuidv4()}"`;
}

botResponse: string = '';

}



// sendMessage(): void {
//   if (this.extractedText.trim()) {
//     this.extractedTextfinal=this.extractedText
//     // Add user message to the chat
   
    

//     // Get response from the chatbot API
//     this.chat.getResponse(this.extractedText).subscribe(response => {
      
//       this.summarizedText=response.candidates[0].content.parts[0].text
  
    
//     });
//     console.log(this.extractedText);
//     console.log(this.summarizedText)
    
    
    
    


//     // Clear the input field
//     this.extractedText = '';
//   }
// }




