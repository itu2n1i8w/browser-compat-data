'use strict';
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const yargs = require('yargs');
const testStyle = require('./test-style');
const testSchema = require('./test-schema');
const testVersions = require('./test-versions');
const testBrowsers = require('./test-browsers');
const testPrefix = require('./test-prefix');
/** @type {Map<string, string>} */
const filesWithErrors = new Map();

const argv = yargs.alias('version','v')
  .usage('$0 [[--] files...]', false, yargs => {
    return yargs.positional('files...', {
      description: 'The files to lint',
      type: 'string'
    })
  })
  .help().alias('help','h').alias('help','?')
  .parse(process.argv.slice(2));

let hasErrors = false;

/**
 * @param {string[]} files
 */
function load(...files) {
  for (let file of files) {
    if (file.indexOf(__dirname) !== 0) {
      file = path.resolve(__dirname, '..', file);
    }

    if (!fs.existsSync(file)) {
      continue; // Ignore non-existent files
    }

    if (fs.statSync(file).isFile()) {
      if (path.extname(file) === '.json') {
        let hasSyntaxErrors = false,
          hasSchemaErrors = false,
          hasStyleErrors = false,
          hasBrowserErrors = false,
          hasVersionErrors = false,
          hasPrefixErrors = false;
        const relativeFilePath = path.relative(process.cwd(), file);

        const spinner = ora({
          stream: process.stdout,
          text: relativeFilePath
        });

        if (!process.env.CI || String(process.env.CI).toLowerCase() !== 'true') {
          spinner.start();
        }

        const console_error = console.error;
        console.error = (...args) => {
          spinner['stream'] = process.stderr;
          spinner.fail(relativeFilePath);
          console.error = console_error;
          console.error(...args);
        }

        try {
          if (file.indexOf('browsers' + path.sep) !== -1) {
            hasSchemaErrors = testSchema(file, './../schemas/browsers.schema.json');
          } else {
            hasSchemaErrors = testSchema(file);
            hasStyleErrors = testStyle(file);
            hasBrowserErrors = testBrowsers(file);
            hasVersionErrors = testVersions(file);
            hasPrefixErrors = testPrefix(file);
          }
        } catch (e) {
          hasSyntaxErrors = true;
          console.error(e);
        }
        if (hasSyntaxErrors || hasSchemaErrors || hasStyleErrors || hasBrowserErrors || hasVersionErrors || hasPrefixErrors) {
          hasErrors = true;
          filesWithErrors.set(relativeFilePath, file);
        } else {
          console.error = console_error;
          spinner.succeed();
        }
      }

      continue;
    }

    const subFiles = fs.readdirSync(file).map((subfile) => {
      return path.join(file, subfile);
    });

    load(...subFiles);
  }
}

if (argv.files) {
  load.apply(undefined, argv.files);
} else {
  load(
    'api',
    'browsers',
    'css',
    'html',
    'http',
    'svg',
    'javascript',
    'mathml',
    'webdriver',
    'webextensions',
    'xpath',
    'xslt',
  );
}

if (hasErrors) {
  console.warn("");
  console.warn(`Problems in ${filesWithErrors.size} file${filesWithErrors.size > 1 ? 's' : ''}:`);
  for (const [fileName, file] of filesWithErrors) {
    console.warn(fileName);
    try {
      if (file.indexOf('browsers' + path.sep) !== -1) {
        testSchema(file, './../schemas/browsers.schema.json');
      } else {
        testSchema(file);
        testStyle(file);
        testVersions(file);
        testBrowsers(file);
        testPrefix(file);
      }
    } catch (e) {
      console.error(e);
    }
  }
  process.exit(1);
}
