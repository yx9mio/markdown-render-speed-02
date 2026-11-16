// Synchronous, default-options entry point for the specialized marked fork.
// Every call receives fresh lexer and renderer state, including link definitions.
import { Lexer, Parser, getDefaults } from './marked-core.js';

export function parse(markdown) {
  const options = getDefaults();
  const tokens = new Lexer(options).lex(markdown);
  return new Parser(options).parse(tokens);
}
