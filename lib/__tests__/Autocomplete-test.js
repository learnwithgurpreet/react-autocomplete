/**
 * @jest-environment jsdom
 */
import React from 'react'
import { mount, shallow } from 'enzyme'
import { render, fireEvent, wait } from '@testing-library/react'
import Autocomplete from '../Autocomplete'
import {
  getStates,
  getCategorizedStates,
  matchStateToTermWithHeaders
} from '../utils'

function AutocompleteComponentJSX(extraProps) {
  return (
    <Autocomplete
      getItemValue={(item) => item.name}
      suggestionsMenuId="menu-suggestions-id"
      inputProps={{['data-testid']: "inputField"}}
      items={getStates()}
      renderItem={(item, isHighlighted) => (
        <div
          key={item.abbr}
          data-is-highlighted={isHighlighted}
          aria-selected={isHighlighted}
          role="option"
        >{item.name}</div>
      )}
      shouldItemRender={matchStateToTermWithHeaders}
      {...extraProps}
    />
  )
}

function renderElementAsDom(extraProps) {
  return render(AutocompleteComponentJSX(extraProps));
}

jest.useFakeTimers()

afterEach(() => {
  jest.clearAllTimers()
  setTimeout.mockClear()
  clearTimeout.mockClear()
})
beforeEach(()=> {
  jest.clearAllMocks()
  jest.resetAllMocks()
  jest.restoreAllMocks()
});

