import assert from "node:assert/strict";
import { test } from "node:test";
import { classHighlighter, highlightTree } from "@lezer/highlight";

import { snobolLanguage } from "../src/index.js";

const parse = (src) => snobolLanguage.parser.parse(src);

// The grammar node covering the first occurrence of `text`. Tokenizing is
// what the package is for, so the tests assert node names directly.
function nameOf(src, text) {
  const at = src.indexOf(text);
  assert.ok(at >= 0, `text ${JSON.stringify(text)} not in source`);
  const end = at + text.length;
  let name;
  parse(src).iterate({
    from: at,
    to: end,
    enter(n) {
      if (n.from === at && n.to === end) name = n.name;
    },
  });
  assert.ok(name, `no node exactly covers ${JSON.stringify(text)}`);
  return name;
}

// Every error node's text, for asserting a program tokenizes cleanly.
function errors(src) {
  const out = [];
  parse(src).iterate({
    enter(n) {
      if (n.type.isError) out.push(src.slice(n.from, n.to));
    },
  });
  return out;
}

test("comment lines start in column one", () => {
  assert.equal(nameOf("* a remark", "* a remark"), "LineComment");
});

test("column-one bar is the operator, not a comment (Snoflake dialect)", () => {
  // Unlike SPITBOL, Snoflake treats | only as alternation.
  assert.equal(nameOf("| X", "|"), "Operator");
});

test("a leading-column word is a label", () => {
  assert.equal(nameOf("START  X = 1", "START"), "Label");
});

test("END that closes the program is a control keyword", () => {
  assert.equal(nameOf("END", "END"), "ControlKeyword");
});

test("keyword references carry the & sigil", () => {
  assert.equal(nameOf(" &ANCHOR = 1", "&ANCHOR"), "Keyword");
});

test("a bare ampersand is the binary operator", () => {
  assert.equal(nameOf(" X = A & B", "&"), "Operator");
});

test("built-in functions are recognized by name", () => {
  assert.equal(nameOf(" X LEN(3) . Y", "LEN"), "Builtin");
  assert.equal(nameOf(" X = SPAN('0123456789')", "SPAN"), "Builtin");
});

test("plain identifiers are variable names", () => {
  assert.equal(nameOf(" FOO = BAR", "FOO"), "Word");
});

test("a dotted name is one word", () => {
  assert.equal(nameOf(" X.Y = 1", "X.Y"), "Word");
});

test("numbers, integer and real", () => {
  assert.equal(nameOf(" X = 42", "42"), "Number");
  assert.equal(nameOf(" X = 3.14", "3.14"), "Number");
});

test("single and double quoted strings", () => {
  assert.equal(nameOf(" X = 'hello'", "'hello'"), "String");
  assert.equal(nameOf(' X = "hi"', '"hi"'), "String");
});

test("goto colon reads as control", () => {
  assert.equal(nameOf(" X = Y :S(LOOP)F(DONE)", ":"), "Colon");
});

test("continuation marker in column one", () => {
  assert.equal(nameOf("+ X", "+"), "Continuation");
  assert.equal(nameOf(". X", "."), "Continuation");
});

test("listing-control lines", () => {
  assert.equal(nameOf("-LIST", "-LIST"), "ControlLine");
});

test("exponentiation folds into one operator token", () => {
  assert.equal(nameOf(" X = A ** B", "**"), "Operator");
});

test("a backtick range spans lines as one literal", () => {
  const src = " X = `line one\nstill the string` Y";
  assert.equal(nameOf(src, "`line one\nstill the string`"), "BacktickString");
  assert.deepEqual(errors(src), []);
});

test("inline JavaScript inside a backtick is highlighted as JS", () => {
  const src = " LOAD('F()',`function () { return 1; }`)";
  const tree = parse(src);
  const classes = [];
  highlightTree(tree, classHighlighter, (from, to, cls) => {
    classes.push({ text: src.slice(from, to), cls });
  });
  const fn = classes.find((c) => c.text === "function");
  assert.ok(fn, "JS keyword not surfaced from inside the backtick");
  assert.match(fn.cls, /tok-keyword/);
});

test("a representative program tokenizes without errors", () => {
  const src = [
    "* greet the world",
    "LOOP    OUTPUT = 'hello' &ANCHOR  :S(LOOP)F(END)",
    "        N = N + 1",
    "END",
  ].join("\n");
  assert.deepEqual(errors(src), []);
});
