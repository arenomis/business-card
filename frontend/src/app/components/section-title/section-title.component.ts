import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  templateUrl: './section-title.component.html',
  styleUrl: './section-title.component.scss',
})
export class SectionTitleComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
}
