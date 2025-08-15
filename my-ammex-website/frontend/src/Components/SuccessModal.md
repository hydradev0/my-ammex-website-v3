# SuccessModal Component

A reusable success modal component that can be used throughout the application to display success messages after form submissions or other successful operations.

## Features

- ✅ Clean, modern design with smooth animations
- ✅ Auto-close functionality (configurable)
- ✅ Escape key support
- ✅ Scroll locking
- ✅ Customizable title and message
- ✅ Responsive design
- ✅ Accessible with proper focus management

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `false` | Controls whether the modal is visible |
| `onClose` | function | - | Function called when modal should close |
| `title` | string | `"Success!"` | The title displayed in the modal header |
| `message` | string | `"Operation completed successfully."` | The success message to display |
| `autoClose` | boolean | `true` | Whether the modal should automatically close |
| `autoCloseDelay` | number | `3000` | Delay in milliseconds before auto-closing |
| `showCloseButton` | boolean | `true` | Whether to show the close button |

## Basic Usage

```jsx
import { useState } from 'react';
import SuccessModal from './Components/SuccessModal';

function MyComponent() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    // Your success logic here
    setShowSuccess(true);
  };

  return (
    <div>
      <button onClick={handleSuccess}>Submit Form</button>
      
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Form Submitted!"
        message="Your form has been successfully submitted."
      />
    </div>
  );
}
```

## Advanced Usage

### Custom Auto-Close Settings

```jsx
<SuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Order Processed!"
  message="The order has been processed successfully."
  autoClose={true}
  autoCloseDelay={5000} // 5 seconds
/>
```

### Non-Auto-Closing Modal

```jsx
<SuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Important Success!"
  message="This requires user acknowledgment."
  autoClose={false}
  showCloseButton={true}
/>
```

### Custom Styling

The component uses Tailwind CSS classes and can be easily customized by modifying the component's CSS classes.

## Integration Examples

### After Form Submission

```jsx
const handleSubmit = async (formData) => {
  try {
    await submitForm(formData);
    setShowSuccessModal(true);
    // Optionally close the form modal
    onCloseForm();
  } catch (error) {
    // Handle error
  }
};
```

### After API Call

```jsx
const handleApiCall = async () => {
  try {
    const response = await api.post('/endpoint', data);
    if (response.success) {
      setShowSuccessModal(true);
    }
  } catch (error) {
    // Handle error
  }
};
```

## Styling

The component uses a consistent design language with:
- Green success color scheme
- Smooth entrance animations
- Responsive grid layout
- Modern shadow and border radius
- Hover effects on interactive elements

## Accessibility

- Proper ARIA labels
- Keyboard navigation support (Escape key)
- Focus management
- Screen reader friendly

## Dependencies

- React
- Lucide React (for icons)
- React DOM (for portal)
- Tailwind CSS (for styling)
- ScrollLock component (for scroll management)
