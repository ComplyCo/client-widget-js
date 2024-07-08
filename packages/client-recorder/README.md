# Client-Recorder

This package allows you to set up web session recording in your web apps.

## Getting Started

Please note, the `baseUrl` comes from the client that you have registered in ComplyCO's dashboard. It will look like `app-<...>.client.complyco.com`.

The `onAuthTokenRequested` callback will need to hit an endpoint on your backend which is configured to generate and sign a JWT.
The client that you have registered in ComplyCO's dashboard should be configured with the public key that corresponds with the private key used
for signing in your backend API.

```ts
import { createClientRecorder } from "@complyco/client-recorder";
import { GzipPlugin } from "@complyco/client-recorder/plugins";

// initialize the recorder once for your pageload
const recorder = createClientRecorder({
  syncOptions: {
    baseUrl: process.env.NEXT_PUBLIC_WIDGET_API as string,
    onAuthTokenRequested,
    plugins: [GzipPlugin],
  },
});

// if your JWT callback function changes, you can pass in your new one
recorder.setOnAuthTokenRequested(onAuthTokenRequested);

// start the recording; you only need to do this once.
// NOTE: The argument is optional. This example shows the defaults
recorder.record({
  blockClass: "complyco-block",
  ignoreClass: "complyco-ignore",
  maskTextClass: "complyco-mask",
});

// stops the recording and forces a sync to ComplyCO's backend.
recorder.shutdown();
```

### Masking

You can configure the recorder with block, ignore and mask text classes, or you can use our defaults. Our defaults are:

- complyco-block
- complyco-ignore
- complyco-mask

If your UI already has classes from Sentry's Replay functionality, you can just pass the appropriate class names when invoking `recorder.record(...)`.

### Plugins

Use of plugins is optional, but they may offer performance improvements in certain cases.

- GzipPlugin: Compresses the recording when sending it to ComplyCO's backend.

## A React example

```tsx
"use client";
import { useState, useEffect } from "react";
import { createClientRecorder } from "@complyco/client-recorder";
import { GzipPlugin } from "@complyco/client-recorder/plugins";

export type AuthTracerProviderProps = {
  children: React.ReactNode;
  onAuthTokenRequested: any | undefined;
};

export default function AuthTracerProvider({ children, onAuthTokenRequested }: AuthTracerProviderProps) {
  const [recorder] = useState(() => {
    return createClientRecorder({
      syncOptions: {
        baseUrl: process.env.NEXT_PUBLIC_WIDGET_API as string,
        onAuthTokenRequested,
        plugins: [GzipPlugin],
      },
    });
  });

  useEffect(() => {
    if (onAuthTokenRequested) {
      recorder.setOnAuthTokenRequested(onAuthTokenRequested);
    }
  }, [recorder, onAuthTokenRequested]);

  useEffect(() => {
    recorder.record();

    return () => {
      recorder.shutdown();
    };
  });

  return null;
}
```
