/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs';
import meow from 'meow';
import pify from 'pify';

import {outputToUser} from './output';
import {generatePackageTree, populatePOIInPackageTree, resolvePaths} from './package-tree';

const cli = meow({
  help: `  
    Usage
      $ TODO <project>
 
    Options
      --help        Prints this help message.
  `,
  flags: {help: {type: 'boolean'}}
});

if (cli.input.length !== 1) {
  console.error(`Error: should have 1 argument, but got ${cli.input.length}`);
  cli.showHelp(1);
  process.exit(1);
} else {
  run(cli.input[0]);
}

async function validNodePackage(path: string) {
  try {
    await pify(fs.stat)(path);
  } catch (err) {
    console.error(err);
    cli.showHelp(1);
    return false;
  }
  const fileInfo = await pify(fs.stat)(path);
  if (!fileInfo.isDirectory()) {
    console.error(`Error: argument must be a directory`);
    cli.showHelp(1);
    return false;
  }
  const files: string[] = await pify(fs.readdir)(path);
  if (!files.includes('package.json')) {
    console.error(`Error: directory does not contain a package.json file`);
    cli.showHelp(1);
    return false;
  }
  return true;
}

async function run(packageRootDir: string) {
  // Step 1: Takes in the root of the package
  if (!(await validNodePackage(packageRootDir))) {
    process.exit(1);
  }

  // Step 2: Read package.json
  const pJson = await pify(fs.readFile)('package.json');

  // Step 3: create package tree - generatePackageTree or main function
  const emptyPackageTree = await generatePackageTree(pJson);
  const packageTreeWithPath = await resolvePaths(emptyPackageTree, '.');
  const packageTreeWithPOI =
      await populatePOIInPackageTree(packageTreeWithPath);

  // Step 4: output
  // TODO: Uncomment this line.
  outputToUser(packageTreeWithPOI);
}