describe('AcceptanceTests', () => {

  it('should display autocomplete menu input user types something in the input', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const autocompleteInputWrapper = autocompleteWrapper.find('input');
    expect(autocompleteWrapper.state('isOpen')).toBe(false)
    expect(autocompleteWrapper.instance().references.menu.current).toBeNull()
    autocompleteInputWrapper.simulate('focus')
    autocompleteInputWrapper.simulate('change', {target: { value: 'a'}})

    expect(autocompleteWrapper.state('isOpen')).toBe(true)
    expect(autocompleteWrapper.instance().references.menu).not.toBe(undefined)
  })

  // COMMENT, the second change is not being fired. Can't figure it out
  xit('should close the menu when the value changes to an empty string`', async () => {
    const { getByTestId, getByRole, container} = renderElementAsDom();
    const input = getByTestId('inputField');
    fireEvent.focus(input);

    await wait(()=> {

      fireEvent.change(input, { target: { value: "Ala"}});
      expect(container).toContainElement(getByRole('listbox'));
      fireEvent.change(input, { target: { value: ""}});
      expect(container).not.toContainElement(getByRole('listbox'));
    })
  })

  it('should show results when value is a partial match', () => {
    const { getByTestId, getByRole, rerender } = renderElementAsDom();
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a"}});
    const menuDom = getByRole('listbox');
    // Render autocomplete results upon partial input match
    expect(getByRole('listbox').children).toHaveLength(50)

    rerender(AutocompleteComponentJSX({value: 'Ar'}));
    expect(menuDom.children).toHaveLength(6)
  })

  it('should allow using custom components', () => {
    /* eslint-disable react/prop-types */
    class Menu extends React.Component {
      render() {
        return <div role="listbox">{this.props.items}</div>
      }
    }
    class Item extends React.Component {
      render() {
        return <div role="option">{this.props.item.name}</div>
      }
    }
    //   /* eslint-enable react/prop-types */

    const { getByTestId, getByRole } = renderElementAsDom({
    renderMenu(items) {
      return <Menu items={items} />
    },
    renderItem(item) {
      return <Item key={item.abbr} item={item} />
    }});
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a"}});
    const menuDom = getByRole('listbox');
    expect(menuDom).toBeInTheDocument()
    expect(menuDom.children).toHaveLength(50)
  })

  it('should close autocomplete menu when input is blurred', () => {
    const { container, getByTestId, getByRole } = renderElementAsDom({});
    const input = getByTestId('inputField');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a"}});
    let menuDom = getByRole('listbox');
    expect(menuDom).toBeVisible();

    fireEvent.blur(input);

    const nonExistantElement = container.querySelector('[role="listbox"]');
    expect(container).not.toContainElement(nonExistantElement);
  })

  it('should highlight top match when `props.value` changes', () => {
    const { getByRole, getByTestId, getAllByRole, rerender } = renderElementAsDom({value: ''});
    const input = getByTestId('inputField');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a"}});
    let items = getAllByRole('option');

    let itemHighlighted = items.filter((item)=> { return item.dataset.isHighlighted === true })
    expect(itemHighlighted).toEqual([])

    fireEvent.change(input, {target: {value: 'a'}});
    // TODO: the onChange does not upadte automatically the rendered items. Happens only on prop Change
    rerender(AutocompleteComponentJSX({value: 'a'}));
    const menuDom = getByRole('listbox')
    const selectedItem = menuDom.querySelector('[data-is-highlighted="true"]')
    expect(menuDom).toContainElement(selectedItem);
  })

  it('should highlight top match when an item appears in `props.items` that matches `props.value`', () => {
    const { getByRole, getByTestId, getAllByRole, rerender } = renderElementAsDom({
      items: [],
    });
    const input = getByTestId('inputField');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a"}});
    rerender(AutocompleteComponentJSX({value: 'a'}));

    let items = getAllByRole('option');
    let itemHighlighted = items.filter((item)=> { return item.dataset.isHighlighted === true })
    expect(itemHighlighted).toEqual([])

    rerender(AutocompleteComponentJSX({value: 'a', items: getStates()}));
    const menuDom = getByRole('listbox')
    const selectedItem = menuDom.querySelector('[data-is-highlighted="true"]')
    expect(menuDom).toContainElement(selectedItem);
  })

  it('should not highlight top match when `props.autoHighlight=false`', () => {
    const { getByRole, getByTestId } = renderElementAsDom({
      autoHighlight: false,
      value: ''
    })
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Al"}});
    const menuDom = getByRole('listbox')
    const selectedItem = menuDom.querySelector('[data-is-highlighted="true"]')
    expect(menuDom).not.toContainElement(selectedItem);
  })

  it('should reset `state.highlightedIndex` if `props.value` doesn\'t match anything', () => {
    const tree = mount(AutocompleteComponentJSX({
      shouldItemRender() { return true },
    }))
    jest.spyOn(tree.instance(), 'maybeAutoCompleteText')
    tree.setProps({ value: 'ax' })
    expect(tree.instance().maybeAutoCompleteText).toHaveBeenCalledTimes(1)
    expect(tree.state('highlightedIndex')).toEqual(null)
  })

  it('should preserve `state.highlightedIndex` when `props.value` changes as long as it still matches', () => {
    const { getByRole, getByTestId, rerender } = renderElementAsDom({
      value: 'h',
      shouldItemRender() { return true },
    });
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Ala"}});
    rerender(AutocompleteComponentJSX({value: 'ha'}));
    const menuDom = getByRole('listbox')
    const selectedItem = menuDom.querySelector('[data-is-highlighted="true"]')
    expect(menuDom).toContainElement(selectedItem);
  });

  it('should reset `state.highlightedIndex` when it falls outside of possible `props.items` range', () => {
    const { getByTestId, getByRole, rerender } = renderElementAsDom({
    });
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "a"}});
    let menuDom =  getByRole('listbox');
    fireEvent.change(input, { value : 'new' });
    const items = getStates().slice(5)
    rerender(AutocompleteComponentJSX({items}));
    menuDom = getByRole('listbox');
    let selectedItemInMenu = menuDom.querySelector('[data-is-highlighted="true"]')
    expect(selectedItemInMenu).toBeNull();
  })

  it('should preserve the matched item even when its previous place was outside of the new range', async () => {
    const { getByTestId, getAllByRole } = renderElementAsDom({ value: '' });
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Al"}});

    await wait(() => {
      const items = getAllByRole("option");
      const selectedItem = items.map((item)=> item.getAttribute('aria-selected') === true)
      expect(selectedItem).not.toBeNull();

      fireEvent.change(input, { target: { value: "Ala"}});
      const updatedValues = getAllByRole("option");
      const newItem = updatedValues.map((item)=> item.getAttribute('aria-selected') === true)
      expect(newItem).toEqual(selectedItem);
    });
  })

  it('should invoke `props.inMenuVisibilityChange` when `state.isOpen` changes', () => {
    const onMenuVisibilityChange = jest.fn()
    const tree = mount(AutocompleteComponentJSX({ onMenuVisibilityChange }))
    expect(tree.state('isOpen')).toBe(false)
    expect(onMenuVisibilityChange).not.toHaveBeenCalled()
    tree.setState({ isOpen: true })
    expect(onMenuVisibilityChange).toHaveBeenCalledTimes(1)
    expect(onMenuVisibilityChange.mock.calls[0][0]).toBe(true)
    tree.setState({ isOpen: false })
    expect(onMenuVisibilityChange).toHaveBeenCalledTimes(2)
    expect(onMenuVisibilityChange.mock.calls[1][0]).toBe(false)
  })

  it('should allow specifying any event handler via `props.inputProps`', () => {
    const handlers = ['Focus', 'Blur', 'KeyDown', 'KeyUp', 'Click']
    const spies = []
    const inputProps = {}
    handlers.forEach((handler, i) => inputProps[`on${handler}`] = spies[i] = jest.fn())
    const tree = mount(AutocompleteComponentJSX({ inputProps }))
    handlers.forEach((handler, i) => {
      tree.find('input').simulate(handler.toLowerCase())
      expect(spies[i]).toHaveBeenCalledTimes(1)
      expect(spies[i].mock.calls[0][0]).toBeDefined()
    })
  })

  it('should not invoke onBlur and/or onFocus when selecting an item from the menu', () => {
    const onBlurSpy = jest.fn()
    const onFocusSpy = jest.fn()
    const onSelectSpy = jest.fn()
    const tree = mount(AutocompleteComponentJSX({
      inputProps: {
        onBlur: onBlurSpy,
        onFocus: onFocusSpy,
      },
      onSelect: onSelectSpy,
    }))
    const input = tree.find('input').at(0);
    input.simulate('focus');
    input.simulate('change', {target: 'a'});
    onFocusSpy.mockClear()
    tree.find('[role="listbox"]').simulate('mouseEnter')
    tree.find('[role="option"]').first().simulate('click')
    expect(onBlurSpy).not.toHaveBeenCalled()
    expect(onFocusSpy).not.toHaveBeenCalled()
    expect(onSelectSpy).toHaveBeenCalledTimes(1)
  })

  it('should select value on blur when selectOnBlur=true and highlightedIndex is not null', async () => {
    const onSelect = jest.fn()
    const { getByTestId, getByText } = renderElementAsDom({
      autoHighlight: false,
      value: '',
      onSelect
    });

    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Massac"}});
    let item = getByText('Massachusetts');
    fireEvent.click(item);
    fireEvent.blur(input);
    await wait (()=> {
      expect(onSelect).toHaveBeenCalledWith('Massachusetts', getStates()[20])
    })
  })

  it('should not select value on blur when selectOnBlur=false', () => {
    const onSelect = jest.fn()
    const tree = mount(AutocompleteComponentJSX({
      selectOnBlur: false,
      onSelect,
    }))
    const input = tree.find('input').at(0);
    input.simulate('focus')
    input.simulate('change', {target: { value: 'Massac'}})
    input.simulate('blur')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('should not select value on blur when selectOnBlur=true and highlightedIndex=null ', () => {
    const onSelect = jest.fn()
    const tree = mount(AutocompleteComponentJSX({
      selectOnBlur: false,
      onSelect,
    }))
    tree.find('input').at(0).simulate('focus')
    tree.setProps({ value: 'ma' })
    tree.setState({ highlightedIndex: null })
    tree.find('input').at(0).simulate('blur')
    expect(onSelect).not.toHaveBeenCalled()
  })
});

