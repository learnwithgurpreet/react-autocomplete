# MIGRATION GUIDE

To see discussion around these API changes, please refer to the
[changelog](/CHANGELOG.md) and visit the commits and issues they
reference.

## From react-autocomplete to @learnwithgurpreet/react-autocomplete

- Node < 6 is no longer supported. [After upating to Eslint 6](https://eslint.org/docs/user-guide/migrating-to-6.0.0#drop-node-6)
- New required prop: `suggestionsMenuId`. Used to link the `input` with the menu of suggestions, so that screen readers can find the results
- `renderMenu` has as a second argument: `suggestionsMenuId`. Example:

```
renderMenu(items, suggestionsMenuId, value, style) {
  return <div id={suggestionsMenuId} role="listbox" style={{ ...style }}>{items}</div>
},
```

- Add note to inform screen reader users the amount of available resutls. Configurable via prop: `numberOfResultsAvailableCopy`

### Breaking changes

- Removed control of visibility of the menu via prop.

### Roadmap

Will be a breaking change

- If you need to access to the `input` DOM element, create a reference and send it as prop. The imperative API is removed now.
