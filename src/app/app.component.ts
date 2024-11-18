import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RuleEditorComponent } from './rule-editor/rule-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RuleEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'rule-editor';
}
