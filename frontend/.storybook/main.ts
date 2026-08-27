import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "msw-storybook-addon",
    {
      name: "@storybook/addon-mcp",
      options: {
        endpoint: "/mcp",
      },
    },
  ],
};

export default config;
