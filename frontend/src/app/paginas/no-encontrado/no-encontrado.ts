import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CanaguateMarkComponent } from '../../comun/canaguate-mark/canaguate-mark';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, CanaguateMarkComponent],
  templateUrl: './no-encontrado.html',
  styleUrl: './no-encontrado.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontradoComponent {}
