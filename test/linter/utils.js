const chalk = require('chalk');

class Logger {
  /** @param {string} title */
  constructor(title) {
    this.title = title;
    this.errors = [];
  }

  /** @param {...unknown} message */
  error(...message) {
    this.errors.push(message.join(' '));
  }

  emit() {
    const errorCount = this.errors.length;
    if (errorCount) {
      console.error(
        chalk`{red   ${this.title} – {bold ${errorCount}} ${
          errorCount === 1 ? 'error' : 'errors'
        }:}`,
      );
      for (const error of this.errors) {
        console.error(`  ${error}`);
      }
    }
  }

  hasErrors() {
    return !!this.errors.length;
  }
}

module.exports = { Logger };
