import type { Event, Command } from '@auto-engineer/message-bus';
import { define } from '@auto-engineer/pipeline';

interface SchemaExportedData {
  directory: string;
  outputPath: string;
}

interface ChangesDetectedData {
  modelPath: string;
  destination: string;
  changeSet: Record<string, unknown>;
  isFirstRun: boolean;
  newState: Record<string, unknown>;
}

interface SliceGeneratedData {
  slicePath: string;
}

interface SliceImplementedData {
  slicePath: string;
}

interface CheckEventData {
  targetDirectory?: string;
  errors?: string;
}

interface ValidationError {
  component: string;
  type: 'molecule' | 'organism';
  field: string;
  invalidReferences: string[];
  message: string;
}

interface IAValidationFailedData {
  errors: ValidationError[];
  outputDir: string;
  modelPath: string;
}

// --- Job Graph Types ---

interface JobFiles {
  create: string[];
  modify?: string[];
}

interface JobPayload {
  title: string;
  description: string;
  type: 'component';
  componentId: string;
  implementation: string;
  acceptanceCriteria: string[];
  prompt: string;
  storybookPath: string;
  files: JobFiles;
}

interface Job {
  id: string;
  dependsOn: string[];
  target: string;
  payload: JobPayload;
}

interface JobGraphReadyData {
  jobs: Job[];
  projectDir?: string;
  failurePolicy?: 'halt' | 'skip-dependents' | 'continue';
}

const MAX_RETRIES = 4;
const MAX_IA_RETRIES = 3;
const sliceRetryState = new Map<string, number>();
let iaRetryCount = 0;
let projectRoot = '';

function hasAnyFailures(events: Event[]): boolean {
  return events.some((e) => e.type.includes('Failed'));
}

function collectErrors(events: Event[]): string {
  return events
    .filter((e) => e.type.includes('Failed'))
    .map((e) => (e.data as CheckEventData).errors ?? '')
    .filter((s) => s.length > 0)
    .join('\n');
}

function extractSlicePath(events: Record<string, Event[]>): string {
  const firstEvent = events.CheckTests?.[0] ?? events.CheckTypes?.[0] ?? events.CheckLint?.[0];
  const data = firstEvent?.data as CheckEventData | undefined;
  return data?.targetDirectory ?? '';
}

function gatherAllCheckEvents(events: Record<string, Event[]>): Event[] {
  return [...(events.CheckTests ?? []), ...(events.CheckTypes ?? []), ...(events.CheckLint ?? [])];
}

function shouldRetry(slicePath: string): boolean {
  const attempts = sliceRetryState.get(slicePath) ?? 0;
  return attempts < MAX_RETRIES;
}

function incrementRetryCount(slicePath: string): number {
  const attempts = sliceRetryState.get(slicePath) ?? 0;
  sliceRetryState.set(slicePath, attempts + 1);
  return attempts + 1;
}

function resolvePath(relativePath: string): string {
  if (projectRoot === '') {
    return relativePath;
  }
  if (relativePath.startsWith('/')) {
    return relativePath;
  }
  if (relativePath.startsWith('./')) {
    return `${projectRoot}/${relativePath.slice(2)}`;
  }
  return `${projectRoot}/${relativePath}`;
}

// ---------------------------------------------------------------------------
// Hardcoded Book Store jobs for testing the job-graph pipeline end-to-end.
// Trigger with:  auto dispatch TriggerJobGraph
// ---------------------------------------------------------------------------

