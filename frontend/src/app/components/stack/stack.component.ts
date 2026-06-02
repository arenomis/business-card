import { Component } from '@angular/core';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { StackItem } from '../../models';

@Component({
  selector: 'app-stack',
  imports: [SectionTitleComponent],
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.scss',
})
export class StackComponent {
  readonly items: StackItem[] = [
    { name: 'Angular', level: 95, category: 'Framework' },
    { name: 'TypeScript', level: 90, category: 'Language' },
    { name: 'SCSS / CSS', level: 88, category: 'Styling' },
    { name: 'PrimeNG', level: 85, category: 'UI Library' },
    { name: '.NET 8 / C#', level: 78, category: 'Backend' },
    { name: 'REST API', level: 90, category: 'Integration' },
    { name: 'Git / GitLab', level: 88, category: 'Tools' },
    { name: 'Docker', level: 70, category: 'DevOps' },
    { name: 'Bootstrap', level: 82, category: 'UI Library' },
  ];

  readonly categories = [...new Set(this.items.map((i) => i.category))];
}
