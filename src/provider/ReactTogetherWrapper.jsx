"use client";

import { ReactTogether } from "react-together";

export default function ReactTogetherWrapper({ children }) {
  return (
    <ReactTogether
      sessionParams={{
        appId: process.env.NEXT_PUBLIC_MULTISYNQ_APP_ID,
        apiKey: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY,
        name: process.env.NEXT_PUBLIC_NAME,
        password: process.env.NEXT_PUBLIC_PASSWORD,
      }}
      rememberUsers={true}
    >
      {children}
    </ReactTogether>
  );
}
