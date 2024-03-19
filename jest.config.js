/** @type import('eslint').Linter.Config */
export default {
    "roots": [
        "<rootDir>/src",
        "<rootDir>/tests"
    ],
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testTimeout: 60 * 1000
}