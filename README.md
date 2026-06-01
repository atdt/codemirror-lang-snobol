# codemirror-lang-snobol

SNOBOL4 syntax highlighting for [CodeMirror 6](https://codemirror.net/). It
supports case folding and backtick-delimited multi-line string literals (a
Snoflake extension; see <https://github.com/atdt/snoflake>).

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
