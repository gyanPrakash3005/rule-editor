import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RuleServiceService {
  private rules = new Map<string, string>();

  createRule(name: string, content: string): void {
    this.rules.set(name, content);
  }

  getRule(name: string): string | undefined {
    return this.rules.get(name);
  }

  updateRule(name: string, content: string): void {
    this.rules.set(name, content);
  }

  deleteRule(name: string): void {
    this.rules.delete(name);
  }

  getAllRules(): Array<{ name: string, content: string }> {
    return Array.from(this.rules.entries()).map(([name, content]) => ({ name, content }));
  }
}
