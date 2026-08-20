import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", ".wrangler/", "coverage/", "src/worker-configuration.d.ts"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
