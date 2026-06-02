import { Component } from '@angular/core';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { ProjectCase } from '../../models';

@Component({
  selector: 'app-projects',
  imports: [SectionTitleComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  readonly projects: ProjectCase[] = [
    {
      title: 'Корпоративные системы ММК — Angular + .NET',
      description:
        'Веду развитие нескольких связанных модулей и сервисов для 20 000+ сотрудников: мониторинг оборудования, ремонт техники, администрирование и внутренние процессы. Как fullstack-разработчик отвечаю за ключевые изменения во frontend и backend, включая миграции и продуктовые улучшения.',
      role: 'Fullstack-разработчик (Angular + .NET)',
      stack: ['Angular 20', 'TypeScript', '.NET 8', 'C#', 'REST API', 'PrimeNG', 'SQL'],
      result:
        'Актуальный стек, стабильная работа для тысяч пользователей, измеримый прирост скорости и снижение нагрузки на поддержку',
      highlights: [
        'Миграция фронтенда Angular 11 → 20',
        'Подъём backend ASP.NET 4.7 → .NET 8',
        'Переработка ключевых модулей эксплуатации: оптимизация сценариев и расширение функционала',
        'Модуль ремонта большегрузов с нуля, mobile-first',
        'Оптимизация админки: батчинг запросов и ускорение типовых операций',
        'Обновление ключевых экранов — обращения в Support ↓ в 5 раз',
      ],
    },
  ];
}
