# AnalyticsModal Pagination

The `AnalyticsModal` component has been enhanced with pagination functionality to handle large datasets (100+ items) efficiently.

## Features

- **Pagination Controls**: Navigate through large datasets with first, previous, next, and last page buttons
- **Items Per Page**: Configurable number of items displayed per page (default: 10)
- **Item Counter**: Shows current range and total number of items
- **Responsive Design**: Works well on different screen sizes
- **Backward Compatible**: Existing usage without pagination still works

## Usage

### Basic Usage (No Pagination)
```jsx
<AnalyticsModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="My Modal"
>
  <div>Your content here</div>
</AnalyticsModal>
```

### With Pagination
```jsx
<AnalyticsModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="All Items"
  items={itemsArray}
  itemsPerPage={8}
  renderItem={(item, index) => (
    <div key={index}>
      {/* Render your item here */}
      {item.name}
    </div>
  )}
  showPagination={true}
>
  {/* Fallback content (optional) */}
</AnalyticsModal>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls modal visibility |
| `onClose` | function | - | Callback when modal closes |
| `title` | string | - | Modal title |
| `width` | string | 'w-[800px]' | Modal width |
| `maxHeight` | string | 'max-h-[90vh]' | Modal max height |
| `items` | array | [] | Array of items to paginate |
| `itemsPerPage` | number | 10 | Number of items per page |
| `renderItem` | function | null | Function to render each item |
| `showPagination` | boolean | false | Enable pagination |

## renderItem Function

The `renderItem` function receives two parameters:
- `item`: The current item from the items array
- `index`: The global index of the item (useful for keys)

```jsx
const renderItem = (item, index) => (
  <div key={`${item.id}-${index}`}>
    <h3>{item.name}</h3>
    <p>{item.description}</p>
  </div>
);
```

## Example Implementation

See `StockMovement.jsx` and `SmartReorder.jsx` for complete examples of how to implement pagination with the AnalyticsModal.

## Testing Large Datasets

Both components include a toggle button to test with 150+ items using the `generateLargeItemsData()` function from `itemsData.js`.

## Performance Benefits

- **Memory Efficient**: Only renders items for the current page
- **Smooth Scrolling**: No performance issues with large datasets
- **Fast Navigation**: Quick page switching without re-rendering all items
- **Responsive**: Maintains good performance on mobile devices 