import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PaiComponent } from "./componentes/pai/pai.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PaiComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'raio_x_unidades';
}
