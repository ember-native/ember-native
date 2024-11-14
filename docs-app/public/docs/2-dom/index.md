# Dom

the dom consists of nativescript components
like

- StackLayout
- GridLayout
- Label
- Button
- Text
- ...

The supported write forms are either all lower case or dash form.

e.g.
`grid-layout` or `gridlayout`

all text based components that support the text attribute can have text child nodes

like `Button` , `Label` or `Text`

e.g.

```gts
<template>
  <label>hi</label>
  <button> button text </button>
</template>
```

the text from the child nodes is concat and trimmed
