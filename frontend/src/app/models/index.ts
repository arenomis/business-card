export interface ContactFormData {
  name: string;
  surname: string;
  email: string;
  comment: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  mocked?: boolean;
  ethereal?: boolean;
  transport?: string;
  details?: { field: string; message: string }[];
}

export interface AiResponse {
  success: boolean;
  answer: string;
  model?: string;
  provider?: 'resume-assistant';
}

export interface AiStatusResponse {
  success: boolean;
  assistantReady: boolean;
  llmConfigured: boolean;
  llmProvider: string | null;
  model: string;
  openaiConfigured: boolean;
}

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ProjectCase {
  title: string;
  description: string;
  role: string;
  stack: string[];
  result: string;
  highlights?: string[];
}

export interface StackItem {
  name: string;
  level: number;
  category: string;
}
