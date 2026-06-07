import { defineCommand } from "citty";
import { fullCleanup } from "../docker/compose";

export const cleanCommand = defineCommand({
  meta: { name: "clean", description: "Force cleanup all docker resources" },
  async run() {
    await fullCleanup();
  },
});
