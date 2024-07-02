import { gzipSync, strToU8 } from "fflate";
import type { Plugin, RequestHeadersAndBody } from "../types";

const GzipPlugin: Plugin = {
  name: "gzip",
  beforeSend: (req: RequestHeadersAndBody): RequestHeadersAndBody => {
    let body: Uint8Array;
    if (req.body instanceof Uint8Array) {
      body = gzipSync(req.body);
    } else {
      body = gzipSync(strToU8(req.body));
    }

    return {
      ...req,
      headers: {
        ...req.headers,
        "Content-Encoding": "gzip",
      },
      body,
    };
  },
};

export default GzipPlugin;
