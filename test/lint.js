var fs = require('fs');
var path = require('path');
var Ajv = require('ajv');
var ajv = new Ajv({ allErrors: true });
var hasErrors = false;

function jsonDiff(actual, expected) {
  var actualLines = actual.split(/\n/);
  var expectedLines = expected.split(/\n/);

  for (var i = 0; i < actualLines.length; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      return [
        '#' + i + '\x1b[0m',
        '    Actual:   ' + actualLines[i],
        '    Expected: ' + expectedLines[i]
      ].join('\n');
    }
  }
}

function checkStyle(filename) {
  var actual = fs.readFileSync(filename, 'utf-8').trim();
  var expected = JSON.stringify(JSON.parse(actual), null, 2);

  var platform = require("os").platform;
  if (platform() == "win32") { // prevent false positives from git.core.autocrlf on Windows
    actual = actual.replace(/\r/g, "");
    expected = expected.replace(/\r/g, "");
  }

  if (actual === expected) {
    console.log('\x1b[32m  Style – OK \x1b[0m');
  } else {
    hasErrors = true;
    console.log('\x1b[31m  Style – Error on line ' + jsonDiff(actual, expected));
  }

  let bugzillaMatch = actual.match(String.raw`https?://bugzilla\.mozilla\.org/show_bug\.cgi\?id=(\d+)`);
  if (bugzillaMatch) {
    // use https://bugzil.la/1000000 instead
    hasErrors = true;
    console.log('\x1b[33m  Style – Use shortenable URL (%s → https://bugzil.la/%s).\x1b[0m', bugzillaMatch[0],
      bugzillaMatch[1]);
  }

  let crbugMatch = actual.match(String.raw`https?://bugs\.chromium\.org/p/chromium/issues/detail\?id=(\d+)`);
  if (crbugMatch) {
    // use https://crbug.com/100000 instead
    hasErrors = true;
    console.log('\x1b[33m  Style – Use shortenable URL (%s → https://crbug.com/%s).\x1b[0m', crbugMatch[0],
      crbugMatch[1]);
  }

  let mdnUrlMatch = actual.match(String.raw`https?://developer.mozilla.org/(\w\w-\w\w)/(.*?)(?=["'\s])`)
  if (mdnUrlMatch) {
    hasErrors = true;
    console.log(
      '\x1b[33m  Style – Use non-localized MDN URL (%s → https://developer.mozilla.org/%s).\x1b[0m',
      mdnUrlMatch[0],
      mdnUrlMatch[2]);
  }

  if (actual.includes("href=\\\"")) {
    hasErrors = true;
    console.log('\x1b[33m  Style – Found \\\" but expected \' for <a href>.\x1b[0m');
  }}

function checkSchema(dataFilename) {
  var schemaFilename = '../compat-data.schema.json';
  var valid = ajv.validate(
    require(schemaFilename),
    require(dataFilename)
  );

  if (valid) {
    console.log('\x1b[32m  JSON schema – OK \x1b[0m');
  } else {
    hasErrors = true;
    console.log('\x1b[31m  JSON schema – ' + ajv.errors.length + ' error(s)\x1b[0m');
    console.log('   ' + ajv.errorsText(ajv.errors, {
      separator: '\n    ',
      dataVar: 'item'
    }));
  }
}


function load(...files) {
  for (let file of files) {
    if (file.indexOf(__dirname) !== 0) {
      file = path.resolve(__dirname, '..', file);
    }

    if (fs.statSync(file).isFile()) {
      if (path.extname(file) === '.json') {
        console.log(file.replace(path.resolve(__dirname, '..') + path.sep, ''));
        checkStyle(file)
        checkSchema(file);
      }

      continue;
    }

    let subFiles = fs.readdirSync(file).map((subfile) => {
      return path.join(file, subfile);
    });

    load(...subFiles);
  }
}

if (process.argv[2]) {
  load(process.argv[2])
} else {
  load(
    'api',
    'css',
    'html',
    'http',
    'javascript',
    'test',
    'webextensions'
  );
}

if (hasErrors) {
  process.exit(1);
}
