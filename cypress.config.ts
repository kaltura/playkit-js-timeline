import {defineConfig} from 'cypress';

export default defineConfig({
  fileServerFolder: 'cypress/public',
  defaultCommandTimeout: 30000,
  e2e: {
    supportFile: false,
    watchForFileChanges: false
  }
});
