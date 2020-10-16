import { URLRequest } from "./URLRequest";

export function navigateToURL(request: URLRequest, target?: string) {
  window.open(request.url, target);
}
