#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const appName = args[0];

if (!appName) {
  console.error('Error: Please provide an app name');
  console.log('Usage: npx ember-native create-app <app-name>');
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), appName);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Directory "${appName}" already exists`);
  process.exit(1);
}

console.log(`Creating new Ember Native app: ${appName}`);
console.log('Cloning ember-native-demo repository...');

try {
  execSync(
    `git clone https://github.com/ember-native/ember-native-demo.git "${targetDir}"`,
    { stdio: 'inherit' }
  );

  // Remove .git directory to start fresh
  const gitDir = path.join(targetDir, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('Removing .git directory...');
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Update package.json files with the new app name
  console.log('Updating package.json files...');
  
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = appName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  const appPackageJsonPath = path.join(targetDir, 'app', 'package.json');
  if (fs.existsSync(appPackageJsonPath)) {
    const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf8'));
    appPackageJson.name = appName;
    fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2) + '\n');
  }

  console.log('\n✅ Successfully created Ember Native app!');
  console.log(`\nNext steps:`);
  console.log(`  cd ${appName}`);
  console.log(`  npm install`);
  console.log(`  npm start`);
} catch (error) {
  console.error('Error creating app:', error.message);
  process.exit(1);
}