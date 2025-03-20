

  import { CanActivateFn, Router } from '@angular/router';
import { CouchService } from './Services/couch.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  
  const couch=inject(CouchService);
  const router=inject(Router);

  if(couch.isLoggedIn()){
    
    return true;  //allow access
  }
  else{
    router.navigate(['login']);
    return false;
  }
  
};

