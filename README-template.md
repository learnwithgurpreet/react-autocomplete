# React Autocomplete 2[![Travis build status](https://travis-ci.org/danielavalero/react-autocomplete-2.svg?branch=master)](https://travis-ci.org/danielavalero/react-autocomplete-2/)

Accessible, extensible, Autocomplete for React.js. 

Things you should know about this fork:
1. It's a fork from `https://github.com/reactjs/react-autocomplete` so that we maintain its development
2. Looking for contributors
3. I am trying to revive the original repo
4. I am udpdating dependencies, code, adding and improving a11y, etc. Things might break. I should have done beta releases, but now is too late. I will then use the next major version to tell when things are more stable. For now, use it, find bugs, raise them here and or open pull requets!


```jsx
<Autocomplete
  getItemValue={(item) => item.id}
  suggestionsMenuId="input-name-suggestions"
  items={[
    { id: 'apple', label: 'apple' },
    { id: 'banana', label: 'banana' },
    { id: 'pear', label: 'pear' }
  ]}
  renderItem={(item, isHighlighted) =>
    <div
      key={item.id}
      role="option"
      style={{ background: isHighlighted ? 'lightgray' : 'white'}}
    >
      {item.label}
    </div>
  }
  value={this.state.value}
  onChange={e => this.setState({ value: e.target.value })}
  onSelect={value => this.setState({ value })}
/>
```

