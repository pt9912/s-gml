export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
            tsconfig: 'tsconfig.json'
        }]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^xsd-validator$': '<rootDir>/test/__mocks__/xsd-validator.ts'
    },
    testMatch: ['**/test/**/*.test.ts'],
    collectCoverageFrom: ['src/**/*.ts']
};
