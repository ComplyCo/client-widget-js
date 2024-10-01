# ComplyCo Documents - React Native SDK

The ComplyCo Core SDK is a React Native library that allows you to easily integrate the ComplyCo Core API into your React application.

- Tested with React Native 0.73

## Installation

```bash
npm install --save @complyco/core-sdk
```

## Configuration

To begin, you'll need a developer account with ComplyCo. You can sign up for a free account at [https://complyco.com](https://complyco.com).

Once you upload your documents to ComplyCo, you'll have access to the document IDs that can be used in your app.

Configuration is passed to the ComplyCo SDK using the `CCProvider` Context component. The `CCProvider` component takes a `config` prop that is an object with the following properties:

```javascript
<CCProvider config={{ jwt, apiBaseUrl, onError }}>
  <App />
</CCProvider>
```

- `jwt: () => Promise<string>` - This function is called by the SDK to authenticate with the ComplyCo API. The function should return a promise that resolves to a JWT token with a payload that identifies the current user. The JWT token should be signed with the key associated with your account and downloaded from the ComplyCo dashboard.
- `apiBaseUrl: string` - This is the ComplyCo API base URL associated with your account. Access this URL from the [ComplyCo dashboard](https://app.complyco.com).
- `onError: (err: any) => void` - Function called when an error occurs in the SDK. This function can be used to log errors or display error messages to the user.

## Usage

The SDK provides three usage patterns:

- Single Document View - UI component that renders a single document
- Document List View - UI component that renders a list of documents and their statuses
- Custom Hook Integration - Hooks that allow you to build your own UI components

Check out the [Demo App](https://github.com/ComplyCo/demo-documents-react-native) for examples of each of the usage patterns below.

### 1. Single Document View

```javascript
<SingleDocument
  buttonStyle={styles.buttonStyle}
  documentHeight={Dimensions.get("window").height - 400}
  documentId={documentId}
  onNextPress={() => {
    console.log("Next Pressed");
  }}
  subtitle="Accept to move on"
  title="Review This Document"
/>
```

#### Available props

| Name                  | Type                   | Default                                              | Description                                                                               |
| --------------------- | ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `buttonStyle`         | `any` style definition | `undefined`                                          | Custom styles for the button(s) inside of the document viewer                             |
| `buttonTextStyle`     | `any` style definition | `undefined`                                          | Custom styles for the text of the button(s) inside of the document viewer                 |
| `documentHeight`      | `number`               | 300                                                  | Display height of the document                                                            |
| `documentId`          | `string`               | **REQUIRED**                                         | The ID of your document that you uploaded to ComplyCo                                     |
| `onComplete`          | `() => void`           | `undefined`                                          | Called when the required actions are completed                                            |
| `signatureFontFamily` | `string`               | `undefined`                                          | Name of the font that you've linked in your app that should be used for a typed signature |
| `subtitle`            | `string`               | `Please open, review, and accept the document below` | The subtitle displayed above the document                                                 |
| `textStyle`           | `any` style definition | `undefined`                                          | Custom styles applied to the title and subtitle                                           |
| `title`               | `string`               | `Please review and accept`                           | The larger title displayed above the document                                             |

### 2. Document List View

```javascript
<DocumentList
  documentIds={documentIds}
  onNextPress={() => {
    console.log("Next Pressed");
  }}
  subtitle="Accept all to move on"
  title="Review These"
/>
```

#### Available props

| Name                  | Type                   | Default                                              | Description                                                                                                                                |
| --------------------- | ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `buttonStyle`         | `any` style definition | `undefined`                                          | Custom styles for the button(s) inside of the document viewer                                                                              |
| `buttonTextStyle`     | `any` style definition | `undefined`                                          | Custom styles for the text of the button(s) inside of the document viewer                                                                  |
| `containerStyle`      | `any` style definition | `undefined`                                          | Custom styles applied to the main container of the documents list                                                                          |
| `documentIds`         | `Array<string>`        | **REQUIRED**                                         | The IDs of your documents that you uploaded to ComplyCo                                                                                    |
| `onNextPress`         | `() => void`           | `undefined`                                          | Called when the required actions are completed and the next button is pressed. Not setting this prop will hide the `Next` button in the UI |
| `signatureFontFamily` | `string`               | `undefined`                                          | Name of the font that you've linked in your app that should be used for a typed signature                                                  |
| `successColor`        | `string`               | `#008000`                                            | The background color of the checkbox when a document's required actions are completed successfully                                         |
| `subtitle`            | `string`               | `Please open, review, and accept the document below` | The subtitle displayed above the document                                                                                                  |
| `textStyle`           | `any` style definition | `undefined`                                          | Custom styles applied to the title and subtitle                                                                                            |
| `title`               | `string`               | `Please review and accept`                           | The larger title displayed above the document                                                                                              |
| `warningColor`        | `string`               | `#b91c1b`                                            | The background color of the checkbox when a document's required actions are rejected or there's been an error                              |

### 3. Custom Hook Integration

To help you integrate the ComplyCo Documents SDK into your app, we provide hooks that you can use to build your own React Native UI components.

### `useDocuments`

Fetches a list of documents from ComplyCo and returns the document data

```javascript
const { allComplete, documentsList, getDocumentsList, isGettingDocumentsList } = useDocuments();

const initialize = useCallback(async () => {
  await getDocumentsList({
    authorization: jwt,
    body: {
      ids: documentIds,
    },
  });
}, [documentIds, jwt]);

// After initialized() is complete, the documentsList object will contain the document data
```

#### Return Value

The `useDocuments` hook returns an object with the following properties:

| Name                     | Type                                                               | Description                                                                                                         |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `allComplete`            | `boolean`                                                          | `boolean` value that is `true` if all actions have been successfully completed on all documents in the list         |
| `documentsList`          | `{ [key: string]: DocumentConsentType }`                           | Object containing all the returned documents. The object keys are the document IDs you passed to `getDocumentsList` |
| `errorMessage`           | `string`                                                           | Error message received from the documents request to ComplyCo's servers                                             |
| `getDocumentsList`       | `(authorization: string, body: { ids: Array<string> }) => Promise` | Function that performs the GET request to ComplyCo's servers. Response is saved in the hook in `documentsList`      |
| `isGettingDocumentsList` | `boolean`                                                          | `true` while the request is being performed                                                                         |

### `useDocumentStatus`

Returns the current status of a single document.

```javascript
const { hasError, isAccepted, isRejected } = useDocumentState(document);
```

#### Parameters

| Name       | Type                  | Description                                                                     |
| ---------- | --------------------- | ------------------------------------------------------------------------------- |
| `document` | `DocumentConsentType` | The document from a `documentsList` that you want to know the current status of |

#### Return Value

The `useDocumentStatus` hook returns an object with the following properties:

| Name           | Type      | Description                                                                    |
| -------------- | --------- | ------------------------------------------------------------------------------ |
| `hasError`     | `boolean` | `boolean` value that is `true` if the document passed is in an error state     |
| `isAccepted`   | `boolean` | `boolean` value that is `true` if the document passed was accepted by the user |
| `errorMessage` | `string`  | `boolean` value that is `true` if the document passed was rejected by the user |

### `useDocumentViewUrl`

Fetches a URL to view a document from ComplyCo

```javascript
const { clearDocumentViewUrl, documentViewUrl, getDocumentViewUrl } = useDocumentViewUrl();

const initialize = useCallback(async () => {
  await getDocumentViewUrl(jwt, document);
}, [document, jwt]);

// After initialized() is complete, the documentViewUrl string will contain the fetched URL
```

#### Return Value

The `useDocumentViewUrl` hook returns an object with the following properties:

| Name                       | Type                                                      | Description                                                                                 |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `clearDocumentViewUrl`     | `() => void`                                              | Function that can be called to clear out the current documentViewUrl                        |
| `documentViewUrl`          | `string`                                                  | URL that can be used to view a document                                                     |
| `errorMessage`             | `string`                                                  | Error message received from the documents request to ComplyCo's servers                     |
| `getDocumentViewUrl`       | `(document: DocumentConsentType, jwt: string) => Promise` | Function that performs the GET request to ComplyCo's servers. Response is saved in the hook |
| `isGettingDocumentViewUrl` | `boolean`                                                 | `true` while the request is being performed                                                 |
