import { RouterModule, Routes } from "@angular/router";
import { AnimesComponent } from "./components/animes/animes.component";
import { NgModule } from "@angular/core";
import { ListaAnimesComponent } from "./components/lista-animes/lista-animes.component";

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'animes',
    pathMatch: 'full'
  },
  {
    path: 'animes',
    component: AnimesComponent
  },
  {
    path: 'lista',
    component: ListaAnimesComponent
  }
]

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
