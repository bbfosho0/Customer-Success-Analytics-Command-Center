import type { Preview } from "@storybook/nextjs-vite";
import { mswLoader } from "msw-storybook-addon/csf3";

import "../src/styles/globals.css";
import { handlers } from "../src/mocks/handlers";
import { StoryProviders } from "../src/storybook/story-providers";
import { canonicalViewports } from "../src/storybook/viewports";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Application theme",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: ["dark", "light"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "dark",
  },
  loaders: [mswLoader()],
  decorators: [
    (Story, context) => (
      <StoryProviders theme={context.globals.theme === "light" ? "light" : "dark"}>
        <div className="min-h-screen bg-background text-foreground" data-storybook-root>
          <Story />
        </div>
      </StoryProviders>
    ),
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    layout: "fullscreen",
    viewport: {
      options: canonicalViewports,
    },
    controls: {
      expanded: true,
    },
    a11y: {
      test: "todo",
    },
    msw: {
      handlers,
    },
  },
};

export default preview;
