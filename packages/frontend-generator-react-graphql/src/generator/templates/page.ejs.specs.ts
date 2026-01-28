import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pageTemplate = fs.readFileSync(path.resolve(__dirname, 'page.ejs'), 'utf-8');

describe('page.ejs', () => {
  it('should generate a basic page with template and organisms', () => {
    const content = ejs.render(pageTemplate, {
      name: 'Dashboard',
      description: 'Main dashboard page',
      organisms: ['StatsOverview', 'ActivityFeed'],
      template: 'DashboardTemplate',
      templateDescription: 'Dashboard layout with stats and activity',
      templateSpecs: [],
      route: '/dashboard',
      navigation: [],
      specs: [],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {},
    });

    expect(content).toContain('import { DashboardTemplate } from "@/components/templates/DashboardTemplate";');
    expect(content).toContain('// Main dashboard page');
    expect(content).toContain('PAGE COMPOSITION');
    expect(content).toContain('export function Dashboard()');
    expect(content).toContain('return <DashboardTemplate />');
  });

  it('should generate a page with organisms and specs', () => {
    const content = ejs.render(pageTemplate, {
      name: 'AdminPanel',
      description: 'Admin control panel',
      organisms: ['UserManagement', 'SystemSettings'],
      template: 'AdminTemplate',
      templateDescription: 'Admin layout template',
      templateSpecs: [],
      route: '/admin',
      navigation: [],
      specs: ['manage users', 'configure system'],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {},
    });

    expect(content).toContain('// Page Specs:');
    expect(content).toContain('// - manage users');
    expect(content).toContain('// - configure system');
    expect(content).toContain('PAGE COMPOSITION');
  });

  it('should generate a page with spec coverage analysis', () => {
    const content = ejs.render(pageTemplate, {
      name: 'UserProfile',
      description: 'User profile page',
      organisms: ['ProfileHeader', 'ProfileDetails'],
      template: 'ProfileTemplate',
      templateDescription: 'Profile page layout',
      templateSpecs: [],
      route: '/profile',
      navigation: [],
      specs: ['display user info', 'show activity history'],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {
        ProfileHeader: ['display user info'],
        ProfileDetails: ['show activity history'],
      },
    });

    expect(content).toContain('YOUR SPECS (what this page must accomplish):');
    expect(content).toContain('[✓] display user info');
    expect(content).toContain('└─ Implemented by ProfileHeader (via template)');
    expect(content).toContain('[✓] show activity history');
    expect(content).toContain('└─ Implemented by ProfileDetails (via template)');
  });

  it('should generate a page with template import using PascalCase conversion', () => {
    const content = ejs.render(pageTemplate, {
      name: 'Settings',
      description: 'Settings page',
      organisms: ['GeneralSettings'],
      template: 'single-column-layout',
      templateDescription: 'Single column layout template',
      templateSpecs: [],
      route: '/settings',
      navigation: [],
      specs: [],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {},
    });

    expect(content).toContain('import { SingleColumnLayout } from "@/components/templates/single-column-layout";');
    expect(content).toContain('return <SingleColumnLayout />');
  });

  it('should generate a page with type guidance', () => {
    const content = ejs.render(pageTemplate, {
      name: 'TodoList',
      description: 'Todo list page',
      organisms: ['TodoGrid'],
      template: 'TodoTemplate',
      templateDescription: 'Todo page layout',
      templateSpecs: [],
      route: '/todos',
      navigation: [],
      specs: ['display todos', 'filter by status'],
      dataRequirements: [],
      typeGuidance: {
        imports: ['Todo', 'TodoStatus'],
        queryGuidance: [
          "Query - AllTodos:\n  Import: import { AllTodos } from '@/graphql/queries'\n  Returns: data?.todos → Todo[]",
        ],
        mutationGuidance: [],
        enumGuidance: [
          "Enum - TodoStatus:\n  Import: import { TodoStatus } from '@/gql/graphql'\n  Values:\n  TodoStatus.Active = 'ACTIVE'",
        ],
      },
      organismSpecs: {},
    });

    expect(content).toContain('CRITICAL - TYPE GUIDANCE');
    expect(content).toContain('Query - AllTodos:');
    expect(content).toContain('Enum - TodoStatus:');
  });

  it('should generate a page with partial spec coverage', () => {
    const content = ejs.render(pageTemplate, {
      name: 'TaskBoard',
      description: 'Task management board',
      organisms: ['TaskList', 'TaskFilters'],
      template: 'BoardTemplate',
      templateDescription: 'Board layout template',
      templateSpecs: [],
      route: '/tasks',
      navigation: [],
      specs: ['display tasks', 'filter by status', 'sort by date', 'search tasks'],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {
        TaskList: ['display tasks', 'sort by date'],
        TaskFilters: ['filter by status'],
      },
    });

    expect(content).toContain('[✓] display tasks');
    expect(content).toContain('└─ Implemented by TaskList (via template)');
    expect(content).toContain('[✓] filter by status');
    expect(content).toContain('└─ Implemented by TaskFilters (via template)');
    expect(content).toContain('[✓] sort by date');
    expect(content).toContain('└─ Implemented by TaskList (via template)');
    expect(content).toContain('[ ] search tasks');
  });

  it('should generate a page with NO spec coverage', () => {
    const content = ejs.render(pageTemplate, {
      name: 'Analytics',
      description: 'Analytics dashboard',
      organisms: ['ChartPanel', 'MetricsPanel'],
      template: 'AnalyticsTemplate',
      templateDescription: 'Analytics layout template',
      templateSpecs: [],
      route: '/analytics',
      navigation: [],
      specs: ['show revenue chart', 'display user metrics', 'export data'],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {
        ChartPanel: ['render line chart', 'render bar chart'],
        MetricsPanel: ['show count metrics', 'show percentage metrics'],
      },
    });

    expect(content).toContain('[ ] show revenue chart');
    expect(content).toContain('[ ] display user metrics');
    expect(content).toContain('[ ] export data');
    expect(content).not.toContain('[✓]');
  });

  it('should generate a page with mutation guidance', () => {
    const content = ejs.render(pageTemplate, {
      name: 'CreateItem',
      description: 'Create item page',
      organisms: ['ItemForm'],
      template: 'FormTemplate',
      templateDescription: 'Form page layout',
      templateSpecs: [],
      route: '/items/new',
      navigation: [],
      specs: ['collect item data', 'submit item'],
      dataRequirements: [],
      typeGuidance: {
        imports: ['CreateItemInput'],
        queryGuidance: [],
        mutationGuidance: [
          "Mutation - CreateItem:\n  Import: import { CreateItem } from '@/graphql/mutations'\n  Variables: CreateItemInput\n  Returns: data?.createItem → Item",
        ],
        enumGuidance: [],
      },
      organismSpecs: {},
    });

    expect(content).toContain('CRITICAL - TYPE GUIDANCE');
    expect(content).toContain('Mutation - CreateItem:');
    expect(content).toContain('Data requirements for this page');
  });

  it('should generate a page with only mutation guidance (no queries)', () => {
    const content = ejs.render(pageTemplate, {
      name: 'DeleteConfirmation',
      description: 'Delete confirmation page',
      organisms: ['ConfirmDialog'],
      template: 'DialogTemplate',
      templateDescription: 'Dialog layout template',
      templateSpecs: [],
      route: '/delete/:id',
      navigation: [],
      specs: ['confirm deletion'],
      dataRequirements: [],
      typeGuidance: {
        imports: [],
        queryGuidance: [],
        mutationGuidance: [
          "Mutation - DeleteItem:\n  Import: import { DeleteItem } from '@/graphql/mutations'\n  Variables: { itemId: string }",
        ],
        enumGuidance: [],
      },
      organismSpecs: {},
    });

    expect(content).toContain('CRITICAL - TYPE GUIDANCE');
    expect(content).toContain('Mutation - DeleteItem:');
    expect(content).not.toContain('Query -');
  });

  it('should generate a page with template and type guidance combined', () => {
    const content = ejs.render(pageTemplate, {
      name: 'ProductCatalog',
      description: 'Product catalog page',
      organisms: ['ProductGrid', 'ProductFilters'],
      template: 'two-column-layout',
      templateDescription: 'Two column layout with sidebar',
      templateSpecs: ['responsive sidebar', 'main content area'],
      route: '/products',
      navigation: [],
      specs: ['display products', 'filter products'],
      dataRequirements: [],
      typeGuidance: {
        imports: ['Product'],
        queryGuidance: [
          "Query - AllProducts:\n  Import: import { AllProducts } from '@/graphql/queries'\n  Returns: data?.products → Product[]",
        ],
        mutationGuidance: [],
        enumGuidance: [],
      },
      organismSpecs: {
        ProductGrid: ['display products'],
        ProductFilters: ['filter products'],
      },
    });

    expect(content).toContain('import { TwoColumnLayout } from "@/components/templates/two-column-layout";');
    expect(content).toContain('CRITICAL - TYPE GUIDANCE');
    expect(content).toContain('[✓] display products');
    expect(content).toContain('[✓] filter products');
    expect(content).toContain('return <TwoColumnLayout />');
  });

  it('should include template specs when available', () => {
    const content = ejs.render(pageTemplate, {
      name: 'DashboardPage',
      description: 'Main dashboard',
      organisms: ['Header', 'Content'],
      template: 'DashboardLayout',
      templateDescription: 'Dashboard layout with header and content areas',
      templateSpecs: ['fixed header', 'scrollable content area', 'responsive sidebar'],
      route: '/',
      navigation: [],
      specs: [],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {},
    });

    expect(content).toContain('TEMPLATE LAYOUT SPECS (handled by template):');
    expect(content).toContain('• fixed header');
    expect(content).toContain('• scrollable content area');
    expect(content).toContain('• responsive sidebar');
  });

  it('should include page-level considerations', () => {
    const content = ejs.render(pageTemplate, {
      name: 'SimpleList',
      description: 'Simple list page',
      organisms: ['ItemList'],
      template: 'ListTemplate',
      templateDescription: 'List page layout',
      templateSpecs: [],
      route: '/items',
      navigation: [],
      specs: ['show items'],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {},
    });

    expect(content).toContain('PAGE-LEVEL CONSIDERATIONS & VISUAL REQUIREMENTS');
    expect(content).toContain('Is the entry point for route "/items"');
    expect(content).toContain('IMPLEMENTATION PATTERN');
  });

  it('should handle organisms without organismSpecs data', () => {
    const content = ejs.render(pageTemplate, {
      name: 'MixedPage',
      description: 'Page with documented and undocumented organisms',
      organisms: ['DocumentedOrg', 'UndocumentedOrg'],
      template: 'MixedTemplate',
      templateDescription: 'Mixed content template',
      templateSpecs: [],
      route: '/mixed',
      navigation: [],
      specs: ['feature A', 'feature B'],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {
        DocumentedOrg: ['feature A'],
      },
    });

    expect(content).toContain('**DocumentedOrg** capabilities:');
    expect(content).toContain('• feature A');
    expect(content).toContain('**UndocumentedOrg**');
    expect(content).toContain('(Organism with specific purpose)');
  });

  it('should include navigation information', () => {
    const content = ejs.render(pageTemplate, {
      name: 'ProductPage',
      description: 'Product detail page',
      organisms: ['ProductDetails'],
      template: 'DetailTemplate',
      templateDescription: 'Detail page layout',
      templateSpecs: [],
      route: '/product/:id',
      navigation: [
        { on: 'Click Back', to: 'ProductListPage' },
        { on: 'Click Buy', to: 'CheckoutPage' },
      ],
      specs: [],
      dataRequirements: [],
      typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
      organismSpecs: {},
    });

    expect(content).toContain('NAVIGATION:');
    expect(content).toContain('On "Click Back" → Navigate to ProductListPage');
    expect(content).toContain('On "Click Buy" → Navigate to CheckoutPage');
  });

  describe('Edge Cases', () => {
    it('should handle empty organisms array', () => {
      const content = ejs.render(pageTemplate, {
        name: 'EmptyPage',
        description: 'Page without organisms',
        organisms: [],
        template: 'EmptyTemplate',
        templateDescription: 'Empty page layout',
        templateSpecs: [],
        route: '/empty',
        navigation: [],
        specs: [],
        dataRequirements: [],
        typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
        organismSpecs: {},
      });

      expect(content).not.toContain('PAGE COMPOSITION');
      expect(content).not.toContain('Page Responsibilities');
      expect(content).toContain('export function EmptyPage()');
      expect(content).toContain('return <EmptyTemplate />');
    });

    it('should handle undefined specs gracefully', () => {
      const content = ejs.render(pageTemplate, {
        name: 'NoSpecs',
        description: 'Page without specs',
        organisms: ['SomeOrganism'],
        template: 'BasicTemplate',
        templateDescription: 'Basic layout',
        templateSpecs: [],
        route: '/no-specs',
        navigation: [],
        specs: undefined,
        dataRequirements: [],
        typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
        organismSpecs: {},
      });

      expect(content).not.toContain('// Page Specs:');
      expect(content).not.toContain('YOUR SPECS');
      expect(content).toContain('PAGE COMPOSITION');
    });

    it('should handle organisms with empty organismSpecs arrays', () => {
      const content = ejs.render(pageTemplate, {
        name: 'EmptySpecs',
        description: 'Organisms with no documented specs',
        organisms: ['Org1', 'Org2'],
        template: 'BasicTemplate',
        templateDescription: 'Basic layout',
        templateSpecs: [],
        route: '/empty-specs',
        navigation: [],
        specs: ['feature X', 'feature Y'],
        dataRequirements: [],
        typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
        organismSpecs: {
          Org1: [],
          Org2: [],
        },
      });

      expect(content).toContain('[ ] feature X');
      expect(content).toContain('[ ] feature Y');
      expect(content).not.toContain('[✓]');
    });

    it('should handle page without template (fallback to div)', () => {
      const content = ejs.render(pageTemplate, {
        name: 'NoTemplatePage',
        description: 'Page without template',
        organisms: [],
        template: undefined,
        templateDescription: '',
        templateSpecs: [],
        route: '/no-template',
        navigation: [],
        specs: [],
        dataRequirements: [],
        typeGuidance: { imports: [], queryGuidance: [], mutationGuidance: [], enumGuidance: [] },
        organismSpecs: {},
      });

      expect(content).not.toContain('import {');
      expect(content).toContain('return <div />');
    });
  });
});
