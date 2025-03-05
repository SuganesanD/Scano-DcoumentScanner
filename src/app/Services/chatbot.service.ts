import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  private apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'; // API URL
  private apiKey = 'AIzaSyCyVbR_wd5meTXg8PQ0Ih8eU0akj5J5u8E'; // API key

  constructor(private http: HttpClient) {}

  // Function to send a message to the chatbot API
  getResponse(message: string,summarizelevel?:string): Observable<any> {
    // Define the request body
    const body = {
      contents: [{
        parts: [{
          text: `give me ${summarizelevel} line general paragraph on ${message}`
        }]
      }]
    };

    // Use the API key in the URL
    const urlWithKey = `${this.apiUrl}?key=${this.apiKey}`;

    // Send the POST request to Gemini API
    return this.http.post<any>(urlWithKey, body, { headers: new HttpHeaders().set('Content-Type', 'application/json') });
  }
}
