import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CouchService } from '../../Services/couch.service';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  rev: string='';
  constructor(readonly couch: CouchService) { }
  profileDetail: any = {}
  phoneNumber: string = ''
  userId: string = ''
  images: string = ''
  file: File | null = null
  firstName: string = ''
  lastName: string = ''
  email: string = ''
  gender: string = ''
  phone: string = ''
  userName: string = ''
  isDisableEditing: boolean = true;

  // Add this method in your TestComponent class
  ngOnInit() {
    this.userId = localStorage.getItem("userId")!
    console.log(this.userId);
    this.getProfileDetails()
    

  }

  getProfileDetails(){
    this.couch.getUserDetailById(this.userId).subscribe({
      next: (response: any) => {
        console.log(response)
        this.profileDetail = response.rows[0].doc
        this.email = this.profileDetail.data.email
        this.userName = this.profileDetail.data.userName
        this.gender = this.profileDetail.data.gender
        this.phone = this.profileDetail.data.phone
        this.firstName = this.profileDetail.data.firstName
        this.lastName = this.profileDetail.data.lastName
        this.phoneNumber = this.profileDetail.data.phoneNumber
        this.images = this.profileDetail.data.images
        this.rev=this.profileDetail._rev        
      }
    })
  }
  onImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.images = reader.result as string; // Set image as base64 string
      };
      reader.readAsDataURL(file);
    }
  }
  saveDetail() {
   

    const data = {
      ...this.profileDetail,
      data: {
        ...this.profileDetail.data,
        gender: this.gender,
        firstName: this.firstName,
        lastName: this.lastName,
        phone: this.phone,
        userName: this.userName,
        images: this.images,


      }
     
      

    }
    this.couch.profileUpdate(this.profileDetail._id, data,this.rev).subscribe({
      next: (response) => {
        alert('update successfully')
        this.getProfileDetails()
      
        

      },
      error: () => {
        alert('Please Refresh and try again ');
      },
    });
    this.isDisableEditing = true;
  }
  editProfile() {
    this.isDisableEditing = false;

  }

}
