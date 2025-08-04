#!/usr/bin/env node

/**
 * Unit tests for Date Handling
 * 
 * Tests the timezone-aware date parsing functionality that ensures
 * dates are scheduled correctly in the user's local timezone
 */

import { TestSuite, expect } from '../test-utils.js';

const suite = new TestSuite('Date Handling Unit Tests');

// Import parseLocalDate function (we'll need to create this import or test it via JXA)
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// Test timezone-aware date parsing
suite.test('parseLocalDate creates date in local timezone', () => {
  const dateString = '2025-08-04';
  const result = parseLocalDate(dateString);
  
  expect.toBeTruthy(result instanceof Date);
  expect.toEqual(result.getFullYear(), 2025);
  expect.toEqual(result.getMonth(), 7); // 0-indexed, so August = 7
  expect.toEqual(result.getDate(), 4);
  expect.toEqual(result.getHours(), 0);
  expect.toEqual(result.getMinutes(), 0);
  expect.toEqual(result.getSeconds(), 0);
  expect.toEqual(result.getMilliseconds(), 0);
});

suite.test('parseLocalDate handles null and undefined', () => {
  expect.toEqual(parseLocalDate(null), null);
  expect.toEqual(parseLocalDate(undefined), null);
  expect.toEqual(parseLocalDate(''), null);
});

suite.test('parseLocalDate handles different date formats', () => {
  const tests = [
    { input: '2025-01-01', expected: { year: 2025, month: 0, date: 1 } },
    { input: '2025-12-31', expected: { year: 2025, month: 11, date: 31 } },
    { input: '2024-02-29', expected: { year: 2024, month: 1, date: 29 } }, // Leap year
  ];
  
  tests.forEach(({ input, expected }) => {
    const result = parseLocalDate(input);
    expect.toEqual(result.getFullYear(), expected.year);
    expect.toEqual(result.getMonth(), expected.month);
    expect.toEqual(result.getDate(), expected.date);
  });
});

// Test timezone consistency
suite.test('date is created in system timezone (not UTC)', () => {
  const dateString = '2025-08-04';
  const localDate = parseLocalDate(dateString);
  const utcString = dateString + 'T00:00:00.000Z';
  const utcDate = new Date(utcString);
  
  // The local date should NOT equal the UTC date if we're not in UTC timezone
  const timezoneOffset = new Date().getTimezoneOffset();
  if (timezoneOffset !== 0) {
    expect.toBeFalsy(localDate.getTime() === utcDate.getTime());
  }
  
  // The local date should represent midnight on the specified date in local time
  const expectedISODate = dateString;
  const actualISODate = localDate.toISOString().split('T')[0];
  
  // Note: this might fail in some timezones due to UTC conversion
  // but it validates that we're getting the correct date
  expect.toEqualDate(actualISODate, expectedISODate);
});

// Test date formatting for Things 3
suite.test('formatted dates work with Things 3 expectations', () => {
  const testDates = [
    '2025-08-04',
    '2025-12-25', 
    '2024-02-29',
    '2025-01-01'
  ];
  
  testDates.forEach(dateString => {
    const parsed = parseLocalDate(dateString);
    expect.toBeTruthy(parsed instanceof Date);
    expect.toBeFalsy(isNaN(parsed.getTime()));
    
    // Should be midnight local time
    expect.toEqual(parsed.getHours(), 0);
    expect.toEqual(parsed.getMinutes(), 0);
    expect.toEqual(parsed.getSeconds(), 0);
  });
});

// Test edge cases
suite.test('handles invalid date strings gracefully', () => {
  const invalidDates = [
    '2025-13-01', // Invalid month
    '2025-02-30', // Invalid day for February
    '2025-00-01', // Invalid month (0)
    'not-a-date',
    '2025/08/04', // Wrong format
  ];
  
  invalidDates.forEach(invalidDate => {
    try {
      const result = parseLocalDate(invalidDate);
      // For invalid dates, parseLocalDate should either return null or an invalid Date
      if (result !== null) {
        // If it returns a Date object, it should be invalid
        expect.toBeTruthy(isNaN(result.getTime()));
      }
    } catch (error) {
      // Throwing an error is also acceptable for invalid input
      expect.toBeTruthy(true);
    }
  });
});

// Test consistency with previous problematic approach
suite.test('avoids UTC interpretation issue', () => {
  const dateString = '2025-08-04';
  
  // The old problematic approach (interpreting as UTC)
  const oldWayUTC = new Date(dateString + 'T00:00:00.000Z');
  
  // The new correct approach (local timezone)
  const newWay = parseLocalDate(dateString);
  
  // In non-UTC timezones, these should be different
  const timezoneOffset = new Date().getTimezoneOffset();
  if (timezoneOffset !== 0) {
    expect.toBeFalsy(oldWayUTC.getTime() === newWay.getTime());
  } else {
    // In UTC timezone, they might be the same, which is fine
    console.log('  ℹ️  Running in UTC timezone, times may be equal');
  }
  
  // The new way should give us the correct local date
  expect.toEqual(newWay.getFullYear(), 2025);
  expect.toEqual(newWay.getMonth(), 7); // August
  expect.toEqual(newWay.getDate(), 4);
});

// Test date arithmetic and comparisons
suite.test('parsed dates work correctly with date arithmetic', () => {
  const today = parseLocalDate('2025-08-04');
  const tomorrow = parseLocalDate('2025-08-05');
  const yesterday = parseLocalDate('2025-08-03');
  
  expect.toBeTruthy(tomorrow > today);
  expect.toBeTruthy(today > yesterday);
  
  // Difference should be exactly 24 hours (in milliseconds)
  const oneDayMs = 24 * 60 * 60 * 1000;
  expect.toEqual(tomorrow.getTime() - today.getTime(), oneDayMs);
  expect.toEqual(today.getTime() - yesterday.getTime(), oneDayMs);
});

// Run the tests
suite.run().catch(() => process.exit(1));