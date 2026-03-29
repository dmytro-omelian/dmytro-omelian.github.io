const fs = require('fs');
const path = require('path');

function normalizeEnvValue(rawValue) {
  const trimmedValue = rawValue.trim();

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
    || (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1);
  }

  return trimmedValue;
}

function parseEnvFile(fileContents) {
  return fileContents.split(/\r?\n/).reduce((accumulator, line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return accumulator;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return accumulator;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = normalizeEnvValue(trimmedLine.slice(separatorIndex + 1));

    if (key) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function loadLocalEnv(rootDirectory = path.resolve(__dirname, '..')) {
  const originalEnvKeys = new Set(Object.keys(process.env));
  const envFileNames = ['.env', '.env.local'];

  envFileNames.forEach((fileName) => {
    const filePath = path.resolve(rootDirectory, fileName);

    if (!fs.existsSync(filePath)) {
      return;
    }

    const parsedValues = parseEnvFile(fs.readFileSync(filePath, 'utf8'));

    Object.entries(parsedValues).forEach(([key, value]) => {
      if (originalEnvKeys.has(key)) {
        return;
      }

      process.env[key] = value;
    });
  });
}

loadLocalEnv();

module.exports = {
  loadLocalEnv,
};
