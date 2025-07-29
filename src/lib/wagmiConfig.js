import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "React Togather App",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  chains: [monadTestnet],
});

export default config;
