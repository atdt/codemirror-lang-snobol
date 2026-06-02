// SNOBOL4 language support for CodeMirror, built on a Lezer grammar.
//
// SNOBOL4 is line-oriented and column-sensitive: the characters * - + . each
// mean one thing in column one and another inside a statement, and a label
// starts in column one. The grammar keeps the program a flat token stream
// (highlighting does not need statement structure) and pushes the column-one
// rules into an external tokenizer. See src/syntax.grammar and src/tokens.js.
//
// The Snoflake dialect carries inline JavaScript in backtick literals; those
// ranges are handed to the JavaScript parser through parseMixed, so the JS
// is highlighted in place without the SNOBOL grammar knowing any JS.

import { parser as jsParser } from "@lezer/javascript";
import { parseMixed } from "@lezer/common";
import { LanguageSupport, LRLanguage } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser } from "./parser.js";

// Hand the inside of a backtick literal to the JavaScript parser. The
// delimiting backticks are excluded; an unterminated literal has no closing
// backtick to trim.
const mixedJs = parseMixed((node, input) => {
  if (node.name !== "BacktickString") return null;
  const from = node.from + 1;
  const closed = node.to - node.from > 1 &&
    input.read(node.to - 1, node.to) === "`";
  const to = closed ? node.to - 1 : node.to;
  return to > from ? { parser: jsParser, overlay: [{ from, to }] } : null;
});

const snobolParser = parser.configure({
  props: [
    styleTags({
      LineComment: t.lineComment,
      ControlLine: t.meta,
      Continuation: t.meta,
      Label: t.labelName,
      ControlKeyword: t.controlKeyword,
      Builtin: t.standard(t.variableName),
      Keyword: t.keyword,
      Word: t.variableName,
      Number: t.number,
      String: t.string,
      BacktickString: t.special(t.string),
      Operator: t.operator,
      Colon: t.controlKeyword,
      "( )": t.paren,
      "[ ]": t.squareBracket,
      "< >": t.angleBracket,
      ", ;": t.separator,
    }),
  ],
  wrap: mixedJs,
});

/** The SNOBOL4 language, as a CodeMirror `LRLanguage`. */
export const snobolLanguage = LRLanguage.define({
  name: "snobol",
  parser: snobolParser,
  languageData: {
    commentTokens: { line: "*" },
  },
});

/** SNOBOL4 language support for a CodeMirror editor. */
export function snobol() {
  return new LanguageSupport(snobolLanguage);
}
