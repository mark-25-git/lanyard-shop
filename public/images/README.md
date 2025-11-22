# Images Folder

This folder contains images used throughout the lanyard shop application.

## Folder Structure

Images are organized by category:
- `templates/` - Template preview images
- `products/` - Product images
- `icons/` - Icon images
- `logos/` - Logo images

## Usage

Images in this folder can be referenced in your code using:
```jsx
<img src="/images/your-image.jpg" alt="Description" />
```

Or in Next.js Image component:
```jsx
import Image from 'next/image';
<Image src="/images/your-image.jpg" alt="Description" width={500} height={300} />
```

## Notes

- All images in the `public` folder are served from the root URL
- Use descriptive filenames for better organization
- Optimize images before uploading (compress, resize if needed)

