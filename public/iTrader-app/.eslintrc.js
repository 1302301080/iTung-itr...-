module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "jquery": true,
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-console": 0,
        "no-redeclare": 0,
        "indent": ["error", 4, { 'SwitchCase': 1 }],
        "semi": 0,
        "comma-dangle": "off"
    },
    "globals": {
    },
    "plugins": [
        "react"
    ],
    "parserOptions": {
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    }
};
