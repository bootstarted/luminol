/* @flow */
import {spawn} from 'child_process';
import {join} from 'path';
import {killOnExit, kill} from '/internal/util';

const defaultExe = join(__dirname, '..', '..', 'bin', 'webpack-udev-server.js');

type Options = {
  hubUrl: string,
  exe?: string,
};

/**
 * Simple wrapper to manage spawning and despawning child processes. These
 * processes are killed when no longer needed and are also killed when the
 * main program exits.
 * @param {String} exe Program to spawn
 * @param {String} hubUrl The URL of the udev hub.
 * @returns {Object} spawner.
 */
const createSpawner = ({
  hubUrl,
  exe = defaultExe,
}: Options) => {
  if (!hubUrl) {
    throw new TypeError('Must provide valid `hubUrl`.');
  }
  const compilers = {};

  const unload = (config: string) => {
    if (compilers[config]) {
      kill(compilers[config]);
      delete compilers[config];
    }
  };

  const load = (config: string) => {
    if (compilers[config]) {
      unload(config);
    }

    const compiler = compilers[config] = spawn(exe, [
      '--hub', hubUrl,
      'compile', config,
    ], {
      stdio: [process.stdin, process.stdout, process.stderr],
      env: process.env,
    });
    killOnExit(compiler);
    return compiler;
  };

  return {load, unload};
};

export default createSpawner;
