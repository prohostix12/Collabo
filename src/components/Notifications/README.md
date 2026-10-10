# Toast Notification System

A standardized, reusable notification system for the application.

## Features

- ✅ Consistent styling across all pages
- ✅ 4 notification types: success, error, warning, info
- ✅ Auto-dismiss with configurable duration
- ✅ Pause on hover
- ✅ Smooth animations (slide in from top-right)
- ✅ Progress bar indicator
- ✅ Accessible (ARIA labels, keyboard support)
- ✅ Modern SaaS design (Notion/Stripe inspired)

## Usage

### Basic Usage

```javascript
import { useToast } from '../../contexts/ToastContext';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast.success('Success!', 'Your changes have been saved.');
  };

  const handleError = () => {
    toast.error('Error!', 'Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    toast.warning('Warning!', 'This action cannot be undone.');
  };

  const handleInfo = () => {
    toast.info('Info', 'New features are available.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}
```

### Custom Duration

```javascript
// Auto-dismiss after 6 seconds
toast.success('Saved!', 'Profile updated successfully.', 6000);

// No auto-dismiss (duration = 0)
toast.error('Critical Error', 'Please contact support.', 0);
```

### Title Only

```javascript
toast.success('Saved!');
```

### Message Only

```javascript
toast.info(null, 'This is just a message without a title.');
```

## API Reference

### `useToast()` Hook

Returns an object with the following methods:

#### `toast.success(title, message, duration)`
- **title**: string (optional) - Bold heading text
- **message**: string (optional) - Description text
- **duration**: number (optional, default: 4000ms) - Auto-dismiss time

#### `toast.error(title, message, duration)`
Same parameters as success

#### `toast.warning(title, message, duration)`
Same parameters as success

#### `toast.info(title, message, duration)`
Same parameters as success

## Styling

All styling uses Tailwind CSS utility classes. Colors follow this scheme:

- **Success**: Green (`green-50`, `green-600`, `green-900`)
- **Error**: Red (`red-50`, `red-600`, `red-900`)
- **Warning**: Orange (`orange-50`, `orange-600`, `orange-900`)
- **Info**: Blue (`blue-50`, `blue-600`, `blue-900`)

## Accessibility

- Uses `role="alert"` and `aria-live="polite"`
- Close button has `aria-label="Close notification"`
- Keyboard focusable with visible focus ring
- High contrast text for readability

## Animation Details

- **Entry**: Fade in + slide down from top (300ms)
- **Exit**: Fade out + slide right (300ms)
- **Easing**: Cubic bezier `[0.25, 0.46, 0.45, 0.94]`
- **Progress bar**: Linear animation at 60fps

## Examples in Codebase

Check these files for implementation examples:
- `frontend/src/components/Auth/Login.js`
- `frontend/src/components/Auth/Register.js`
- `frontend/src/components/Profile/InfluencerProfile.js`
