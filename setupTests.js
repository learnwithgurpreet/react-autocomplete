const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
require("@babel/polyfill");

Enzyme.configure({ adapter: new Adapter() });

const noop = () => {};
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true });


require('@testing-library/react/cleanup-after-each')
require('@testing-library/jest-dom/extend-expect')