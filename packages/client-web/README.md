# Client-Web

This package allows you to display documents and tasks and collect consents in your web apps.

## Getting Started

Please note, the `baseUrl` comes from the client that you have registered in ComplyCO's dashboard. It will look like `app-<...>.client.complyco.com`.

The `onAuthTokenRequested` callback will need to hit an endpoint on your backend which is configured to generate and sign a JWT.
The client that you have registered in ComplyCO's dashboard should be configured with the public key that corresponds with the private key used
for signing in your backend API.

```ts
import { Overview } from "@complyco/client-web/views";

const view = Overview.initialize({
  baseUrl,
  iframe: document.getElementById("myIframe"), // this is optional
  onAuthTokenRequested,
  onLoad,
  onStarted,
  onShutdown,
  onResize,
  onComplete,
  onHeartbeatAge,
});
```

## Lifecycle

Note, if `iframe` isn't passed, then you can call `view.run(iframe)` in the future. This can be useful if you want to wait for `onStarted` to fire prior to opening a Dialog (where the iframe isn't mounted in the DOM until the Dialog is open).

You can call `view.unmount()` to clean up the event listeners that are managing the iframe.

## Event callbacks

- onStarted: This is called when the view starts, but before it loads. This is useful for cases such as the `Tasks.List` view where `onStarted` will only run if there are tasks for the user to see. This can help you avoid loading a dialog unnecessarily.
- onLoad: This is triggered by the iframe's onload event.
- onShutdown: This is run if the contents of the iframe shutdown, such as in the case of an unrecoverable error.
- onResize: The screens in the iframe will send their preferred size ("small" or "large") so that your UI can resize if you so choose.
- onComplete: This is run when a consent achieves a completed state.
- onHeartbeatAge: This returns the age of the last ping that the View does to the iframe. You can use this to automatically close the iframe if it becomes non-responsive.

## Views

- `Tasks.List`: Renders a list of pending tasks for the user.
- `Tasks.Details`: Renders a task by ID for the user.
- `Overview`: Renders a section of pending tasks (if any) and historical consents (if any) for the user.
- `Consents.Details`: Renders a consent by ID for the user.
