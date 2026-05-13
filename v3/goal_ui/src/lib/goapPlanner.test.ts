import React from 'react';
import { describe, it, expect } from 'vitest';
import { parseGoal, type Step } from '@/lib/goapPlanner';

describe('GOAPPlanner', () => {
  describe('parseGoal function', () => {
    it('parses a simple goal', () => {
      const result = parseGoal('Research quantum computing');
      expect(result.domain).toBeDefined();
      expect(result.action).toBe('research');
    });

    it('identifies domain keywords', () => {
      const result = parseGoal('Analyze financial market trends');
      expect(result.keywords).toContain('financial');
      expect(result.keywords).toContain('market');
    });

    it('handles AI-related goals', () => {
      const result = parseGoal('Investigate machine learning techniques');
      expect(result.keywords.some(k => ['ai', 'ml', 'machine', 'learning'].includes(k))).toBe(true);
    });
  });

  describe('Step interface', () => {
    it('creates a valid step object', () => {
      const step: Step = {
        id: '1',
        title: 'Test Step',
        description: 'A test step',
        icon: () => null as unknown as React.ComponentType<{ className?: string }>,
        status: 'pending',
        data: [],
        metrics: []
      };
      expect(step.id).toBe('1');
      expect(step.status).toBe('pending');
    });
  });
});