import "@testing-library/jest-dom";

const rect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON() {
    return this;
  },
} as DOMRect;

if (!document.elementFromPoint) {
  document.elementFromPoint = () => document.body;
}

if (!HTMLElement.prototype.getClientRects) {
  HTMLElement.prototype.getClientRects = () => [rect] as unknown as DOMRectList;
}

if (!HTMLElement.prototype.getBoundingClientRect) {
  HTMLElement.prototype.getBoundingClientRect = () => rect;
}

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList;
}

if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () => rect;
}

if (!(Node.prototype as { getClientRects?: unknown }).getClientRects) {
  (Node.prototype as unknown as { getClientRects: () => DOMRectList }).getClientRects = () =>
    [rect] as unknown as DOMRectList;
}

if (!(Node.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect) {
  (Node.prototype as unknown as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect = () => rect;
}