describe('focus management', () => {

  xit('should preserve focus when clicking on a menu item', () => {
    const { getByTestId, getAllByRole } = renderElementAsDom({
      value: ''
    });
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Al"}});
    const items = getAllByRole("option");
    fireEvent.click(items[0]);
    expect(input).toHaveFocus()
  })

  it('...even if `input.focus()` happens async (IE)', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const instance = autocompleteWrapper.instance()
    const input = autocompleteWrapper.find('input')
    input.simulate('focus')
    input.simulate('change', { target: { value: 'Al'}})
    instance.references.input.current.focus = jest.fn()
    expect(autocompleteWrapper.state('isOpen')).toBe(true)

    const menu = autocompleteWrapper.find('[role="listbox"]');
    menu.simulate('mouseEnter')
    expect(instance._ignoreBlur).toBe(true)
    input.simulate('blur')
    expect(autocompleteWrapper.state('isOpen')).toBe(true)
    const items = autocompleteWrapper.find('div > div > div')
    items.at(3).simulate('click')
    expect(instance.references.input.current.focus).toHaveBeenCalledTimes(1)
    expect(instance._ignoreFocus).toBe(true)
    input.simulate('focus')
    expect(autocompleteWrapper.state('isOpen')).toBe(false)
    expect(instance._ignoreBlur).toBe(false)
    expect(instance._ignoreFocus).toBe(false)
  })

  it('should preserve focus when clicking on non-item elements in the menu', () => {
    const tree = mount(AutocompleteComponentJSX({
      /* eslint-disable react/display-name */
      renderMenu: (items) => (<div role="listbox"><span />{items}</div>),
      /* eslint-enable react/display-name */
    }))
    const instance = tree.instance()
    const input = tree.find('input')
    input.simulate('focus')
    input.simulate('change', { target: { value: 'Al'}})
    instance.references.input.current.focus = jest.fn(() => input.simulate('focus'))
    expect(tree.state('isOpen')).toBe(true)
    const menu = tree.find('[role="listbox"]');
    menu.simulate('mouseEnter')
    expect(instance._ignoreBlur).toBe(true)
    input.simulate('blur')
    expect(tree.state('isOpen')).toBe(true)
    const nonItem = tree.find('[role="listbox"]')
    nonItem.simulate('click')
    expect(instance.references.input.current.focus).toHaveBeenCalledTimes(1)
    expect(tree.state('isOpen')).toBe(true)
    expect(instance._ignoreBlur).toBe(true)
  })

  it('should save scroll position on blur', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const instance = autocompleteWrapper.instance()
    expect(instance._scrollOffset).toBe(null)
    instance._ignoreBlur = true
    instance.handleInputBlur()
    expect(instance._scrollOffset).toEqual(expect.any(Object))
    expect(instance._scrollOffset.x).toEqual(expect.any(Number))
    expect(instance._scrollOffset.y).toEqual(expect.any(Number))
    jest.clearAllTimers()
  })

  it('should restore scroll position on focus reset', () => {
    window.scrollTo = jest.fn();
    window.pageXOffset = 1;
    window.pageYOffset = 2;

    const { getByTestId, getByRole } = renderElementAsDom({});
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Al'}});
    let menuDom = getByRole('listbox');
    // sets the ignoreBlur to true, so that the _ignoreFocus can also be true :/ ..
    fireEvent.mouseEnter(menuDom);
    // _ignoreFocus is set to true on blur :/
    fireEvent.blur(input);
    // get it? me neither. But now we can focus the fiel to trigger the scroll...
    fireEvent.focus(input);
    expect(window.scrollTo).toHaveBeenCalledWith(1, 2)
    expect(clearTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenCalledTimes(1)
    jest.runAllTimers()
    expect(window.scrollTo).toHaveBeenLastCalledWith(1, 2)
    jest.clearAllTimers()
  })

  it('should clear any pending scroll timers on unmount', () => {
    window.scrollTo = jest.fn();
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const instance = autocompleteWrapper.instance()
    instance._scrollTimer = 42
    autocompleteWrapper.unmount()
    expect(instance._scrollTimer).toBe(null)
    expect(clearTimeout).toHaveBeenCalledWith(42)
    jest.clearAllTimers()
  })
})