const BOOK_STORE_JOBS: Job[] = [
  {
    id: 'job_nav_link',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement NavLink',
      description: 'A navigation link component with active state styling for the main site navigation',
      type: 'component',
      componentId: 'nav_link',
      implementation: 'Create a link component that supports active state styling. Should accept href, children, and active props. Apply distinct styling when the link is active to indicate current page/section.',
      acceptanceCriteria: [
        'Renders as a clickable link with provided href',
        'Displays children content within the link',
        'Applies active styling when active prop is true',
        'Supports keyboard navigation and screen readers',
      ],
      prompt: 'Implement a navigation link component with active state support',
      storybookPath: 'components/NavLink',
      files: { create: ['src/components/ui/NavLink/NavLink.tsx', 'src/components/ui/NavLink/index.ts'] },
    },
  },
  {
    id: 'job_cart_icon',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CartIcon',
      description: 'A shopping cart icon component for the header navigation',
      type: 'component',
      componentId: 'cart_icon',
      implementation: 'Create a shopping cart SVG icon component. Should be scalable and support custom size and color props. Use standard shopping cart iconography.',
      acceptanceCriteria: [
        'Renders a shopping cart SVG icon',
        'Accepts size prop to control icon dimensions',
        'Accepts color prop to customize icon color',
        'Maintains aspect ratio when scaled',
      ],
      prompt: 'Implement a scalable shopping cart icon component',
      storybookPath: 'components/CartIcon',
      files: { create: ['src/components/ui/CartIcon/CartIcon.tsx', 'src/components/ui/CartIcon/index.ts'] },
    },
  },
  {
    id: 'job_book_card',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement BookCard',
      description: 'A card component for displaying book information with add to cart functionality',
      type: 'component',
      componentId: 'book_card',
      implementation: 'Extend the existing Card component to create a book-specific card layout. Include book title, author, price, and add to cart button. Handle cart state to disable button when book is already added.',
      acceptanceCriteria: [
        'Displays book title, author, and price clearly',
        'Shows add to cart button when book is not in cart',
        'Disables add to cart button when book is already in cart',
        'Calls onAddToCart function when button is clicked',
        'Supports featured variant for highlighted books',
      ],
      prompt: 'Create a book card component using the existing Card as a base',
      storybookPath: 'components/BookCard',
      files: { create: ['src/components/ui/BookCard/BookCard.tsx', 'src/components/ui/BookCard/index.ts'] },
    },
  },
  {
    id: 'job_search_icon',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement SearchIcon',
      description: 'A magnifying glass search icon for the search input field',
      type: 'component',
      componentId: 'search_icon',
      implementation: 'Create a search/magnifying glass SVG icon component. Should be scalable and support custom size and color props.',
      acceptanceCriteria: [
        'Renders a magnifying glass SVG icon',
        'Accepts size prop to control icon dimensions',
        'Accepts color prop to customize icon color',
        'Uses standard search icon design',
      ],
      prompt: 'Implement a scalable search magnifying glass icon component',
      storybookPath: 'components/SearchIcon',
      files: { create: ['src/components/ui/SearchIcon/SearchIcon.tsx', 'src/components/ui/SearchIcon/index.ts'] },
    },
  },
  {
    id: 'job_result_item',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement ResultItem',
      description: 'An individual search result item component showing book information',
      type: 'component',
      componentId: 'result_item',
      implementation: 'Create a clickable search result item that displays book title, author, and price. Support highlighted state for keyboard navigation or hover effects.',
      acceptanceCriteria: [
        'Displays book title, author, and price in a compact layout',
        'Responds to click events by calling onClick function',
        'Supports highlighted variant for better UX',
        'Is keyboard accessible for navigation',
      ],
      prompt: 'Create a search result item component for book search results',
      storybookPath: 'components/ResultItem',
      files: { create: ['src/components/ui/ResultItem/ResultItem.tsx', 'src/components/ui/ResultItem/index.ts'] },
    },
  },
  {
    id: 'job_cart_item',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CartItem',
      description: 'A cart item component displaying book details with optional remove functionality',
      type: 'component',
      componentId: 'cart_item',
      implementation: 'Create a cart item component that shows book title, quantity, price, and optionally a remove button. Support readonly variant when removal is not allowed.',
      acceptanceCriteria: [
        'Displays book title, quantity, and price clearly',
        'Shows remove button when allowRemoval is true',
        'Hides remove button when allowRemoval is false (readonly variant)',
        'Calls onRemove function when remove button is clicked',
      ],
      prompt: 'Create a cart item component with conditional remove functionality',
      storybookPath: 'components/CartItem',
      files: { create: ['src/components/ui/CartItem/CartItem.tsx', 'src/components/ui/CartItem/index.ts'] },
    },
  },
  {
    id: 'job_price_display',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement PriceDisplay',
      description: 'A formatted price display component with currency support',
      type: 'component',
      componentId: 'price_display',
      implementation: 'Create a price formatting component that displays monetary amounts with proper currency formatting. Support different sizes for various contexts.',
      acceptanceCriteria: [
        'Formats price with currency symbol correctly',
        'Supports different size variants (small, default, large)',
        'Handles decimal places appropriately',
        'Uses proper currency formatting for different locales',
      ],
      prompt: 'Create a price display component with currency formatting',
      storybookPath: 'components/PriceDisplay',
      files: { create: ['src/components/ui/PriceDisplay/PriceDisplay.tsx', 'src/components/ui/PriceDisplay/index.ts'] },
    },
  },
  {
    id: 'job_item_count',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement ItemCount',
      description: 'A component for displaying the number of items with descriptive label',
      type: 'component',
      componentId: 'item_count',
      implementation: "Create a simple component that displays a count number with an associated label (e.g., '3 items').",
      acceptanceCriteria: [
        'Displays count number prominently',
        'Shows descriptive label alongside count',
        'Handles singular/plural forms appropriately',
        'Uses appropriate typography for readability',
      ],
      prompt: 'Create an item count display component with label support',
      storybookPath: 'components/ItemCount',
      files: { create: ['src/components/ui/ItemCount/ItemCount.tsx', 'src/components/ui/ItemCount/index.ts'] },
    },
  },
  {
    id: 'job_status_text',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement StatusText',
      description: 'A text component for displaying order status information with timestamps',
      type: 'component',
      componentId: 'status_text',
      implementation: 'Create a status text component that displays order status with optional timestamp information. Format timestamps in a user-friendly way.',
      acceptanceCriteria: [
        'Displays status text clearly',
        'Shows formatted timestamp when provided',
        'Uses appropriate typography hierarchy',
        'Handles different status types with consistent formatting',
      ],
      prompt: 'Create a status text component for order status display',
      storybookPath: 'components/StatusText',
      files: { create: ['src/components/ui/StatusText/StatusText.tsx', 'src/components/ui/StatusText/index.ts'] },
    },
  },
  {
    id: 'job_history_item',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement HistoryItem',
      description: 'A timeline item component for displaying order history events',
      type: 'component',
      componentId: 'history_item',
      implementation: 'Create a history item component for order timeline display. Show status, timestamp, and description with visual indicators for current vs past events.',
      acceptanceCriteria: [
        'Displays status, timestamp, and description clearly',
        'Supports current variant to highlight active status',
        'Uses timeline-appropriate visual design',
        'Formats timestamps in user-friendly format',
      ],
      prompt: 'Create a history item component for order timeline display',
      storybookPath: 'components/HistoryItem',
      files: { create: ['src/components/ui/HistoryItem/HistoryItem.tsx', 'src/components/ui/HistoryItem/index.ts'] },
    },
  },
  {
    id: 'job_timeline_connector',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement TimelineConnector',
      description: 'A visual connector component for linking timeline items',
      type: 'component',
      componentId: 'timeline_connector',
      implementation: 'Create a visual connector line that links timeline items together. Support active and inactive states with different visual styles.',
      acceptanceCriteria: [
        'Renders as a connecting line between timeline items',
        'Shows active state with emphasized styling',
        'Shows inactive state with subtle styling',
        'Integrates well with timeline layout',
      ],
      prompt: 'Create a timeline connector for linking history items',
      storybookPath: 'components/TimelineConnector',
      files: { create: ['src/components/ui/TimelineConnector/TimelineConnector.tsx', 'src/components/ui/TimelineConnector/index.ts'] },
    },
  },
  {
    id: 'job_cart_indicator',
    dependsOn: ['job_cart_icon'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CartIndicator',
      description: 'A cart icon with item count badge for the header navigation',
      type: 'component',
      componentId: 'cart_indicator',
      implementation: 'Combine the CartIcon with a Badge component to show cart item count. Position the badge as an overlay on the cart icon.',
      acceptanceCriteria: [
        'Displays cart icon with count badge overlay',
        'Badge shows current item count',
        'Handles zero count appropriately (hide or show 0)',
        'Responds to click events',
        'Badge positioning works across different screen sizes',
      ],
      prompt: 'Create a cart indicator combining cart icon with count badge',
      storybookPath: 'components/CartIndicator',
      files: { create: ['src/components/ui/CartIndicator/CartIndicator.tsx', 'src/components/ui/CartIndicator/index.ts'] },
    },
  },
  {
    id: 'job_book_grid',
    dependsOn: ['job_book_card'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement BookGrid',
      description: 'A responsive grid layout for displaying multiple book cards',
      type: 'component',
      componentId: 'book_grid',
      implementation: 'Create a responsive grid container that displays BookCard components. Support configurable column count and handle responsive breakpoints.',
      acceptanceCriteria: [
        'Displays books in responsive grid layout',
        'Supports configurable column count',
        'Handles empty state gracefully',
        'Passes click events to individual book cards',
        'Maintains grid spacing consistently',
      ],
      prompt: 'Create a responsive grid layout for book cards',
      storybookPath: 'components/BookGrid',
      files: { create: ['src/components/ui/BookGrid/BookGrid.tsx', 'src/components/ui/BookGrid/index.ts'] },
    },
  },
  {
    id: 'job_search_bar',
    dependsOn: ['job_search_icon'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement SearchBar',
      description: 'A search input field with icon and real-time search capabilities',
      type: 'component',
      componentId: 'search_bar',
      implementation: 'Configure InputGroup with SearchIcon and add debounced search functionality for real-time search as user types.',
      acceptanceCriteria: [
        'Displays search icon at the start of input field',
        'Supports placeholder text',
        'Debounces search input to avoid excessive API calls',
        'Calls onSearch function with debounced value',
        'Maintains focus and cursor position during typing',
      ],
      prompt: 'Create a search bar with icon and debounced search functionality',
      storybookPath: 'components/SearchBar',
      files: { create: ['src/components/ui/SearchBar/SearchBar.tsx', 'src/components/ui/SearchBar/index.ts'] },
    },
  },
  {
    id: 'job_search_results',
    dependsOn: ['job_result_item'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement SearchResults',
      description: 'A list container for search results with empty state handling',
      type: 'component',
      componentId: 'search_results',
      implementation: 'Create a container that displays a list of ResultItem components. Handle loading state and empty results with appropriate messaging using the Empty component.',
      acceptanceCriteria: [
        'Displays search results as a vertical list',
        'Shows loading state while searching',
        'Displays empty state message when no results found',
        'Passes result click events to parent component',
        'Handles keyboard navigation between results',
      ],
      prompt: 'Create a search results container with loading and empty states',
      storybookPath: 'components/SearchResults',
      files: { create: ['src/components/ui/SearchResults/SearchResults.tsx', 'src/components/ui/SearchResults/index.ts'] },
    },
  },
  {
    id: 'job_cart_item_list',
    dependsOn: ['job_cart_item'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CartItemList',
      description: 'A list container for shopping cart items with removal functionality',
      type: 'component',
      componentId: 'cart_item_list',
      implementation: 'Create a container that displays a list of CartItem components. Handle item removal and empty cart state.',
      acceptanceCriteria: [
        'Displays cart items in vertical list layout',
        'Passes removal function to individual cart items',
        'Respects allowRemoval prop to enable/disable removal',
        'Handles empty cart state appropriately',
        'Maintains consistent spacing between items',
      ],
      prompt: 'Create a cart item list container with removal functionality',
      storybookPath: 'components/CartItemList',
      files: { create: ['src/components/ui/CartItemList/CartItemList.tsx', 'src/components/ui/CartItemList/index.ts'] },
    },
  },
  {
    id: 'job_cart_summary',
    dependsOn: ['job_price_display', 'job_item_count'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CartSummary',
      description: 'A summary component showing cart total and item count',
      type: 'component',
      componentId: 'cart_summary',
      implementation: 'Combine PriceDisplay and ItemCount components to show cart totals. Display prominently for easy scanning.',
      acceptanceCriteria: [
        'Displays total price using PriceDisplay component',
        'Shows item count using ItemCount component',
        'Updates automatically when cart changes',
        'Uses appropriate typography hierarchy',
        'Handles zero items and empty cart states',
      ],
      prompt: 'Create a cart summary showing totals and item count',
      storybookPath: 'components/CartSummary',
      files: { create: ['src/components/ui/CartSummary/CartSummary.tsx', 'src/components/ui/CartSummary/index.ts'] },
    },
  },
  {
    id: 'job_order_status',
    dependsOn: ['job_status_text'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement OrderStatus',
      description: 'A component displaying current order status with visual indicators',
      type: 'component',
      componentId: 'order_status',
      implementation: 'Extend Badge component with order-specific status styling and combine with StatusText for comprehensive status display.',
      acceptanceCriteria: [
        'Displays status badge with appropriate color coding',
        'Shows status text with timestamp information',
        'Uses distinct styling for different order statuses',
        'Supports status change animations',
        'Maintains accessibility with proper labels',
      ],
      prompt: 'Create an order status component with badge and text display',
      storybookPath: 'components/OrderStatus',
      files: { create: ['src/components/ui/OrderStatus/OrderStatus.tsx', 'src/components/ui/OrderStatus/index.ts'] },
    },
  },
  {
    id: 'job_order_history',
    dependsOn: ['job_history_item', 'job_timeline_connector'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement OrderHistory',
      description: 'A timeline component showing order status change history',
      type: 'component',
      componentId: 'order_history',
      implementation: 'Create a vertical timeline using HistoryItem and TimelineConnector components to show the progression of order status changes.',
      acceptanceCriteria: [
        'Displays history items in chronological order',
        'Connects items with timeline connectors',
        'Highlights current status appropriately',
        'Shows timestamps when enabled',
        'Handles varying numbers of history items',
      ],
      prompt: 'Create an order history timeline with connected status items',
      storybookPath: 'components/OrderHistory',
      files: { create: ['src/components/ui/OrderHistory/OrderHistory.tsx', 'src/components/ui/OrderHistory/index.ts'] },
    },
  },
  {
    id: 'job_nav_menu',
    dependsOn: ['job_nav_link'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement NavMenu',
      description: 'A navigation menu component with book store specific navigation items',
      type: 'component',
      componentId: 'nav_menu',
      implementation: 'Extend NavigationMenu component with book store specific navigation items and active link styling using NavLink components.',
      acceptanceCriteria: [
        'Displays navigation items horizontally',
        'Uses NavLink components for navigation items',
        'Highlights active navigation item',
        'Supports keyboard navigation',
        'Includes book store specific menu items (Browse, Search, Cart)',
      ],
      prompt: 'Create a navigation menu for book store using existing NavigationMenu',
      storybookPath: 'components/NavMenu',
      files: { create: ['src/components/ui/NavMenu/NavMenu.tsx', 'src/components/ui/NavMenu/index.ts'] },
    },
  },
  {
    id: 'job_sort_controls',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement SortControls',
      description: 'Dropdown and buttons for sorting the book catalog by various criteria',
      type: 'component',
      componentId: 'sort_controls',
      implementation: 'Wrap Select component with book-specific sort options (title, price, author) and add sort direction toggle functionality.',
      acceptanceCriteria: [
        'Provides sort options specific to books (title, author, price)',
        'Includes sort direction toggle (ascending/descending)',
        'Calls onSortChange when sort criteria changes',
        'Shows current sort selection clearly',
        'Groups sort dropdown and direction button logically',
      ],
      prompt: 'Create sort controls for book catalog with dropdown and direction toggle',
      storybookPath: 'components/SortControls',
      files: { create: ['src/components/ui/SortControls/SortControls.tsx', 'src/components/ui/SortControls/index.ts'] },
    },
  },
  {
    id: 'job_shipping_form',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement ShippingForm',
      description: 'Form component for collecting shipping address information during checkout',
      type: 'component',
      componentId: 'shipping_form',
      implementation: 'Configure Form component with shipping address specific fields and validation. Include proper labels and error handling.',
      acceptanceCriteria: [
        'Displays shipping address input fields',
        'Validates address completeness',
        'Shows validation errors clearly',
        'Calls onChange when address changes',
        'Supports address autocomplete if possible',
      ],
      prompt: 'Create a shipping form with address validation using existing Form component',
      storybookPath: 'components/ShippingForm',
      files: { create: ['src/components/ui/ShippingForm/ShippingForm.tsx', 'src/components/ui/ShippingForm/index.ts'] },
    },
  },
  {
    id: 'job_book_form_fields',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement BookFormFields',
      description: 'Form field group for adding new books with title, author, and price inputs',
      type: 'component',
      componentId: 'book_form_fields',
      implementation: 'Group multiple Field components for book-specific form layout with proper validation for title, author, and price fields.',
      acceptanceCriteria: [
        'Displays title, author, and price input fields',
        'Validates required fields appropriately',
        'Formats price input with proper decimal handling',
        'Shows validation errors per field',
        'Calls onChange when any field value changes',
      ],
      prompt: 'Create book form fields group with validation using existing Field components',
      storybookPath: 'components/BookFormFields',
      files: { create: ['src/components/ui/BookFormFields/BookFormFields.tsx', 'src/components/ui/BookFormFields/index.ts'] },
    },
  },
  {
    id: 'job_header',
    dependsOn: ['job_nav_menu', 'job_cart_indicator'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement Header',
      description: 'Main site header with navigation menu and cart access',
      type: 'component',
      componentId: 'header',
      implementation: 'Create a header component that combines NavMenu and CartIndicator. Support different header variants for different pages (with/without cart, with/without back button).',
      acceptanceCriteria: [
        'Displays site title prominently',
        'Includes navigation menu for site sections',
        'Shows cart indicator with item count',
        'Supports optional back button for sub-pages',
        'Maintains responsive layout across screen sizes',
      ],
      prompt: 'Create a site header combining navigation and cart functionality',
      storybookPath: 'components/Header',
      files: { create: ['src/components/ui/Header/Header.tsx', 'src/components/ui/Header/index.ts'] },
    },
  },
  {
    id: 'job_book_catalog',
    dependsOn: ['job_book_grid', 'job_sort_controls'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement BookCatalog',
      description: 'Complete book catalog with grid display and sorting capabilities',
      type: 'component',
      componentId: 'book_catalog',
      implementation: 'Combine BookGrid and SortControls to create a complete catalog interface. Handle sorting state and book interactions.',
      acceptanceCriteria: [
        'Displays books in responsive grid layout',
        'Provides sorting controls for different criteria',
        'Updates display when sort options change',
        'Handles add to cart functionality for books',
        'Shows loading and empty states appropriately',
      ],
      prompt: 'Create a complete book catalog with grid and sorting',
      storybookPath: 'components/BookCatalog',
      files: { create: ['src/components/ui/BookCatalog/BookCatalog.tsx', 'src/components/ui/BookCatalog/index.ts'] },
    },
  },
  {
    id: 'job_search_interface',
    dependsOn: ['job_search_bar', 'job_search_results'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement SearchInterface',
      description: 'Complete search interface with input and live results display',
      type: 'component',
      componentId: 'search_interface',
      implementation: 'Combine SearchBar and SearchResults to create a complete search experience. Handle search state, API calls, and result display.',
      acceptanceCriteria: [
        'Provides search input with real-time results',
        'Shows search results as user types (debounced)',
        'Displays loading state during search',
        'Shows appropriate message when no results found',
        'Handles search result selection',
      ],
      prompt: 'Create a complete search interface with live results',
      storybookPath: 'components/SearchInterface',
      files: { create: ['src/components/ui/SearchInterface/SearchInterface.tsx', 'src/components/ui/SearchInterface/index.ts'] },
    },
  },
  {
    id: 'job_cart_display',
    dependsOn: ['job_cart_item_list', 'job_cart_summary'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CartDisplay',
      description: 'Complete shopping cart display with items list and summary',
      type: 'component',
      componentId: 'cart_display',
      implementation: 'Combine CartItemList and CartSummary to create a complete cart viewing experience. Handle cart state management and item operations.',
      acceptanceCriteria: [
        'Displays all cart items with removal functionality',
        'Shows cart summary with total and item count',
        'Updates automatically when cart changes',
        'Handles empty cart state appropriately',
        'Supports both editable and readonly modes',
      ],
      prompt: 'Create a complete cart display with items and summary',
      storybookPath: 'components/CartDisplay',
      files: { create: ['src/components/ui/CartDisplay/CartDisplay.tsx', 'src/components/ui/CartDisplay/index.ts'] },
    },
  },
  {
    id: 'job_checkout_form',
    dependsOn: ['job_shipping_form'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement CheckoutForm',
      description: 'Checkout form with shipping details and payment processing',
      type: 'component',
      componentId: 'checkout_form',
      implementation: 'Create a checkout form that includes ShippingForm and checkout button. Handle form validation and submission.',
      acceptanceCriteria: [
        'Includes shipping address form section',
        'Provides checkout button that enables when form is valid',
        'Validates all required information before enabling checkout',
        'Shows loading state during checkout processing',
        'Handles checkout errors and success states',
      ],
      prompt: 'Create a checkout form with shipping and payment processing',
      storybookPath: 'components/CheckoutForm',
      files: { create: ['src/components/ui/CheckoutForm/CheckoutForm.tsx', 'src/components/ui/CheckoutForm/index.ts'] },
    },
  },
  {
    id: 'job_order_tracking',
    dependsOn: ['job_order_status', 'job_order_history'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement OrderTracking',
      description: 'Order status display with current status and history timeline',
      type: 'component',
      componentId: 'order_tracking',
      implementation: 'Combine OrderStatus and OrderHistory to create a complete order tracking interface. Show current status and historical progression.',
      acceptanceCriteria: [
        'Displays current order status prominently',
        'Shows order history timeline when enabled',
        'Includes delivery estimate for shipped orders',
        'Handles different order statuses appropriately',
        'Updates in real-time when order status changes',
      ],
      prompt: 'Create an order tracking interface with status and history',
      storybookPath: 'components/OrderTracking',
      files: { create: ['src/components/ui/OrderTracking/OrderTracking.tsx', 'src/components/ui/OrderTracking/index.ts'] },
    },
  },
  {
    id: 'job_order_status_update',
    dependsOn: [],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement OrderStatusUpdate',
      description: 'Administrative form for updating order status with validation',
      type: 'component',
      componentId: 'order_status_update',
      implementation: 'Create an administrative form using existing Select and Button components for order status updates. Include proper validation for status transitions.',
      acceptanceCriteria: [
        'Displays dropdown with available order statuses',
        'Enables update button only when status is changed',
        'Validates status transition rules',
        'Shows confirmation after successful update',
        'Handles update errors appropriately',
      ],
      prompt: 'Create an order status update form for administrators',
      storybookPath: 'components/OrderStatusUpdate',
      files: { create: ['src/components/ui/OrderStatusUpdate/OrderStatusUpdate.tsx', 'src/components/ui/OrderStatusUpdate/index.ts'] },
    },
  },
  {
    id: 'job_book_addition_form',
    dependsOn: ['job_book_form_fields'],
    target: 'ImplementComponent',
    payload: {
      title: 'Implement BookAdditionForm',
      description: 'Form for adding new books to the catalog with comprehensive validation',
      type: 'component',
      componentId: 'book_addition_form',
      implementation: 'Create a form component using BookFormFields with submission handling. Include validation for all fields and proper error handling.',
      acceptanceCriteria: [
        'Displays form fields for title, author, and price',
        'Enables submit button only when all fields are valid',
        'Validates price as positive number',
        'Shows field-specific validation errors',
        'Handles form submission and loading states',
      ],
      prompt: 'Create a book addition form with validation and submission handling',
      storybookPath: 'components/BookAdditionForm',
      files: { create: ['src/components/ui/BookAdditionForm/BookAdditionForm.tsx', 'src/components/ui/BookAdditionForm/index.ts'] },
    },
  },
];

