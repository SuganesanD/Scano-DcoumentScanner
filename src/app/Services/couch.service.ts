import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CouchService {

  private readonly baseURL = 'https://192.168.57.185:5984/scano'; // Ensure this URL is correct
  private readonly userName = 'd_couchdb';
  private readonly password = 'Welcome#2';

  private readonly headers = new HttpHeaders({
    'Authorization': 'Basic ' + btoa(`${this.userName}:${this.password}`),
    'Content-Type': 'application/json'
  });



  constructor(private http: HttpClient) {}

  // Add a document to the database
  add_document(document_data: any): Observable<any> {
    const url = `${this.baseURL}`;
    return this.http.post<any>(url, document_data, { headers: this.headers }).pipe(
      catchError((error) => {
        console.error('Error in add_document:', error);
        throw error;
      })
    );
  }

  // Fetch all documents from the database
  get_document(userid: string) {
    console.log('Fetching documents for:', userid);
    const url = `${this.baseURL}/_design/view/_view/documents_by_userid?include_docs=true&attachments=true&key="${userid}"`;
    return this.http.get<any>(url, { headers: this.headers });
}
addUser(data: any) {
  return this.http.post<any>(this.baseURL, data, { headers: this.headers });
}
profileUpdate(id:string,data:any,rev:any){
  const updatedData={...data,_rev:rev};
  return this.http.put<any>(`${this.baseURL}/${id}`,updatedData, { headers: this.headers })
}
addLoginDetails(data: any) {
  return this.http.post<any>(this.baseURL, data, { headers: this.headers });
}

getUserDetailById(_id: string) {
  return this.http.get<any>(`https://192.168.57.185:5984/scano/_design/view/_view/users_by_id?include_docs=true&key="${_id}"`, { headers: this.headers });
}

updatePassword(_id: string, data: any) {
  // Fetch the user's current data from CouchDB
  return this.http.put<any>(`https://192.168.57.185:5984/scano/${_id}`, data, { headers: this.headers });
}
validateUserByEmail(email: string) {
  return this.http.get<any>(`https://192.168.57.185:5984/scano/_design/view/_view/authenticate_by_email?key="${email}"`, { headers: this.headers });
}



isLoggedIn(): boolean {
  return localStorage.getItem('userId') !== null;
}
logout(): void {
  localStorage.removeItem('userId');  // Remove the token
}
}