Check out [more examples](https://reactcommunity.org/react-autocomplete/) and get stuck right in with the [online editor](http://jsbin.com/mipesawapi/edit?js,output).

## Install

### npm

```bash
npm install --save react-autocomplete-2
```

### yarn

```bash
yarn add react-autocomplete-2
```

## Accessibility
The main goal of this library is to be accessible to all users. Screen reader and keyboard only users specially. In order to do that, it controls some parts of the markup, and exposes some others for your adaptations.

Particularly, it exposes functions that allow you to decide for yourself the DOM of:
* Menu
* Item
* Input

In order to make the component accessible, it sticks to the standard defined by WAI-ARIA 1.1. Examples of basic markup can be found [here](https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.1pattern/listbox-combo.html). 

#### Patterns that you can use easily with this lib
1. **List autocomplete with manual selection:** When the popup is triggered, it presents suggested values that complete or logically correspond to the characters typed in the textbox. The character string the user has typed will become the value of the textbox unless the user selects a value in the popup.
How? Set these props to false:
```
selectOnBlur={false}
autoHighlight={false}
```

2. **List autocomplete with automatic selection:** When the popup is triggered, it presents suggested values that complete or logically correspond to the characters typed in the textbox, and the first suggestion is automatically highlighted as selected. The automatically selected suggestion becomes the value of the textbox when the combobox loses focus unless the user chooses a different suggestion or changes the character string in the textbox. 
How? Set these props to true:
```
selectOnBlur={true}
autoHighlight={true}
```


And to understand the comobobox pattern, the best place to start is [to read the spec](https://www.w3.org/TR/wai-aria-practices-1.1/#combobox).

Having said that, in the demo page, you will see 4 examples. Some follow the pattern List autocomplete with manual selection, others follow the pattern List autocomplete with automatic selection.

### Things to mind when having custom implementations of any of the `render` properties.

#### RenderItem
Appart from all other attributes to have a valid markup. Note: This library will add automatically an ID to the item, will be the concatenation of the `suggestionsMenuId` with `item-{itemIndex}`; It will be used to define the active descendant. 

why do we need active-descendant? because it will manage the focus to the screen reader.


* To `renderItem` add for example: 
```js
 renderItem={(item, isHighlighted) => (
    <div
      role="option"
      aria-selected={isHighlighted}
      key={item.abbr}
    >{item.name}</div>
  )}
```

#### RenderMenu
Be sure to add the `id` and the `role=listbox`
```jsx
  id={suggestionsMenuId} 
  role="listbox" 
```

#### RenderInput
First of all, you don't want the browser autcomplete (like Chrome's one) to appear on top of your suggestions. For that, switch of the autocomplete attribute.

Second, the standard does not show how to add instructions, but it is a nice thing to add, so that the screen reader user knows that they are not only in a text field, but they also know they are in a combobox, that gives them the chance to select suggestions from below. To do that, add the `aria-describedby` pointing to an element in the DOM with the instructions. (this is shown in the examples, you can test it there)


```jsx
  autoComplete="something-that-is-not-off" 
  aria-describedby="the-id-to-instructions-if-any"
```

Example of instructions DOM element:
```jsx
<span id="init-Instructions" className="sr-only">When autocomplete results are available use up and down arrows to review and enter to select. Touch device users, explore by touch or with swipe gestures.</span>
```

**Note:** Don't follow these guides blindly. Test them in a real screen reader. Does not take so much. [Here some cheat sheets](https://dequeuniversity.com/screenreaders/)

## API

### Props

#### `getItemValue: Function`
Arguments: `item: Any`

Used to read the display value from each entry in `items`.

#### `suggestionsMenuId`: string
Default value: ''

Will be used in aria-owns of the input field, and the id of the suggestions menu to let 
screen readers know where to find the suggestions of the autocomplete

#### `items: Array`
The items to display in the dropdown menu

#### `renderItem: Function`
Arguments: `item: Any, isHighlighted: Boolean, styles: Object`

Invoked for each entry in `items` that also passes `shouldItemRender` to
generate the render tree for each item in the dropdown menu. `styles` is
an optional set of styles that can be applied to improve the look/feel
of the items in the dropdown menu.

#### `numberOfResultsAvailableCopy`: string (optional)
Default value: 'Autocomplete results are available below.'

A string that will be added to the notification that tells the screen reader user the amount of results available.

#### `autoHighlight: Boolean` (optional)
Default value: `true`

Whether or not to automatically highlight the top match in the dropdown
menu.

#### `inputProps: Object` (optional)
Default value: `{}`

Props passed to `props.renderInput`. By default these props will be
applied to the `<input />` element rendered by `Autocomplete`, unless you
have specified a custom value for `props.renderInput`. Any properties
supported by `HTMLInputElement` can be specified, apart from the
following which are set by `Autocomplete`: value, autoComplete, role,
aria-autocomplete. `inputProps` is commonly used for (but not limited to)
placeholder, event handlers (onFocus, onBlur, etc.), autoFocus, etc..

#### `isItemSelectable: Function` (optional)
Default value: `function() { return true }`

Arguments: `item: Any`

Invoked when attempting to select an item. The return value is used to
determine whether the item should be selectable or not.
By default all items are selectable.

#### `menuStyle: Object` (optional)
Default value:
```jsx
{
  borderRadius: '3px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  background: 'rgba(255, 255, 255, 0.9)',
  padding: '2px 0',
  fontSize: '90%',
  position: 'fixed',
  overflow: 'auto',
  maxHeight: '50%', // TODO: don't cheat, let it flow to the bottom
}
```

Styles that are applied to the dropdown menu in the default `renderMenu`
implementation. If you override `renderMenu` and you want to use
`menuStyle` you must manually apply them (`this.props.menuStyle`).

#### `onChange: Function` (optional)
Default value: `function() {}`

Arguments: `event: Event, value: String`

Invoked every time the user changes the input's value.

#### `onMenuVisibilityChange: Function` (optional)
Default value: `function() {}`

Arguments: `isOpen: Boolean`

Invoked every time the dropdown menu's visibility changes (i.e. every
time it is displayed/hidden).

#### `onSelect: Function` (optional)
Default value: `function() {}`

Arguments: `value: String, item: Any`

Invoked when the user selects an item from the dropdown menu.

#### `renderInput: Function` (optional)
Default value:
```jsx
function(props) {
  return <input {...props} />
}
```

Arguments: `props: Object`

Invoked to generate the input element. The `props` argument is the result
of merging `props.inputProps` with a selection of props that are required
both for functionality and accessibility. At the very least you need to
apply `props.ref` and all `props.on<event>` event handlers. Failing to do
this will cause `Autocomplete` to behave unexpectedly.

