import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CouchService } from '../../Services/couch.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-abicard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [CouchService],
  templateUrl: './abicard.component.html',
  styleUrl: './abicard.component.css',
})
export class AbicardComponent implements OnInit {
  activeIndex: number | null = null;
  showAll: boolean = false;
  imageUrl: string = '';
  title: string = '';
  description: string = '';
  duration: string = '';

  sidebarItems: string[] = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  visibleCount: number = 3;
  cardid: string = '';
  newcards: any[] = [];
  visibleCards: any[] = []; // Stores cards to be displayed

  constructor(private Couch: CouchService) {}

  ngOnInit() {
    this.getcarddetails();
  }

  generateuuid() {
    this.cardid = `card_2_${uuidv4()}`; // Removed extra quotes
  }

  getcarddetails() {
    this.Couch.getcardetails().subscribe({
      next: (response: any) => {// Debug API response

        if (response && response.rows && response.rows.length > 0) {
          console.log(response);
          
          // Map the response data into newcards array
          this.newcards = response.rows.map((row: any) => ({
            imageUrl: row.doc.data.imageUrl || 'assets/default.jpg',
            title: row.doc.data.Title || 'No Title',
            description: row.doc.data.Description || 'No Description',
            duration: row.doc.data.Duration || 'N/A',
          }));

          // Initialize visible cards
          this.updateVisibleCards();
          console.log(this.newcards);
          
        }
      },
      error: (error) => {
        console.error('Error fetching card details:', error);
      },
    });
  }

  updateVisibleCards() {
    this.visibleCards = this.showAll ? this.newcards : this.newcards.slice(0, this.visibleCount);
  }

  toggleView() {
    this.showAll = !this.showAll;
    this.updateVisibleCards();
  }

  setActiveIndex(index: number) {
    this.activeIndex = index;
  }

  addcarddetails() {
    this.generateuuid();
    const carddata = {
      _id: this.cardid,
      data: {
        imageUrl: this.imageUrl,
        Title: this.title,
        Description: this.description,
        Duration: this.duration,
        type: 'carddetails',
      },
    };
  
    this.Couch.addcarddetails(carddata).subscribe({
      next: (response) => {
        alert('Card details added successfully!');
        
        // 🔥 Immediately push the new card to the `newcards` array
        const newCard = {
          id: this.cardid,
          imageUrl: this.imageUrl || 'assets/default.jpg',
          title: this.title || 'No Title',
          description: this.description || 'No Description',
          duration: this.duration || 'N/A',
        };
  
        this.newcards.unshift(newCard); // Add the new card at the top
  
        this.updateVisibleCards(); // Update the display
  
        // 🔄 Reset form inputs
        this.imageUrl = '';
        this.title = '';
        this.description = '';
        this.duration = '';
      },
      error: (error) => {
        alert('Oops! Card was not added.');
        console.error('Error adding card:', error);
      },
    });
  }
  
}
