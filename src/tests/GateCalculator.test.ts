import { describe, it, expect } from 'vitest';
import { GateCalculator } from '../gameplay/GateCalculator';

describe('GateCalculator', () => {
  it('correctly calculates addition gates', () => {
    expect(GateCalculator.calculateNewFleet(1, { operation: 'ADD', value: 5 })).toBe(6);
    expect(GateCalculator.calculateNewFleet(10, { operation: 'ADD', value: 20 })).toBe(30);
  });

  it('correctly calculates multiplication gates', () => {
    expect(GateCalculator.calculateNewFleet(5, { operation: 'MULTIPLY', value: 2 })).toBe(10);
    expect(GateCalculator.calculateNewFleet(10, { operation: 'MULTIPLY', value: 3 })).toBe(30);
  });

  it('correctly calculates subtraction gates and enforces minimum 1', () => {
    expect(GateCalculator.calculateNewFleet(10, { operation: 'SUBTRACT', value: 5 })).toBe(5);
    expect(GateCalculator.calculateNewFleet(3, { operation: 'SUBTRACT', value: 10 })).toBe(1);
    expect(GateCalculator.calculateNewFleet(1, { operation: 'SUBTRACT', value: 1 })).toBe(1);
  });

  it('correctly calculates division gates and enforces floor and minimum 1', () => {
    expect(GateCalculator.calculateNewFleet(10, { operation: 'DIVIDE', value: 2 })).toBe(5);
    expect(GateCalculator.calculateNewFleet(7, { operation: 'DIVIDE', value: 2 })).toBe(3);
    expect(GateCalculator.calculateNewFleet(1, { operation: 'DIVIDE', value: 2 })).toBe(1);
  });

  it('correctly calculates percentage gates', () => {
    expect(GateCalculator.calculateNewFleet(10, { operation: 'PERCENTAGE', value: 0.5 })).toBe(15);
    expect(GateCalculator.calculateNewFleet(25, { operation: 'PERCENTAGE', value: 0.2 })).toBe(30);
  });

  it('respects the fleet cap of 9999', () => {
    expect(GateCalculator.calculateNewFleet(5000, { operation: 'MULTIPLY', value: 5 })).toBe(9999);
    expect(GateCalculator.calculateNewFleet(9990, { operation: 'ADD', value: 100 })).toBe(9999);
  });

  it('formats labels accurately', () => {
    expect(GateCalculator.formatGateLabel({ operation: 'ADD', value: 10 })).toBe('+10');
    expect(GateCalculator.formatGateLabel({ operation: 'MULTIPLY', value: 2 })).toBe('×2');
    expect(GateCalculator.formatGateLabel({ operation: 'SUBTRACT', value: 5 })).toBe('-5');
    expect(GateCalculator.formatGateLabel({ operation: 'DIVIDE', value: 2 })).toBe('÷2');
    expect(GateCalculator.formatGateLabel({ operation: 'PERCENTAGE', value: 0.5 })).toBe('+50%');
  });

  it('identifies positive gates correctly', () => {
    expect(GateCalculator.isPositive({ operation: 'ADD', value: 5 })).toBe(true);
    expect(GateCalculator.isPositive({ operation: 'MULTIPLY', value: 2 })).toBe(true);
    expect(GateCalculator.isPositive({ operation: 'PERCENTAGE', value: 0.25 })).toBe(true);
    expect(GateCalculator.isPositive({ operation: 'SUBTRACT', value: 5 })).toBe(false);
    expect(GateCalculator.isPositive({ operation: 'DIVIDE', value: 2 })).toBe(false);
  });
});