// Event handler unit tests

describe('Autocomplete keyPress-><character> event handlers', () => {
  it('should pass updated `input.value` to `onChange` and replace with `props.value`', done => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({value: ''}));
    const autocompleteInputWrapper = autocompleteWrapper.find('input')
    // let value = ''
    // autocompleteWrapper.setProps({ value, onChange(_, v) { value = v } })
    autocompleteInputWrapper.simulate('keypress', { key : 'a', keyCode: 97, which: 97 })
    autocompleteInputWrapper.simulate('change')
    expect(autocompleteInputWrapper.get(0).props.value).toEqual('')
    done()
  })
})

describe('Autocomplete keyDown->ArrowDown event handlers', () => {
  it('should highlight the 1st item in the menu when none is selected', async () => {
    const { getByTestId, getByRole } = renderElementAsDom();
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, {target: { value: 'a'}})
    let menuDom =  getByRole('listbox');

    fireEvent.keyDown(input, { key : 'ArrowDown', keyCode: 40, which: 40 })

    let selectedItemInMenu = menuDom.querySelector('[data-is-highlighted="true"]')
    expect(selectedItemInMenu).not.toBeNull();
    const index = Array.prototype.indexOf.call(menuDom.children, selectedItemInMenu);
    expect(index).toEqual(0)
  })

  it('should highlight the following item item in the menu when a given one is selected', async () => {
    const { getByTestId, getByRole } = renderElementAsDom();
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, {target: { value: 'a'}})
    let menuDom =  getByRole('listbox');
    fireEvent.change(input, { value: 'ark' });
    fireEvent.keyDown(input, { key : 'ArrowDown', keyCode: 40, which: 40 })
    fireEvent.keyDown(input, { key : 'ArrowDown', keyCode: 40, which: 40 })

    menuDom = getByRole('listbox');
    let selectedItemInMenu =  menuDom.querySelector('[data-is-highlighted="true"]')
    expect(selectedItemInMenu).not.toBeNull();
    const index = Array.prototype.indexOf.call(menuDom.children, menuDom.querySelector('[data-is-highlighted="true"]'));
    expect(index).toEqual(1)
  })

  xit('should highlight the 1st item in the menu when the last is selected', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({value: ''}));
    const autocompleteInputWrapper = autocompleteWrapper.find('input')
    autocompleteWrapper.setState({ 'isOpen': true })
    // Set input to be an empty value, which displays all 50 states as items in the menu
    autocompleteInputWrapper.simulate('change', { target: { value: '' } })
    autocompleteWrapper.setState({ 'highlightedIndex': 49 })
    autocompleteWrapper.update()
    autocompleteInputWrapper.simulate('keyDown', { key : 'ArrowDown', keyCode: 40, which: 40 })
    autocompleteWrapper.update()
    expect(autocompleteWrapper.state('isOpen')).toBe(true)
    expect(autocompleteWrapper.state('highlightedIndex')).toEqual(0)
  })

  xit('should not select anything if there are no selectable items', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({value: ''}));
    const autocompleteInputWrapper = autocompleteWrapper.find('input');
    autocompleteWrapper.setState({ 'isOpen': true })
    autocompleteWrapper.setState({
      isOpen: true,
      highlightedIndex: null,
    })
    autocompleteWrapper.setProps({ isItemSelectable: () => false })

    autocompleteInputWrapper.simulate('keyDown', { key : 'ArrowDown', keyCode: 40, which: 40 })
    autocompleteWrapper.update()
    expect(autocompleteWrapper.state('highlightedIndex')).toBe(null)
  })

})

