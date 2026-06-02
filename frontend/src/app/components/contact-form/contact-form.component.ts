import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { ApiService } from '../../services/api.service';
import { FormStatus } from '../../models';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, SectionTitleComponent],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss',
})
export class ContactFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly status = signal<FormStatus>('idle');
  readonly serverError = signal('');
  readonly serverDetails = signal<{ field: string; message: string }[]>([]);
  readonly successMessage = signal('');
  readonly applicantCopyFailed = signal(false);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    surname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  get f() {
    return this.form.controls;
  }

  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control?.invalid || !control.touched) return null;

    if (control.errors?.['required']) return 'Обязательное поле';
    if (control.errors?.['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `Минимум ${min} символов`;
    }
    if (control.errors?.['maxlength']) return 'Слишком длинное значение';
    if (control.errors?.['email']) return 'Некорректный email';
    if (control.errors?.['pattern']) return 'Некорректный формат';

    return 'Некорректное значение';
  }

  serverFieldError(name: string): string | null {
    const detail = this.serverDetails().find((d) => d.field === name);
    return detail?.message ?? null;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.serverError.set('');
    this.serverDetails.set([]);
    this.applicantCopyFailed.set(false);

    if (this.form.invalid) return;

    this.status.set('loading');

    this.api.sendContact(this.form.getRawValue() as {
      name: string;
      surname: string;
      email: string;
      comment: string;
    }).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
        this.applicantCopyFailed.set(Boolean(res.applicantCopyFailed));
        this.status.set('success');
        this.form.reset();
      },
      error: (err: { message: string; details?: { field: string; message: string }[] }) => {
        this.status.set('error');
        this.serverError.set(err.message);
        if (err.details) {
          this.serverDetails.set(err.details);
        }
      },
    });
  }

  resetForm(): void {
    this.status.set('idle');
    this.serverError.set('');
    this.serverDetails.set([]);
    this.successMessage.set('');
    this.applicantCopyFailed.set(false);
  }
}
