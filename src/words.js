// Word lists for classifying identifiers. SNOBOL4 does not reserve these
// names (a builtin is just a variable bound to a function), so recognition
// is purely for coloring and is case-insensitive: SNOBOL folds case, so the
// lookup is on the upper-cased word.
//
// The set is deliberately broader than Snoflake's own SIL image. Tokenizing
// follows Snoflake exactly, but for highlighting we recognize the wider
// SNOBOL4/SPITBOL builtin vocabulary so the package reads well against any
// dialect.

// Built-in functions and the predefined pattern values.
export const BUILTINS = new Set([
  "ANY",
  "APPLY",
  "ARBNO",
  "ARG",
  "ARRAY",
  "BACKSPACE",
  "BREAK",
  "CHAR",
  "CLEAR",
  "CODE",
  "COLLECT",
  "CONVERT",
  "COPY",
  "DATA",
  "DATATYPE",
  "DATE",
  "DEFINE",
  "DETACH",
  "DIFFER",
  "DUMP",
  "DUPL",
  "ENDFILE",
  "EQ",
  "EVAL",
  "EXPRESSION",
  "EXTERNAL",
  "FIELD",
  "FUNCTION",
  "GE",
  "GT",
  "HIDE",
  "IDENT",
  "INTEGER",
  "ITEM",
  "KEYWORD",
  "LABEL",
  "LEN",
  "LGT",
  "LOAD",
  "LOCAL",
  "LT",
  "NAME",
  "NE",
  "NOTANY",
  "OPSYN",
  "ORD",
  "PATTERN",
  "POS",
  "PROTOTYPE",
  "REAL",
  "REMDR",
  "REPLACE",
  "REWIND",
  "RPOS",
  "RTAB",
  "SIZE",
  "SPAN",
  "STOPTR",
  "STRING",
  "SUBSTR",
  "TAB",
  "TABLE",
  "TIME",
  "TRACE",
  "TRIM",
  "UNHIDE",
  "UNLOAD",
  "VALUE",
  // Predefined patterns used as bare names.
  "ARB",
  "BAL",
  "FAIL",
  "FENCE",
  "REM",
  "SUCCEED",
  // Standard input and output association variables.
  "INPUT",
  "OUTPUT",
  "PUNCH",
  "TERMINAL",
]);

// Words that direct control flow. Meaningful as a goto target and as the END
// that closes the program, and read naturally as keywords elsewhere.
export const CONTROL = new Set([
  "ABORT",
  "END",
  "FRETURN",
  "NRETURN",
  "RETURN",
]);