export const fileId = 'kanbanNew1';

export const plugins = [
  '@auto-engineer/model-diff',
  '@auto-engineer/server-checks',
  '@auto-engineer/server-generator-apollo-emmett',
  '@auto-engineer/narrative',
  '@auto-engineer/information-architect',
  '@auto-engineer/generate-react-client',
  '@auto-engineer/react-component-implementer',
  '@auto-engineer/server-implementer',
  '@auto-engineer/app-implementer',
  '@auto-engineer/dev-server',
  '@auto-engineer/job-graph-processor',
];

export const pipeline = define('kanban-todo')
  .on('SchemaExported')
  .emit('DetectChanges', (e: { data: SchemaExportedData }) => {
    projectRoot = e.data.directory;
    return {
      modelPath: e.data.outputPath,
      destination: e.data.directory,
    };
  })

  .on('ChangesDetected')
  .emit('GenerateServer', (e: { data: ChangesDetectedData }) => ({
    modelPath: e.data.modelPath,
    destination: e.data.destination,
    changeSet: e.data.changeSet,
    isFirstRun: e.data.isFirstRun,
    newState: e.data.newState,
  }))

  .on('SliceGenerated')
  .emit('ImplementSlice', (e: { data: SliceGeneratedData }) => ({
    slicePath: resolvePath(e.data.slicePath),
    context: { previousOutputs: '', attemptNumber: 0 },
    aiOptions: { maxTokens: 2000 },
  }))

  .on('SliceImplemented')
  .emit('CheckTests', (e: { data: SliceImplementedData }) => ({
    targetDirectory: e.data.slicePath,
    scope: 'slice',
  }))
  .emit('CheckTypes', (e: { data: SliceImplementedData }) => ({
    targetDirectory: e.data.slicePath,
    scope: 'slice',
  }))
  .emit('CheckLint', (e: { data: SliceImplementedData }) => ({
    targetDirectory: e.data.slicePath,
    scope: 'slice',
    fix: true,
  }))

  .settled(['CheckTests', 'CheckTypes', 'CheckLint'])
  .dispatch({ dispatches: ['ImplementSlice'] }, (events, send) => {
    const allEvents = gatherAllCheckEvents(events);

    if (!hasAnyFailures(allEvents)) {
      const slicePath = extractSlicePath(events);
      sliceRetryState.delete(slicePath);
      return;
    }

    const slicePath = extractSlicePath(events);

    if (!shouldRetry(slicePath)) {
      const errors = collectErrors(allEvents);
      console.error(`Slice implementation failed after ${MAX_RETRIES} retries: ${slicePath}`);
      if (errors) {
        console.error(`   Last errors:\n${errors}`);
      }
      return;
    }

    const retryAttempt = incrementRetryCount(slicePath);
    send('ImplementSlice', {
      slicePath,
      context: { previousOutputs: collectErrors(allEvents), attemptNumber: retryAttempt },
      aiOptions: { maxTokens: 2000 },
    });
    return { persist: true };
  })

  .on('ServerGenerated')
  .emit('GenerateReactClient', () => ({
    targetDir: resolvePath('./client'),
  }))
  .emit('GenerateIA', () => {
    iaRetryCount = 0;
    return {
      modelPath: resolvePath('./.context/schema.json'),
      outputDir: resolvePath('./.context'),
    };
  })
  .emit('StartServer', () => ({
    serverDirectory: resolvePath('./server'),
  }))

  .on('ReactClientGenerated')
  .emit('StartClient', (e: { data: { targetDir: string } }) => ({
    clientDirectory: e.data.targetDir,
    command: 'pnpm dev',
  }))
  .emit('StartStorybook', (e: { data: { targetDir: string } }) => ({
    storybookDirectory: e.data.targetDir,
  }))

  .on('IAValidationFailed')
  .emit('GenerateIA', (e: { data: IAValidationFailedData }) => {
    iaRetryCount += 1;
    if (iaRetryCount > MAX_IA_RETRIES) {
      console.error('IA validation failed after max retries. Errors:', e.data.errors);
      return null;
    }
    const errorSummary = e.data.errors.map((err) => err.message).join('\n');
    console.log(`IA validation failed (attempt ${iaRetryCount}/${MAX_IA_RETRIES}). Retrying...`);
    console.log('Errors:\n', errorSummary);
    return {
      modelPath: e.data.modelPath,
      outputDir: e.data.outputDir,
      previousErrors: errorSummary,
    };
  })

  // --- Job Graph-Based Component Implementation ---
  // Receives a DAG of component jobs with dependsOn edges.
  // The job-graph-processor validates the DAG, performs topological scheduling,
  // and dispatches each job's target command (ImplementReactComponent) as its
  // dependencies are satisfied. Jobs at the same depth run in parallel.
  //
  // Each job is reshaped before dispatch: the graph processor sends job.payload
  // as command data, so we wrap the original job inside the payload to match
  // the { targetDir, job } shape that ImplementReactComponent expects.
  .on('JobGraphReady')
  .emit('ProcessJobGraph', (e: { data: JobGraphReadyData }) => {
    const clientDir = resolvePath(e.data.projectDir ?? './client');
    return {
      graphId: `components-${Date.now()}`,
      jobs: e.data.jobs.map((job) => ({
        ...job,
        target: 'ImplementReactComponent',
        payload: {
          targetDir: clientDir,
          job: {
            ...job,
            target: 'ImplementReactComponent',
          },
        },
      })),
      failurePolicy: e.data.failurePolicy ?? 'skip-dependents',
    };
  })

  // After all component jobs complete, run project-wide checks
  .on('graph.completed')
  .emit('CheckTypes', () => ({
    targetDirectory: resolvePath('./client'),
    scope: 'project',
  }))
  .emit('CheckLint', () => ({
    targetDirectory: resolvePath('./client'),
    scope: 'project',
    fix: true,
  }))

  .build();

export function resetState(): void {
  sliceRetryState.clear();
  iaRetryCount = 0;
  projectRoot = '';
}

export function setProjectRoot(root: string): void {
  projectRoot = root;
}

// ---------------------------------------------------------------------------
// Command handler: dispatch "TriggerJobGraph" to kick off the hardcoded jobs.
//   auto dispatch TriggerJobGraph
// ---------------------------------------------------------------------------

export const COMMANDS = [
  {
    name: 'TriggerJobGraph',
    alias: 'trigger:job-graph',
    description: 'Emit JobGraphReady with the hardcoded Book Store component jobs',
    events: [{ name: 'JobGraphReady' }],
    handle: async (_command: Command) => ({
      type: 'JobGraphReady' as const,
      data: {
        jobs: BOOK_STORE_JOBS,
        projectDir: './client',
        failurePolicy: 'skip-dependents' as const,
      },
    }),
  },
];

export default {
  fileId,
  plugins,
  pipeline,
  COMMANDS,
};
