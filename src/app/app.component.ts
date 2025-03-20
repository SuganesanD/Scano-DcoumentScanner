import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, RouterOutlet } from '@angular/router';
import { Router } from "@angular/router";
import { MaincotainerComponent } from "./Modules/maincotainer/maincotainer.component";
import { SidebarComponent } from "./Modules/sidebar/sidebar.component";
import { log } from '@techstark/opencv-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MaincotainerComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Scano';
  isModalOpen: boolean=false;
  logout: boolean=false;
 

  openModal() {
    console.log("inside the openmodal");
    this.isModalOpen = true;
    this.logout=true
  }
  
  // Method to close the modal
  closeModal() {
    this.isModalOpen = false;
    this.logout=false;
  }

  showsidebar: boolean = true;

  constructor(private router: Router) {}

  ngOnInit(): void {// Default: Sidebar is shown

      const hidesidebarroutes = ['/', '/login'];
  
      // ✅ Hide sidebar if the current route matches on first load
      this.showsidebar = !hidesidebarroutes.includes(this.router.url);
  
      // ✅ Subscribe to route changes to update sidebar visibility
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          console.log(event.url);  // Log the current URL
  
          // Hide sidebar if the route matches
          this.showsidebar = !hidesidebarroutes.includes(event.url);
          console.log('Sidebar visible:', this.showsidebar);
        }
      });
    }
}
