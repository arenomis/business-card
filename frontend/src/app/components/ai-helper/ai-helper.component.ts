import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { ApiService } from '../../services/api.service';
import { FormStatus } from '../../models';

@Component({
  selector: 'app-ai-helper',
  imports: [FormsModule, SectionTitleComponent],
  templateUrl: './ai-helper.component.html',
  styleUrl: './ai-helper.component.scss',
})
export class AiHelperComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly status = signal<FormStatus>('idle');
  readonly answer = signal('');
  readonly model = signal('');
  readonly errorMessage = signal('');
  readonly displayModel = signal('resume-assistant');

  question = '';

  readonly suggestions = [
    'Почему его стоит взять на работу?',
    'Какой у него стек?',
    'Расскажи про его проект на ММК',
    'Что он сделал с таблицей лесов?',
  ];

  ngOnInit(): void {
    this.api.getAiStatus().subscribe({
      next: (res) => {
        this.displayModel.set(res.model || 'resume-assistant');
      },
      error: () => {
        this.displayModel.set('resume-assistant');
      },
    });
  }

  ask(suggested?: string): void {
    const q = (suggested ?? this.question).trim();
    if (q.length < 5) {
      this.status.set('error');
      this.errorMessage.set('Введите вопрос минимум из 5 символов');
      return;
    }

    this.question = q;
    this.status.set('loading');
    this.errorMessage.set('');
    this.answer.set('');

    this.api.askAi(q).subscribe({
      next: (res) => {
        this.answer.set(res.answer);
        this.model.set(res.model ?? 'resume-assistant');
        this.status.set('success');
      },
      error: (err: { message: string }) => {
        this.errorMessage.set(err.message);
        this.status.set('error');
      },
    });
  }
}
