# Cloudberries React Component Library

## Button.tsx
```tsx
export const Button = ({children, variant="primary", ...props}) => {
  const base = "px-4 py-2 rounded-xl font-semibold transition";
  const variants = {
    primary: "bg-cb-orange text-white hover:bg-orange-600",
    secondary: "bg-cb-gray-light text-cb-black hover:bg-gray-300"
  };
  return <button className={base + " " + variants[variant]} {...props}>{children}</button>
}
```

## Card.tsx
```tsx
export const Card = ({title, children}) => (
  <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
    {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
    {children}
  </div>
);
```
