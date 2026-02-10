import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type ChildComponent, getChildrenFromScheme, readChildrenSources, type Scheme } from './agent.js';

describe('children injection', () => {
  describe('getChildrenFromScheme', () => {
    const scheme: Scheme = {
      molecules: {
        items: {
          TaskCard: {
            description: 'Task card molecule',
            composition: {
              atoms: ['card', 'badge', 'button'],
            },
          },
        },
      },
      organisms: {
        items: {
          KanbanBoard: {
            description: 'Kanban board organism',
            composition: {
              molecules: ['TaskCard', 'ColumnHeader'],
            },
          },
        },
      },
      templates: {
        items: {
          DashboardLayout: {
            description: 'Dashboard layout template',
            layout: {
              organisms: ['TopNavBar', 'KanbanBoard', 'StatisticsSidebar'],
            },
          },
        },
      },
      pages: {
        items: {
          TodoDashboardPage: {
            route: '/',
            description: 'Main dashboard page',
            template: 'DashboardLayout',
          },
        },
      },
    };

    it('returns atoms for a molecule file path', () => {
      const result = getChildrenFromScheme('src/components/molecules/TaskCard.tsx', scheme);

      expect(result).toEqual([
        { name: 'card', type: 'atoms' },
        { name: 'badge', type: 'atoms' },
        { name: 'button', type: 'atoms' },
      ]);
    });

    it('returns molecules for an organism file path', () => {
      const result = getChildrenFromScheme('src/components/organisms/KanbanBoard.tsx', scheme);

      expect(result).toEqual([
        { name: 'TaskCard', type: 'molecules' },
        { name: 'ColumnHeader', type: 'molecules' },
      ]);
    });

    it('returns organisms for a template file path', () => {
      const result = getChildrenFromScheme('src/components/templates/DashboardLayout.tsx', scheme);

      expect(result).toEqual([
        { name: 'TopNavBar', type: 'organisms' },
        { name: 'KanbanBoard', type: 'organisms' },
        { name: 'StatisticsSidebar', type: 'organisms' },
      ]);
    });

    it('returns template for a page file path', () => {
      const result = getChildrenFromScheme('src/pages/TodoDashboardPage.tsx', scheme);

      expect(result).toEqual([{ name: 'DashboardLayout', type: 'templates' }]);
    });

    it('returns empty array for unknown file path', () => {
      const result = getChildrenFromScheme('src/utils/helpers.ts', scheme);

      expect(result).toEqual([]);
    });

    it('returns empty array when scheme is undefined', () => {
      const result = getChildrenFromScheme('src/components/molecules/TaskCard.tsx', undefined);

      expect(result).toEqual([]);
    });

    it('returns empty array when component not found in scheme', () => {
      const result = getChildrenFromScheme('src/components/molecules/UnknownComponent.tsx', scheme);

      expect(result).toEqual([]);
    });
  });

  describe('readChildrenSources', () => {
    const testProjectDir = path.join(import.meta.dirname, '..', '.test-fixtures');

    const cardFileContent = `import * as React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div className={\`card \${className || ''}\`} onClick={onClick}>
      {children}
    </div>
  );
}`;

    const badgeFileContent = `import * as React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return <span className={\`badge badge-\${variant}\`}>{label}</span>;
}`;

    const taskCardFileContent = `import * as React from 'react';
import { Card } from '../atoms/card';
import { Badge } from '../atoms/badge';

export interface TaskCardProps {
  title: string;
  status: 'pending' | 'in-progress' | 'done';
  onClick?: () => void;
}

export function TaskCard({ title, status, onClick }: TaskCardProps) {
  return (
    <Card onClick={onClick}>
      <h3>{title}</h3>
      <Badge label={status} variant={status === 'done' ? 'success' : 'default'} />
    </Card>
  );
}`;

    beforeEach(async () => {
      await fs.mkdir(path.join(testProjectDir, 'src/components/atoms'), { recursive: true });
      await fs.mkdir(path.join(testProjectDir, 'src/components/molecules'), { recursive: true });

      await fs.writeFile(path.join(testProjectDir, 'src/components/atoms/card.tsx'), cardFileContent);
      await fs.writeFile(path.join(testProjectDir, 'src/components/atoms/badge.tsx'), badgeFileContent);
      await fs.writeFile(path.join(testProjectDir, 'src/components/molecules/TaskCard.tsx'), taskCardFileContent);
    });

    afterEach(async () => {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    });

    it('includes entire file content for atom children', async () => {
      const children: ChildComponent[] = [
        { name: 'card', type: 'atoms' },
        { name: 'badge', type: 'atoms' },
      ];

      const result = await readChildrenSources(children, testProjectDir);

      expect(result).toEqual(
        `--- src/components/atoms/card.tsx ---\n${cardFileContent}\n\n--- src/components/atoms/badge.tsx ---\n${badgeFileContent}`,
      );
    });

    it('includes entire file content for molecule children', async () => {
      const children: ChildComponent[] = [{ name: 'TaskCard', type: 'molecules' }];

      const result = await readChildrenSources(children, testProjectDir);

      expect(result).toEqual(`--- src/components/molecules/TaskCard.tsx ---\n${taskCardFileContent}`);
    });

    it('handles case-insensitive file matching and includes full content', async () => {
      const children: ChildComponent[] = [{ name: 'Card', type: 'atoms' }];

      const result = await readChildrenSources(children, testProjectDir);

      expect(result).toMatch(/--- src\/components\/atoms\/[cC]ard\.tsx ---/);
      expect(result).toContain(cardFileContent);
    });

    it('returns empty string when no children provided', async () => {
      const result = await readChildrenSources([], testProjectDir);

      expect(result).toBe('');
    });

    it('includes full content of found files and skips missing ones', async () => {
      const children: ChildComponent[] = [
        { name: 'card', type: 'atoms' },
        { name: 'nonexistent', type: 'atoms' },
      ];

      const result = await readChildrenSources(children, testProjectDir);

      expect(result).toEqual(`--- src/components/atoms/card.tsx ---\n${cardFileContent}`);
    });

    it('concatenates multiple full file contents with double newlines', async () => {
      const children: ChildComponent[] = [
        { name: 'card', type: 'atoms' },
        { name: 'badge', type: 'atoms' },
      ];

      const result = await readChildrenSources(children, testProjectDir);

      const expectedResult = `--- src/components/atoms/card.tsx ---\n${cardFileContent}\n\n--- src/components/atoms/badge.tsx ---\n${badgeFileContent}`;
      expect(result).toEqual(expectedResult);
    });
  });
});
