import { Component, HostListener, signal } from '@angular/core';

interface NavLink {
  label: string;
  fragment: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly navLinks: NavLink[] = [
    { label: 'Обо мне', fragment: 'about' },
    { label: 'Стек', fragment: 'stack' },
    { label: 'Подход', fragment: 'workflow' },
    { label: 'Кейсы', fragment: 'projects' },
    { label: 'AI', fragment: 'ai' },
    { label: 'Контакты', fragment: 'contact' },
  ];

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
