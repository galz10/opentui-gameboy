import { expect, test, describe, spyOn, beforeEach, afterEach } from 'bun:test';
import { initLogger, gameboyLog, closeLogger } from './logger';

describe('Logger', () => {
  let logSpy: any;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    closeLogger();
  });

  test('gameboyLog does nothing when debug is disabled', () => {
    initLogger(false);
    gameboyLog('test message');
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('gameboyLog calls console.log when debug is enabled', () => {
    initLogger(true);
    gameboyLog('test message');
    expect(logSpy).toHaveBeenCalled();
  });
});
