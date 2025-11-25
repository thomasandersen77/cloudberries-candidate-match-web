# Cloudberries UI Kit (Tailwind)

## Design Tokens
```css
:root {
  --cb-orange: #F26A21;
  --cb-black: #222222;
  --cb-gray-dark: #3A3A3A;
  --cb-gray-light: #F7F7F7;
  --cb-white: #FFFFFF;
  --cb-green: #3AAA35;
}
```

## Tailwind Theme Extension
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        cb: {
          orange: "#F26A21",
          black: "#222222",
          grayDark: "#3A3A3A",
          grayLight: "#F7F7F7",
          white: "#FFFFFF",
          green: "#3AAA35",
        }
      },
      borderRadius: {
        xl: "12px"
      }
    }
  }
}
```

## Components
- Buttons (primary, secondary)
- Cards
- Tables
- Forms
- Badges
- Layout containers