describe('Autocomplete keyDown->ArrowUp event handlers', () => {

  it('should highlight the last item in the menu when none is selected', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
  const autocompleteInputWrapper = autocompleteWrapper.find('input')
    autocompleteWrapper.setState({ 'isOpen': true })
    autocompleteWrapper.setState({ 'highlightedIndex': null })
    // Set input to be an empty value, which displays all 50 states as items in the menu
    autocompleteInputWrapper.simulate('change', { target: { value: '' } })

    autocompleteInputWrapper.simulate('keyDown', { key : 'ArrowUp', keyCode: 38, which: 38 })

    expect(autocompleteWrapper.state('isOpen')).toBe(true)
    expect(autocompleteWrapper.state('highlightedIndex')).toEqual(49)
  })

  it('should highlight the "n-1" item in the menu when "n" is selected', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
  const autocompleteInputWrapper = autocompleteWrapper.find('input')
    autocompleteWrapper.setState({ 'isOpen': true })

    const n = 4
    // Set input to be an empty value, which displays all 50 states as items in the menu
    autocompleteInputWrapper.simulate('change', { target: { value: '' } })
    autocompleteWrapper.setState({ 'highlightedIndex': n })

    autocompleteInputWrapper.simulate('keyDown', { key : 'ArrowUp', keyCode: 38, which: 38 })

    expect(autocompleteWrapper.state('isOpen')).toBe(true)
    expect(autocompleteWrapper.state('highlightedIndex')).toEqual(n-1)
  })

  it('should highlight the last item in the menu when the 1st is selected', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
  const autocompleteInputWrapper = autocompleteWrapper.find('input')
    autocompleteWrapper.setState({ 'isOpen': true })

    // Set input to be an empty value, which displays all 50 states as items in the menu
    autocompleteInputWrapper.simulate('change', { target: { value: '' } })
    autocompleteWrapper.setState({ 'highlightedIndex': 0 })

    autocompleteInputWrapper.simulate('keyDown', { key : 'ArrowUp', keyCode: 38, which: 38 })

    expect(autocompleteWrapper.state('isOpen')).toBe(true)
    expect(autocompleteWrapper.state('highlightedIndex')).toEqual(49)
  })

  it('should not select anything if there are no selectable items', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
  const autocompleteInputWrapper = autocompleteWrapper.find('input')
    autocompleteWrapper.setState({
      isOpen: true,
      highlightedIndex: null,
    })
    autocompleteWrapper.setProps({ isItemSelectable: () => false })

    autocompleteInputWrapper.simulate('keyDown', { key : 'ArrowUp', keyCode: 38, which: 38 })

    expect(autocompleteWrapper.state('highlightedIndex')).toBe(null)
  })

})

