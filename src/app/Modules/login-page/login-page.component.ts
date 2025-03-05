import { Component } from '@angular/core';
import { CouchService } from '../../Services/couch.service';
import { v4 as uuidv4 } from 'uuid';
import {  inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  loginTimes: string = '';
  UserName: string = '';
  PhoneNumber: string = '';
  Email: string = '';
  Password: string = '';
  userid: string = '';
  ConfirmPassword: string = '';
  firstName: string = '';
  lastName: string = '';
  NewPassword: string = '';
  NewConfirmPassword: string = ''

  flag: boolean = false;
  dob: Date = new Date();
  gender: string = '';
  images: string = '';
  loginDetails: string = '';
  passwordMismatch: boolean = true;
  otpInvalid: boolean = false;
  otpTouched: boolean = false;
  enteredOTP: string = '';
  generatedOTP: string = '';
  routerVariable = inject(Router)

  // Flags for form toggling
  showRegistrationPage: boolean = false;
  showLoginPage: boolean = true;
  showForgotPasswordPage: boolean = false;
  showOTPPage: boolean = false;
  showNewPasswordPage: boolean = false;

  generateUuid() {
    this.userid = `user_2_${uuidv4()}`

    console.log("inside the generateUuid");
    console.log(this.userid);


  }
  generateUuidLogin() {
    this.loginTimes = `logindetails_2_${uuidv4()}`
    console.log("inside the generateUuidLogin");
    console.log(this.loginTimes);


  }
  generateUuidLoginDetails() {
    this.loginDetails = uuidv4()
  }
  constructor(readonly couch: CouchService) { }

  // Form toggling methods
  showRegistrationForm() {
    this.showRegistrationPage = true;
    this.showLoginPage = false;
    this.showForgotPasswordPage = false;
    this.showOTPPage = false;
    this.showNewPasswordPage = false;
  }

  showLoginForm() {
    this.showRegistrationPage = false;
    this.showLoginPage = true;
    this.showForgotPasswordPage = false;
    this.showOTPPage = false;
    this.showNewPasswordPage = false;
  }

  showForgotPasswordForm() {
    this.showRegistrationPage = false;
    this.showLoginPage = false;
    this.showForgotPasswordPage = true;
    this.showOTPPage = false;
    this.showNewPasswordPage = false;
  }

  showOTPForm() {
    this.showRegistrationPage = false;
    this.showLoginPage = false;
    this.showForgotPasswordPage = false;
    this.showOTPPage = true;
    this.showNewPasswordPage = false;
  }

  showNewPasswordForm() {
    this.showRegistrationPage = false;
    this.showLoginPage = false;
    this.showForgotPasswordPage = false;
    this.showOTPPage = false;
    this.showNewPasswordPage = true;
  }

  // User Registration
  create() {
    this.couch.getUserDetails().subscribe({
      next: (response: any) => {
        let emailExists = false;

        response.rows.forEach((e: any) => {
          if (e.value.Email === this.Email) {
            emailExists = true;
          }
        });

        if (emailExists) {
          alert('The email address is already in use. Please use a different email.');
        } else {
          this.generateUuid()
          this.generateUuidLoginDetails()
          const data: any = {
            _id: this.userid,
            data: {
              userName: this.UserName,
              phoneNumber: this.PhoneNumber,
              email: this.Email,
              password: this.Password,
              dob: this.dob,
              images: this.images,
              gender: this.gender,
              loginDetails: this.Email,
              firstName: this.firstName,
              lastName: this.lastName,
              type: 'users',
            }
          };




          this.couch.addUser(data).subscribe({
            next: (response) => {
              alert('Register successfully');
              this.resetForm();
              this.showLoginForm();
            },
            error: () => {
              alert('Error occurred registration');
            },
          });

        }
      },
      error: () => {
        alert('Error occurred while verifying user');
      },
    });

  }

  // User Login
  login() {
    this.generateUuidLogin()
    const loginDetails: any = {
      _id: this.loginTimes,
      data: {
        loginDetails: this.Email,
        dob: this.dob,
        type: "logindetails"
      }
    }

    this.couch.validateUserByEmail(this.Email).subscribe({
      next: (response: any) => {
        let status = false;
        console.log(response)
        response.rows.map((e: any) => {
          if (e.value.email === this.Email && e.value.password === this.Password) {
            status = true;
            this.userid=e.value._id
            localStorage.setItem("userId", this.userid)
            
            
            console.log(this.userid)
            this.couch.addLoginDetails(loginDetails).subscribe({
              next: (response) => {
                // alert('loginDetails added successfully');

              },
              error: () => {
                alert('Error occurred loginDetails');
              },
            });


          }
        });

        if (status) {
          alert('Login successful');
          // Navigate to another page after login
          console.log(localStorage.getItem("userId"))
          this.routerVariable.navigate(['home'])
        } else {
          alert('Login failed');
        }
      },
      error: () => {
        alert('Error occurred while verifying user');
      },
    });
    

  }

  // Generate OTP for Forgot Password
  generateOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    alert(`Your OTP is: ${otp}`);  // Display OTP in alert
    return otp;

  }



  // Handle Forget Password
  ForgetPassword() {
    this.generatedOTP = this.generateOTP(); // Generate OTP
    this.showOTPForm(); // Show OTP form

  }

  // Verify OTP for Forgot Password
  verifyOTP() {
    if (this.enteredOTP === this.generatedOTP) {
      this.showNewPasswordForm(); // Show new password form
      this.enteredOTP = ''
    }
  }

  // Reset Password
  resetPassword() {
    if (this.NewPassword === this.NewConfirmPassword) {
      // If the passwords match, update the password in the database
      this.couch.getUserDetails().subscribe({
        next: (response: any) => {
          const existData = response.rows.map((user: any) => user.value).find((user: any) => user.data.email === this.Email)
          console.log(existData);
          const updatedData = { ...existData.data, password: this.NewPassword }
          console.log(updatedData);
          console.log({ ...existData, updatedData });



          this.couch.updatePassword(existData._id, { ...existData, data: updatedData }).subscribe({
            next: (response: any) => {
              alert('Password reset successful');
              // Hide the password reset page and show the login page
              this.showLoginPage = response.value;
              this.showNewPasswordPage = false;
              this.showLoginPage = true;
            },
            error: (error: any) => {
              alert('Error occurred while resetting the password');
            }
          });
        }
      })
    } else {
      this.passwordMismatch = true;
    }


  }


  // Reset Form
  resetForm() {
    this.UserName = '';
    this.Email = '';
    this.Password = '';
    this.ConfirmPassword = '';
    this.PhoneNumber = '';
    this.gender = '';
    this.images = '';
  }


}
