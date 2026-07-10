import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

// The video renders the production components from ../web. Two constraints:
// 1. Tailwind v4 must scan ../web so the components' classes exist.
// 2. react/motion must resolve to ONE copy: web files would otherwise pull
//    their own node_modules instance, splitting React context -- hooks crash
//    and MotionConfig reducedMotion never reaches the components.
const HERE = process.cwd();
const WEB = path.resolve(HERE, "..", "web");
const NM = (p: string) => path.resolve(HERE, "node_modules", p);

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((config) => {
  const tw = enableTailwind(config);
  return {
    ...tw,
    resolve: {
      ...(tw.resolve ?? {}),
      alias: {
        ...((tw.resolve ?? {}).alias ?? {}),
        "@": WEB,
        react: NM("react"),
        "react-dom": NM("react-dom"),
        "react/jsx-runtime": NM("react/jsx-runtime"),
        "react/jsx-dev-runtime": NM("react/jsx-dev-runtime"),
        scheduler: NM("scheduler"),
        motion: NM("motion"),
        "@phosphor-icons/react": NM("@phosphor-icons/react"),
        sonner: NM("sonner"),
      },
    },
  };
});