describe('Autocomplete keyDown->Enter event handlers', () => {

  it('should do nothing if the menu is closed', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    autocompleteWrapper.setState({ 'isOpen': false })
    autocompleteWrapper.simulate('keyDown', { key : 'Enter', keyCode: 13, which: 13 })
    expect(autocompleteWrapper.state('isOpen')).toBe(false)
  })

  it('should close menu if input has focus but no item has been selected and then the Enter key is hit', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const autocompleteInputWrapper = autocompleteWrapper.find('input')
    let value = ''
    autocompleteWrapper.setState({ 'isOpen': true })
    autocompleteInputWrapper.simulate('focus')
    autocompleteWrapper.setProps({ value, onSelect(v) { value = v } })

    // simulate keyUp of backspace, triggering autocomplete suggestion on an empty string, which should result in nothing highlighted
    autocompleteInputWrapper.simulate('keyUp', { key : 'Backspace', keyCode: 8, which: 8 })
    expect(autocompleteWrapper.state('highlightedIndex')).toBe(null)

    autocompleteInputWrapper.simulate('keyDown', { key : 'Enter', keyCode: 13, which: 13 })

    expect(value).toEqual('')
    expect(autocompleteWrapper.state('isOpen')).toBe(false)

  })

  it('should invoke `onSelect` with the selected menu item and close the menu', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const autocompleteInputWrapper = autocompleteWrapper.find('input')
    let value = 'Ar'
    let defaultPrevented = false
    autocompleteWrapper.setState({ 'isOpen': true })
    autocompleteInputWrapper.simulate('focus')
    autocompleteWrapper.setProps({ value, onSelect(v) { value = v } })

    // simulate keyUp of last key, triggering autocomplete suggestion + selection of the suggestion in the menu
    autocompleteInputWrapper.simulate('keyUp', { key : 'r', keyCode: 82, which: 82 })

    // Hit enter, updating state.value with the selected Autocomplete suggestion
    autocompleteInputWrapper.simulate('keyDown', { key : 'Enter', keyCode: 13, which: 13, preventDefault() { defaultPrevented = true } })
    expect(value).toEqual('Arizona')
    expect(autocompleteWrapper.state('isOpen')).toBe(false)
    expect(defaultPrevented).toBe(true)

  })

  it('should do nothing if `keyCode` is not 13', () => {
    const onSelect = jest.fn()
    const tree = mount(AutocompleteComponentJSX({
      onSelect,
    }))
    tree.setState({ isOpen: true })
    tree.find('input').simulate('keyDown', { key : 'Enter', keyCode: 229 })
    expect(tree.state('isOpen')).toBe(true)
    expect(onSelect).not.toHaveBeenCalled()
    tree.setState({ highlightedIndex: 1 })
    tree.find('input').simulate('keyDown', { key : 'Enter', keyCode: 229 })
    expect(tree.state('isOpen')).toBe(true)
    expect(onSelect).not.toHaveBeenCalled()
  })

})

