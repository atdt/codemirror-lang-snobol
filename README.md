# codemirror-lang-snobol

SNOBOL4 syntax highlighting for [CodeMirror 6](https://codemirror.net/),
targeting the [Snoflake](https://github.com/atdt/snoflake) dialect. It is
case-insensitive and supports backtick-delimited multi-line literals, which in
Snoflake carry inline JavaScript: those ranges are highlighted as JavaScript in
place.

It is built on a [Lezer](https://lezer.codemirror.net/) grammar
(`src/syntax.grammar`). SNOBOL4 highlighting does not need a full parse — a
blank is at once the concatenation operator and the field separator, which no
context-free grammar untangles — so the grammar keeps the program a flat token
stream and pushes the one context-sensitive rule, column-one card
classification, into a small external tokenizer (`src/tokens.js`). The backtick
literal is handed to the JavaScript parser via `parseMixed`.

## Install

```sh
npm install codemirror-lang-snobol
```

The CodeMirror packages are peer dependencies.

## Use

```js
import { basicSetup, EditorView } from "codemirror";
import { snobol } from "codemirror-lang-snobol";

new EditorView({
  doc: "       OUTPUT = 'HELLO, WORLD'\nEND\n",
  extensions: [basicSetup, snobol()],
  parent: document.body,
});
```

## License

BSD-2-Clause
