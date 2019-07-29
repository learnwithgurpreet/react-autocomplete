module.exports = {
  plugins: [
    "react"
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "env": {
    "browser": true,
    "node": true,
    "jest": true,
    "es6": true
  },
  parser: "babel-eslint",
  rules: {
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "no-trailing-spaces": "error",
    "array-bracket-spacing": 0,
    "comma-dangle": 0
  }
};