describe('Autocomplete keyDown->Escape event handlers', () => {

  it('should unhighlight any selected menu item + close the menu', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const autocompleteInputWrapper = autocompleteWrapper.find('input')
    autocompleteWrapper.setState({ 'isOpen': true })
    autocompleteWrapper.setState({ 'highlightedIndex': 0 })

    autocompleteInputWrapper.simulate('keyDown', { key : 'Escape', keyCode: 27, which: 27 })

    expect(autocompleteWrapper.state('isOpen')).toBe(false)
    expect(autocompleteWrapper.state('highlightedIndex')).toBe(null)
  })

})

describe('Autocomplete keyDown', () => {
  it('should not clear highlightedIndex for keys that don\'t modify `input.value`', () => {
    const tree = mount(AutocompleteComponentJSX())
    const input = tree.find('input')
    input.at(0).simulate('focus');
    input.at(0).simulate('change', {target: 'a'});
    tree.setProps({ value: 'a' })
    expect(tree.state('highlightedIndex')).toBe(0)
    input.simulate('keyDown', { key : 'ArrowLeft', keyCode: 37, which: 37 })
    input.simulate('keyUp', { key : 'ArrowLeft', keyCode: 37, which: 37 })
    expect(tree.state('highlightedIndex')).toBe(0)
    input.simulate('keyDown', { key : 'ArrowRight', keyCode: 39, which: 39 })
    input.simulate('keyUp', { key : 'ArrowRight', keyCode: 39, which: 39 })
    expect(tree.state('highlightedIndex')).toBe(0)
    input.simulate('keyDown', { key : 'Control', keyCode: 17, which: 17, ctrlKey: true })
    input.simulate('keyUp', { key : 'Control', keyCode: 17, which: 17, ctrlKey: true })
    expect(tree.state('highlightedIndex')).toBe(0)
    input.simulate('keyDown', { key : 'Alt', keyCode: 18, which: 18, altKey: true })
    input.simulate('keyUp', { key : 'Alt', keyCode: 18, which: 18, altKey: true })
    expect(tree.state('highlightedIndex')).toBe(0)
  })
})

describe('Autocomplete mouse event handlers', () => {

  it('should not open menu if it is closed when clicking in the input', () => {
    const autocompleteWrapper = mount(AutocompleteComponentJSX({}))
    const input = autocompleteWrapper.find('input');
    expect(autocompleteWrapper.state('isOpen')).toBe(false)
    input.at(0).simulate('focus');
    input.at(0).simulate('click');
    expect(autocompleteWrapper.state('isOpen')).toBe(false)
  })

  it('should set `highlightedIndex` when hovering over items in the menu', () => {
    const tree = mount(AutocompleteComponentJSX())
    const input = tree.find('input')
    input.at(0).simulate('focus');
    input.at(0).simulate('change', {target: 'a'});
    const items = tree.find('[role="listbox"]').children();
    expect(tree.state('highlightedIndex')).toBe(null)
    items.at(2).simulate('mouseEnter')
    expect(tree.state('highlightedIndex')).toBe(2)
  })

  it('should select an item when clicking on an item in the menu', () => {
    let selected
    const tree = mount(AutocompleteComponentJSX({
      onSelect(value, item) { selected = item },
    }))
    const input = tree.find('input')
    input.at(0).simulate('focus');
    input.at(0).simulate('change', {target: {value: 'a'}});
    const item = tree.find('[role="option"]').at(3)
    item.simulate('click')
    expect(selected).toEqual(getStates()[3])
  })
})

describe('Autocomplete.props.renderInput', () => {
  it('should be invoked in `render` to create the <input> element', () => {
    const renderInput = jest.fn(props => {
      expect(props).toMatchSnapshot()
      return (
        <div>
          <input
            {...props}
            autoComplete="on"
          />
        </div>
      )
    })
    const tree = shallow(AutocompleteComponentJSX({
      value: 'pants',
      inputProps: {
        foo: 'bar',
      },
      renderInput,
    }))
    expect(renderInput).toHaveBeenCalledTimes(1)
    expect(tree).toMatchSnapshot()
  })
})

