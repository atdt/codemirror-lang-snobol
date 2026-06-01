import assert from "node:assert/strict";
import { test } from "node:test";

import { StringStream } from "@codemirror/language";

import { snobolStreamParser as parser } from "../src/index.js";

// Drive the stream parser over a whole program, returning every token as a
// [text, style] pair. State carries across lines, as it does in the editor, so
// a backtick range can open on one line and close on another.
function tokenize(source) {
  const state = parser.startState();
  const tokens = [];
  for (const line of source.split("\n")) {
    const stream = new StringStream(line, 4, 4);
    while (!stream.eol()) {
      stream.start = stream.pos;
      const style = parser.token(stream, state) ?? null;
      if (stream.pos === stream.start) stream.pos++; // guard non-advance
      tokens.push([stream.current(), style]);
    }
  }
  return tokens;
}

// All [text, style] pairs whose text, trimmed, is non-empty.
function meaningful(source) {
  return tokenize(source).filter(([text]) => text.trim() !== "");
}

// The style the parser assigns to the first occurrence of `text`.
function styleOf(source, text) {
  const hit = tokenize(source).find(([t]) => t === text);
  assert.ok(hit, `token ${JSON.stringify(text)} not found`);
  return hit[1];
}

test("comment lines start in column one", () => {
  assert.equal(styleOf("* a remark", "* a remark"), "comment");
  assert.equal(styleOf("| also a remark", "| also a remark"), "comment");
});

test("a leading-column word is a label", () => {
  assert.equal(styleOf("START  X = 1", "START"), "labelName");
});

test("END that closes the program is a control keyword", () => {
  assert.equal(styleOf("END", "END"), "controlKeyword");
});

test("keyword references carry the & sigil", () => {
  assert.equal(styleOf(" &ANCHOR = 1", "&ANCHOR"), "keyword");
});

test("a bare ampersand is the binary operator", () => {
  assert.equal(styleOf(" X = A & B", "&"), "operator");
});

test("built-in functions are recognized by name", () => {
  assert.equal(styleOf(" X LEN(3) . Y", "LEN"), "builtin");
  assert.equal(styleOf(" X = SPAN('0123456789')", "SPAN"), "builtin");
});

test("plain identifiers are variable names", () => {
  assert.equal(styleOf(" FOO = BAR", "FOO"), "variableName");
});

test("numbers, integer and real", () => {
  assert.equal(styleOf(" X = 42", "42"), "number");
  assert.equal(styleOf(" X = 3.14", "3.14"), "number");
});

test("single and double quoted strings", () => {
  assert.equal(styleOf(" X = 'hello'", "'hello'"), "string");
  assert.equal(styleOf(' X = "hi"', '"hi"'), "string");
});

test("goto punctuation reads as control", () => {
  const styles = Object.fromEntries(meaningful(" X = Y :S(LOOP)F(DONE)"));
  assert.equal(styles[":"], "controlKeyword");
  assert.equal(styles["("], "paren");
});

test("continuation marker in column one", () => {
  assert.equal(styleOf("+ X", "+"), "meta");
  assert.equal(styleOf(". X", "."), "meta");
});

test("listing-control lines", () => {
  assert.equal(styleOf("-LIST", "-LIST"), "meta");
});

test("exponentiation folds into one operator token", () => {
  assert.equal(styleOf(" X = A ** B", "**"), "operator");
});

test("backtick ranges span lines", () => {
  const tokens = tokenize(" X = `line one\nstill the string` Y");
  // Every piece up to and including the closing backtick is one string.
  assert.equal(
    styleOf(" X = `line one\nstill the string` Y", "`line one"),
    "string",
  );
  const closing = tokens.find(([t]) => t === "still the string`");
  assert.ok(closing, "closing backtick line not tokenized");
  assert.equal(closing[1], "string");
  // After the range closes, normal tokenizing resumes.
  assert.ok(tokens.some(([t, s]) => t === "Y" && s === "variableName"));
});
