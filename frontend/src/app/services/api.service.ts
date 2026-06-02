import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AiResponse, AiStatusResponse, ContactFormData, ContactResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  sendContact(data: ContactFormData): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.baseUrl}/contact`, data).pipe(
      timeout(45_000),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(() => ({
            message:
              'Сервер слишком долго не ответил. Часто это «зависший» SMTP — проверьте SMTP_HOST, SMTP_USER, SMTP_PASS в настройках API.',
            status: 0,
          }));
        }
        return this.handleError(err as HttpErrorResponse);
      }),
    );
  }

  getAiStatus(): Observable<AiStatusResponse> {
    return this.http
      .get<AiStatusResponse>(`${this.baseUrl}/ai/status`)
      .pipe(catchError(this.handleError));
  }

  askAi(question: string): Observable<AiResponse> {
    return this.http
      .post<AiResponse>(`${this.baseUrl}/ai/ask`, { question })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Произошла ошибка. Попробуйте позже.';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Нет соединения с сервером. Проверьте, что API запущен.';
    } else if (error.status === 429) {
      message = 'Слишком много запросов. Подождите немного.';
    }

    return throwError(() => ({
      message,
      details: error.error?.details as { field: string; message: string }[] | undefined,
      status: error.status,
    }));
  }
}
