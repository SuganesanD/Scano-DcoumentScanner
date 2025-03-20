import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CouchService } from '../../Services/couch.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  images: string = ''
  userId:string=''
  profileDetail:any=[]
  isModalOpen:boolean=false
  logout: boolean=false;
router=inject(Router)
  constructor(readonly couch:CouchService){}
  ngOnInit(){
    this.userId = localStorage.getItem("userId")!
    console.log(this.userId);

    console.log(this.userId)
    this.couch.getUserDetailById(this.userId).subscribe({
      next: (response: any) => {
        console.log(response)
        this.profileDetail = response.rows[0].doc
        this.images = this.profileDetail.data.images
      }
    });
  }

  menuItems = ['Home', 'Profile', 'File History'];  // Example items
  selectedItem: string | null = null;


  setActive(menuItem: string): void {
    this.selectedItem = menuItem;
    if(this.selectedItem=="Home"){
      this.router.navigate(["Home"])
    }
    else if(this.selectedItem=="Profile"){
      this.router.navigate(["Profile"])
    }
    else if(this.selectedItem=="File History"){
      this.router.navigate(["FileHistory"])
    }
  }
 
   openModal() {
   
    this.isModalOpen = true;
  }
  
  // Method to close the modal
  closeModal() {
    this.isModalOpen = false;
    this.logout=false;
  }
  logOut() {
    // Perform logout logic (e.g., clear session, navigate to login)
    console.log('User logged out');
    this.isModalOpen = false;
    localStorage.removeItem(this.userId)
    this.router.navigate(['/login']); // Redirect to login page
  }

}
