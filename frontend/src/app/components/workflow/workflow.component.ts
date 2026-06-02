import { Component } from '@angular/core';
import { SectionTitleComponent } from '../section-title/section-title.component';

interface WorkflowStep {
  step: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-workflow',
  imports: [SectionTitleComponent],
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
})
export class WorkflowComponent {
  readonly steps: WorkflowStep[] = [
    {
      step: '01',
      title: 'Анализ задачи',
      description: 'Уточняю требования с заказчиком и QA, декомпозирую на подзадачи, оцениваю риски.',
    },
    {
      step: '02',
      title: 'Проектирование',
      description: 'Продумываю структуру компонентов, API-контракты, состояния UI и edge-cases.',
    },
    {
      step: '03',
      title: 'Разработка + AI',
      description: 'Cursor и ChatGPT ускоряют шаблонный код и рефакторинг. Результат всегда проверяю и дорабатываю вручную.',
    },
    {
      step: '04',
      title: 'Review и тестирование',
      description: 'Code review, ручное тестирование сценариев, обработка ошибок, адаптивность.',
    },
  ];
}
