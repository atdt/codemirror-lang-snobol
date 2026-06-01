// SNOBOL4 language support for CodeMirror, built on a stream tokenizer.
//
// SNOBOL4 is line-oriented and column-sensitive. A statement label starts in
// column one, and the characters * | - + . each mean one thing in column one
// and something else inside a statement body. A stream parser reads the text a
// line at a time, so it resolves these the way the language's own tokenizer
// does, by position. We deliberately do not parse statement structure
// (subject, pattern, object): a blank is at once the concatenation operator
// and the field separator, which no context-free grammar untangles, and
// highlighting does not need the distinction.

import { LanguageSupport, StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Built-in functions and the predefined pattern values, matched by name
// wherever they appear. SNOBOL folds case by default, so the lookup is on the
// upper-cased word.
const BUILTINS = new Set( [
    'ANY',
    'APPLY',
    'ARBNO',
    'ARG',
    'ARRAY',
    'BACKSPACE',
    'BREAK',
    'CHAR',
    'CLEAR',
    'CODE',
    'COLLECT',
    'CONVERT',
    'COPY',
    'DATA',
    'DATATYPE',
    'DATE',
    'DEFINE',
    'DETACH',
    'DIFFER',
    'DUMP',
    'DUPL',
    'ENDFILE',
    'EQ',
    'EVAL',
    'EXPRESSION',
    'EXTERNAL',
    'FIELD',
    'FUNCTION',
    'GE',
    'GT',
    'HIDE',
    'IDENT',
    'INTEGER',
    'ITEM',
    'KEYWORD',
    'LABEL',
    'LEN',
    'LGT',
    'LOAD',
    'LOCAL',
    'LT',
    'NAME',
    'NE',
    'NOTANY',
    'OPSYN',
    'ORD',
    'PATTERN',
    'POS',
    'PROTOTYPE',
    'REAL',
    'REMDR',
    'REPLACE',
    'REWIND',
    'RPOS',
    'RTAB',
    'SIZE',
    'SPAN',
    'STOPTR',
    'STRING',
    'SUBSTR',
    'TAB',
    'TABLE',
    'TIME',
    'TRACE',
    'TRIM',
    'UNHIDE',
    'UNLOAD',
    'VALUE',
    // Predefined patterns used as bare names.
    'ARB',
    'BAL',
    'FAIL',
    'FENCE',
    'REM',
    'SUCCEED',
    // The standard input and output association variables.
    'INPUT',
    'OUTPUT',
    'PUNCH',
    'TERMINAL',
] );

// Words that direct control flow. They are meaningful as a goto target and as
// the END that closes the program, and read naturally as keywords elsewhere.
const CONTROL = new Set( [
    'ABORT',
    'END',
    'FRETURN',
    'NRETURN',
    'RETURN',
] );

// A variable name is a letter followed by letters, digits, and the break
// characters _ and . (the dot binds only between alphanumeric runs, so a
// trailing dot stays the name operator).
const NAME = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*/;

// An integer, or a real with digits on both sides of the point. A leading dot
// is therefore the name operator, never the start of a literal.
const NUMBER = /^\d+(?:\.\d+)?/;

function classify( word ) {
    const upper = word.toUpperCase();
    if ( CONTROL.has( upper ) ) return 'controlKeyword';
    if ( BUILTINS.has( upper ) ) return 'builtin';
    return 'variableName';
}

const parser = {
    name: 'snobol',

    startState() {
        return { backtick: false };
    },

    token( stream, state ) {
        // A backtick range is the one literal that may span lines, so finish a
        // pending one before anything else.
        if ( state.backtick ) {
            while ( !stream.eol() ) {
                if ( stream.next() === '`' ) {
                    state.backtick = false;
                    break;
                }
            }
            return 'string';
        }

        if ( stream.sol() ) {
            const col1 = stream.peek();
            if ( col1 === '*' || col1 === '|' ) {
                stream.skipToEnd();
                return 'comment';
            }
            // Listing-control lines: -LIST, -UNLIST, -EJECT, -INCLUDE, ...
            if ( col1 === '-' ) {
                stream.next();
                stream.eatWhile( /[A-Za-z]/ );
                return 'meta';
            }
            // A continuation marker for the previous statement.
            if ( col1 === '+' || col1 === '.' ) {
                stream.next();
                return 'meta';
            }
            // A label fills column one onward and begins with a letter.
            if ( col1 && /[A-Za-z]/.test( col1 ) ) {
                const word = stream.match( NAME )[0];
                return CONTROL.has( word.toUpperCase() )
                    ? 'controlKeyword'
                    : 'labelName';
            }
            // Otherwise the line opens with blanks before the body.
        }

        if ( stream.eatSpace() ) return null;

        const ch = stream.peek();

        // String literals. Single and double quotes stay on one line; a
        // backtick range may run on to a later line.
        if ( ch === "'" || ch === '"' ) {
            stream.next();
            while ( !stream.eol() ) {
                if ( stream.next() === ch ) break;
            }
            return 'string';
        }
        if ( ch === '`' ) {
            stream.next();
            while ( !stream.eol() ) {
                if ( stream.next() === '`' ) return 'string';
            }
            state.backtick = true;
            return 'string';
        }

        // A keyword reference such as &ANCHOR. A bare & is the binary operator.
        if ( ch === '&' ) {
            stream.next();
            return stream.eatWhile( /[A-Za-z]/ ) ? 'keyword' : 'operator';
        }

        if ( stream.match( NUMBER ) ) return 'number';

        const name = stream.match( NAME );
        if ( name ) return classify( name[0] );

        stream.next();
        switch ( ch ) {
            case '(':
            case ')':
                return 'paren';
            case '<':
            case '>':
                return 'angleBracket';
            case ',':
            case ';':
                return 'separator';
            case '*':
                stream.eat( '*' ); // fold ** (exponentiation) into one token
                return 'operator';
            case '~':
            case '?':
            case '$':
            case '!':
            case '%':
            case '/':
            case '#':
            case '+':
            case '-':
            case '@':
            case '|':
            case '=':
            case '.':
                return 'operator';
            case ':':
                return 'controlKeyword';
        }
        return null;
    },

    languageData: {
        commentTokens: { line: '*' },
    },

    tokenTable: {
        comment: t.lineComment,
        string: t.string,
        number: t.number,
        labelName: t.labelName,
        keyword: t.keyword,
        builtin: t.standard( t.variableName ),
        controlKeyword: t.controlKeyword,
        operator: t.operator,
        paren: t.paren,
        angleBracket: t.angleBracket,
        separator: t.separator,
        variableName: t.variableName,
        meta: t.meta,
    },
};

/** The SNOBOL4 language, as a CodeMirror `StreamLanguage`. */
export const snobolLanguage = StreamLanguage.define( parser );

/** SNOBOL4 language support for a CodeMirror editor. */
export function snobol() {
    return new LanguageSupport( snobolLanguage );
}

// Exposed for unit tests that drive the tokenizer directly.
export { parser as snobolStreamParser };