#### `renderMenu: Function` (optional)
Default value:
```jsx
function(items, value, style, suggestionsMenuId) {
  return <div id={suggestionsMenuId} style={{ ...style, ...this.menuStyle }} children={items}/>
}
```

Arguments: `items: Array<Any>, value: String, styles: Object, suggestionsMenuId: string`

Invoked to generate the render tree for the dropdown menu. Ensure the
returned tree includes every entry in `items` or else the highlight order
and keyboard navigation logic will break. `styles` will contain
{ top, left, minWidth } which are the coordinates of the top-left corner
and the width of the dropdown menu.
`suggestionsMenuId` needs to be the same id value that `aria-owns` of the input field has.

#### `selectOnBlur: Boolean` (optional)
Default value: `false`

Whether or not to automatically select the highlighted item when the
`<input>` loses focus.

#### `shouldItemRender: Function` (optional)
Arguments: `item: Any, value: String`

Invoked for each entry in `items` and its return value is used to
determine whether or not it should be displayed in the dropdown menu.
By default all items are always rendered.

#### `sortItems: Function` (optional)
Arguments: `itemA: Any, itemB: Any, value: String`

The function which is used to sort `items` before display.

#### `value: Any` (optional)
Default value: `''`

The value to display in the input field

#### `wrapperProps: Object` (optional)
Default value: `{}`

Props that are applied to the element which wraps the `<input />` and
dropdown menu elements rendered by `Autocomplete`.

#### `wrapperStyle: Object` (optional)
Default value:
```jsx
{
  display: 'inline-block'
}
```

This is a shorthand for `wrapperProps={{ style: <your styles> }}`.
Note that `wrapperStyle` is applied before `wrapperProps`, so the latter
will win if it contains a `style` entry.


### Imperative API

In addition to the props there is an API available on the mounted element which is similar to that of `HTMLInputElement`. In other words: you can access most of the common `<input>` methods directly on an `Autocomplete` instance. An example:

```jsx
class MyComponent extends Component {
  componentDidMount() {
    // Focus the input and select "world"
    this.input.focus()
    this.input.setSelectionRange(6, 11)
  }
  render() {
    return (
      <Autocomplete
        ref={el => this.input = el}
        value="hello world"
        ...
      />
    )
  }
}
```

# Development
You can start a local development environment with `npm start`. This command starts a static file server on [localhost:8080](http://localhost:8080) which serves the examples in `examples/`. Hot-reload mechanisms are in place which means you don't have to refresh the page or restart the build for changes to take effect.

## Tests!

Run them:
`npm test`

Write them:
`lib/__tests__/Autocomplete-test.js`

Check your work:
`npm run coverage`

## Scripts
Run with `npm run <script>`.

### gh-pages
Builds the examples and assembles a commit which is pushed to `origin/gh-pages`, then cleans up your working directory. Note: This script will `git checkout master` before building.

### release
Takes the same argument as `npm publish`, i.e. `[major|minor|patch|x.x.x]`, then tags a new version, publishes, and pushes the version commit and tag to `origin/master`. Usage: `npm run release -- [major|minor|patch|x.x.x]`. Remember to update the CHANGELOG before releasing!

### build
Runs the build scripts detailed below.

### build:component
Transpiles the source in `lib/` and outputs it to `build/`, as well as creating a UMD bundle in `dist/`.

### build:examples
Creates bundles for each of the examples, which is used for pushing to `origin/gh-pages`.

### test
Runs the test scripts detailed below.

### test:lint
Runs `eslint` on the source.

### test:jest
Runs the unit tests with `jest`.

### coverage
Runs the unit tests and creates a code coverage report.

### start
Builds all the examples and starts a static file server on [localhost:8080](http://localhost:8080). Any changes made to `lib/Autocomplete.js` and the examples are automatically compiled and transmitted to the browser, i.e. there's no need to refresh the page or restart the build during development. This script is the perfect companion when making changes to this repo, since you can use the examples as a test-bed for development.