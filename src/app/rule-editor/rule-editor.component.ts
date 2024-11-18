import {
  Component,
  AfterViewInit,
  OnInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare const monaco: any;

@Component({
  selector: 'app-rule-editor',
  standalone: true,
  templateUrl: './rule-editor.component.html',
  styleUrls: ['./rule-editor.component.css'],
})
export class RuleEditorComponent implements AfterViewInit, OnInit {
  code: string = '';
  rules: Array<{ name: string; content: string }> = [];
  editorInstance: any;

  constructor(
    //private ruleService: RuleService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // this.rules = this.ruleService.getAllRules();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMonacoEditor();
    }
  }

  loadMonacoEditor() {
    const onGotAmdLoader = () => {
      (window as any).require.config({ paths: { vs: 'assets/monaco/vs' } });
      (window as any).require(['vs/editor/editor.main'], () => {
        this.initMonacoEditor();
      });
    };

    if (!(window as any).require) {
      const loaderScript = document.createElement('script');
      loaderScript.type = 'text/javascript';
      loaderScript.src = 'assets/monaco/vs/loader.js';
      loaderScript.addEventListener('load', onGotAmdLoader);
      document.body.appendChild(loaderScript);
    } else {
      onGotAmdLoader();
    }
  }

  initMonacoEditor() {
    monaco.languages.register({ id: 'yaraL2' });

    monaco.languages.setMonarchTokensProvider('yaraL2', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\/\*[\s\S]*?\*\//, 'comment'],
          [/\b(rule|meta|strings|condition|import|include)\b/, 'keyword'],
          [/\b(true|false)\b/, 'constant'],
          [/".*?"/, 'string'],
          [/\$[a-zA-Z_]\w*/, 'variable'],
          [/[{}[\]()<>!=+\-*/%,.:;]/, 'delimiter'],
          [/\b\d+\b/, 'number'],
        ],
      },
    });

    monaco.languages.setLanguageConfiguration('yaraL2', {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
    });

    const generalSuggestions = [
      {
        label: 'rule_template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: `rule \${1:rule_name} {\n  meta:\n    description = "\${2:description}"\n    author = "\${3:author}"\n  strings:\n    \${4:string_definitions}\n  condition:\n    \${5:condition}\n}`,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Insert a full rule template with placeholders',
      },
    ];

    const metaSuggestions = [
      {
        label: 'description',
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: 'description = "${1:description}"',
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Description of the rule',
      },
      {
        label: 'author',
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: 'author = "${1:author}"',
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Author of the rule',
      },
    ];

    const conditionSuggestions = [
      {
        label: 'nested_condition',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: `condition:\n  any of ($\{1:variables}) or \n  all of ($\{2:variables})`,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Nested condition with "any" and "all" operators',
      },
    ];

    const stringSuggestions = [
      {
        label: '$string_variable',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: '$string_name = "value"',
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a string variable',
      },
      {
        label: '$regex_string',
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: '$string_name = /regex/',
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Define a regex string',
      },
    ];

    monaco.languages.registerCompletionItemProvider('yaraL2', {
      triggerCharacters: [':', '{', '$', '>', '<', '='],
      provideCompletionItems: (model: any, position: any) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const inMetaSection = /meta:\s*$/m.test(textUntilPosition);
        const inConditionSection = /condition:\s*$/m.test(textUntilPosition);
        const inStringSection = /strings:\s*$/m.test(textUntilPosition);

        const suggestions = [];
        if (inMetaSection) {
          suggestions.push(...metaSuggestions);
        } else if (inConditionSection) {
          suggestions.push(...conditionSuggestions);
        } else if (inStringSection) {
          suggestions.push(...stringSuggestions);
        } else {
          suggestions.push(...generalSuggestions);
        }

        const variableSuggestions = [];
        const variableRegex = /\$([a-zA-Z_]\w*)/g;
        const text = model.getValue();
        let match;
        while ((match = variableRegex.exec(text)) !== null) {
          variableSuggestions.push({
            label: `$${match[1]}`,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: `$${match[1]}`,
            documentation: `Reference to variable $${match[1]}`,
          });
        }

        return { suggestions: [...suggestions, ...variableSuggestions] };
      },
    });

    const editorElement = document.getElementById('editor');
    if (editorElement) {
      this.editorInstance = monaco.editor.create(editorElement, {
        value: `rule example {
          meta:
            description = "This is an example YARA rule"
            author = "user"
          strings:
            $a = "example"
          condition:
            $a
        }`,
        language: 'yaraL2',
        theme: 'vs-dark',
      });
    }

    this.setupValidation();
  }

  setupValidation() {
    monaco.editor.onDidChangeModelContent((event: any) => {
      const code = this.editorInstance.getValue();
      const markers: any[] = [];

      // Check for required sections
      if (!/meta:/.test(code)) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Missing "meta:" section',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        });
      }
      if (!/strings:/.test(code)) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Missing "strings:" section',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        });
      }
      if (!/condition:/.test(code)) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Missing "condition:" section',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        });
      }

      // Check for unbalanced brackets and quotes
      if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Unbalanced curly brackets',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        });
      }
      if ((code.match(/"/g) || []).length % 2 !== 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Unmatched quotes',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        });
      }

      // Check for undefined variables in condition
      const definedStrings = Array.from(code.matchAll(/\$([a-zA-Z_]\w*)/g)).map(
        (match: any) => match[1]
      );
      const usedVariables = Array.from(
        code.matchAll(/\bcondition:\s*([\s\S]+)/)
      ).flatMap((match: any) => match[1].match(/\$([a-zA-Z_]\w*)/g) || []);
      usedVariables.forEach((varName) => {
        if (!definedStrings.includes(varName.slice(1))) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `Undefined variable ${varName} in condition`,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
          });
        }
      });

      monaco.editor.setModelMarkers(
        this.editorInstance.getModel(),
        'owner',
        markers
      );
    });
  }

}
