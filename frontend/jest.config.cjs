module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react-jsx',
                esModuleInterop: true
            }
        }]
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
};
