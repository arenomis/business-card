import { Component } from '@angular/core';
import { SectionTitleComponent } from '../section-title/section-title.component';

@Component({
  selector: 'app-about',
  imports: [SectionTitleComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {}