describe('Autocomplete isItemSelectable', () => {
  xit('should automatically highlight the first selectable item', () => {
    // Inputting 'ne' will cause Nevada to be the first selectable state to show up under the header 'West'
    // The header (index 0) is not selectable, so should not be automatically highlighted.
    const { getByTestId, getByRole, rerender } = renderElementAsDom({
      isItemSelectable: item => !!item && item.name !== 'Alabama',
      autoHighlight: true,
      value: 'a'
    });

    rerender(AutocompleteComponentJSX({
      isItemSelectable: item => !!item && item.name !== 'Alabama',
      autoHighlight: true,
      value: 'al'}));

      const input = getByTestId('inputField');
      fireEvent.focus(input);
      fireEvent.change(input, {target: 'ala'});

      const menuDom = getByRole('listbox')
      const selectedItemInMenu = menuDom.querySelector('[data-is-highlighted="true"]')
      expect(selectedItemInMenu).toHaveTextContent('Alaska')
  })

  xit('should automatically highlight the next available item', async () => {
    const { getByTestId, rerender, findAllByRole } = renderElementAsDom({
      isItemSelectable: item => !!item && item.name !== 'Alabama',
      autoHighlight: true,
    });
    //  next available item: alaska
    const input = getByTestId('inputField');

    rerender(AutocompleteComponentJSX({
      isItemSelectable: item => !!item && item.name !== 'Alabama',
      autoHighlight: true,
      value: 'Al'}));

    fireEvent.change(input, {target: 'Ala'});

      await findAllByRole('option').then((items)=>{
        let itemHighlighted = items.filter((item)=> { return item.dataset.isHighlighted === true })
        expect(itemHighlighted).toHaveTextContent('Alaska')
      });
  })

  it('should not render the menu if there are no selectable items', () => {
    const { getByTestId, container } = renderElementAsDom({
      items: getCategorizedStates(),
      isItemSelectable: item => !item.header
    });
    const input = getByTestId('inputField');
    fireEvent.focus(input);
    fireEvent.change(input, {target: 'new hrhrhhrr'});
    expect(container).not.toContainElement(container.querySelector("[role=listbox]"));
  })
})

// TODO: not understandable implementation and test.
// Understand - Think if we actually need it -
// make it work, and make it understanabl
xdescribe('Public imperative API', () => {
  it('should expose select APIs available on HTMLInputElement', () => {

    const { container } = renderElementAsDom({
      open: true,
      wrapperProps: {
        'data-testid': 'wapper'
      }
    });
   // const input = getByTestId('inputField');

   const wrapper = container.querySelector('[data-testid="wapper"]');
   // anyone has these
    // expect(container.focus).toEqual(expect.any(Function));
    // expect(container.blur).toEqual(expect.any(Function));
    // expect(container.click).toEqual(expect.any(Function));
    // expect(container.focus).toEqual(expect.any(Function));

    expect(wrapper.checkValidity).toEqual(expect.any(Function));
    expect(wrapper.select).toEqual(expect.any(Function));
    expect(wrapper.setCustomValidity).toEqual(expect.any(Function));
    expect(wrapper.setSelectionRange).toEqual(expect.any(Function));
    expect(wrapper.setRangeText).toEqual(expect.any(Function));


    // const tree = mount(AutocompleteComponentJSX({ value: 'foo' }))
    // const firstNode = tree.get(0);
    // // focus
    // expect(firstNode.focus).toEqual(expect.any(Function));
    // expect(firstNode.isInputFocused()).toBe(false)
    // firstNode.focus()
    // expect(firstNode.isInputFocused()).toBe(true)

    // // setSelectionRange
    // expect(firstNode.setSelectionRange).toEqual(expect.any(Function));
    // firstNode.setSelectionRange(1, 2)
    // expect(tree.find('input').get(0).selectionStart).toBe(1)
    // expect(tree.find('input').get(0).selectionEnd).toBe(2)

    // // blurs
    // expect(firstNode.blur).toEqual(expect.any(Function));
    // firstNode.blur()
    // expect(firstNode.isInputFocused()).toBe(false)
  })
})
