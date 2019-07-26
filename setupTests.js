const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

const noop = () => {};
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true });