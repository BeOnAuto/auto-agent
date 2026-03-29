import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts", "bin/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/index.ts"],
			thresholds: {
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100,
			},
		},
	},
});
