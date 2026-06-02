// External tokenizer and specializer for the SNOBOL4 grammar.
//
// Two things a context-free token cannot express:
//  - Column one is special. The characters * - + . open a comment, control,
//    or continuation card only at the start of a line, and an identifier
//    there is a statement label. Mid-line the same characters are operators
//    and the identifier is an ordinary variable. cardStart peeks back one
//    character to detect the line start, mirroring Snoflake's CARDTB.
//  - Builtins and control words are recognized case-insensitively, which
//    Lezer's case-sensitive @specialize cannot do. classifyWord folds case.

import { ExternalTokenizer } from "@lezer/lr";
import {
  Builtin,
  Continuation,
  ControlKeyword,
  ControlLine,
  Label,
  LineComment,
} from "./parser.terms.js";
import { BUILTINS, CONTROL } from "./words.js";

const NL = 10, CR = 13, EOF = -1;
const STAR = 42, MINUS = 45, PLUS = 43, DOT = 46, UNDERSCORE = 95;

function isLetter(c) {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

function isWordChar(c) {
  return isLetter(c) || (c >= 48 && c <= 57) || c === UNDERSCORE ||
    c === DOT;
}

function scanToEol(input) {
  while (input.next !== NL && input.next !== CR && input.next !== EOF) {
    input.advance();
  }
}

// Specialize a Word into a builtin or control keyword by case-folded lookup.
// Returns -1 to leave it an ordinary variable name.
export function classifyWord(value) {
  const upper = value.toUpperCase();
  if (CONTROL.has(upper)) return ControlKeyword;
  if (BUILTINS.has(upper)) return Builtin;
  return -1;
}

export const cardStart = new ExternalTokenizer((input) => {
  // Act only in column one: at the start of input or just past a newline.
  const prev = input.peek(-1);
  if (prev !== EOF && prev !== NL && prev !== CR) return;

  const c = input.next;
  if (c === STAR) {
    scanToEol(input);
    input.acceptToken(LineComment);
  } else if (c === MINUS) {
    scanToEol(input);
    input.acceptToken(ControlLine);
  } else if (c === PLUS || c === DOT) {
    input.advance();
    input.acceptToken(Continuation);
  } else if (isLetter(c)) {
    // Read the label without consuming it, so a control word like END
    // can fall through to the Word token and be colored as a keyword.
    let word = "", i = 0;
    for (let ch = input.peek(i); isWordChar(ch); ch = input.peek(++i)) {
      word += String.fromCharCode(ch);
    }
    if (CONTROL.has(word.toUpperCase())) return;
    for (let n = 0; n < i; n++) input.advance();
    input.acceptToken(Label);
  }
});
