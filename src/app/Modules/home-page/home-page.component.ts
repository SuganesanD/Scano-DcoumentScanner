import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CouchService } from '../../Services/couch.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {
  images: string = ''
  userId:string=''
  profileDetail:any=[]
  isModalOpen:boolean=false
  constructor(readonly couch:CouchService){}
  ngOnInit() {
    this.userId = localStorage.getItem("userId")!
    console.log(this.userId);

    console.log(this.userId)
    this.couch.getUserDetailById(this.userId).subscribe({
      next: (response: any) => {
        console.log(response)
        this.profileDetail = response.rows[0].value
        this.images = this.profileDetail.data.images
      }
    });
}
openModal() {
  this.isModalOpen = true;
}

// Method to close the modal
closeModal() {
  this.isModalOpen = false;
}

}
