import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { StackComponent } from '../../components/stack/stack.component';
import { WorkflowComponent } from '../../components/workflow/workflow.component';
import { ProjectsComponent } from '../../components/projects/projects.component';
import { AiHelperComponent } from '../../components/ai-helper/ai-helper.component';
import { ContactFormComponent } from '../../components/contact-form/contact-form.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-landing',
  imports: [
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    StackComponent,
    WorkflowComponent,
    ProjectsComponent,
    AiHelperComponent,
    ContactFormComponent,
    FooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {}
