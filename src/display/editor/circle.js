/* Copyright 2022 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  Util,
} from "../../shared/util.js";
import { AnnotationEditor } from "./editor.js";
import { CircleAnnotationElement } from "../annotation_layer.js";
import { noContextMenu } from "../display_utils.js";

/**
 * Basic draw editor in order to generate an Ink annotation.
 */
class CircleEditor extends AnnotationEditor {
  #baseHeight = 0;

  #baseWidth = 0;

  #boundCanvasPointermove = this.canvasPointermove.bind(this);

  #boundCanvasPointerleave = this.canvasPointerleave.bind(this);

  #boundCanvasPointerup = this.canvasPointerup.bind(this);

  #boundCanvasPointerdown = this.canvasPointerdown.bind(this);

  #canvasContextMenuTimeoutId = null;

  #disableEditing = false;

  #hasSomethingToDraw = false;

  #isCanvasInitialized = false;

  #observer = null;

  #realWidth = 0;

  #realHeight = 0;

  #requestFrameCallback = null;

  static _defaultColor = null;
  static _defaultBackgroundColor = "#ffffff";
  static _defaultOpacity = 1;
  static _defaultBackgroundOpacity = 0;

  static _defaultThickness = 1;

  static _type = "circle";

  static _editorType = AnnotationEditorType.CIRCLE;

  constructor(params) {
    super({ ...params, name: "circleEditor" });
    this.color = params.color || null;
    this.thickness = params.thickness || null;
    this.opacity = params.opacity || null;
    this.backgroundcolor = params.backgroundcolor || null;
    this.backgroundopacity = params.backgroundopacity || null;
    this.paths = [];
    this.allRawPaths = [];
    this.currentPath = [];
    this.scaleFactor = 1;
    this.translationX = this.translationY = 0;
    this.x = 0;
    this.y = 0;
    this._willKeepAspectRatio = true;
    this.linewidth = 0;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
  }

  /** @inheritdoc */
  static initialize(l10n) {
    AnnotationEditor.initialize(l10n);
  }

  /** @inheritdoc */
  static updateDefaultParams(type, value) {
    switch (type) {
      case AnnotationEditorParamsType.CIRCLE_THICKNESS:
        CircleEditor._defaultThickness = value;
        break;
      case AnnotationEditorParamsType.CIRCLE_COLOR:
        CircleEditor._defaultColor = value;
        break;
      case AnnotationEditorParamsType.CIRCLE_OPACITY:
        CircleEditor._defaultOpacity = value / 100;
        break;
      case AnnotationEditorParamsType.CIRCLE_BACKGROUND_COLOR:
        CircleEditor._defaultBackgroundColor = value;
        break;
      case AnnotationEditorParamsType.CIRCLE_BACKGROUND_OPACITY:
        CircleEditor._defaultBackgroundOpacity = value / 100;
        break;
    }
  }

  /** @inheritdoc */
  updateParams(type, value) {
    switch (type) {
      case AnnotationEditorParamsType.CIRCLE_THICKNESS:
        this.#updateThickness(value);
        break;
      case AnnotationEditorParamsType.CIRCLE_COLOR:
        this.#updateColor(value);
        break;
      case AnnotationEditorParamsType.CIRCLE_OPACITY:
        this.#updateOpacity(value);
        break;
      case AnnotationEditorParamsType.CIRCLE_BACKGROUND_COLOR:
        this.#updateBackgroundColor(value);
        break;
      case AnnotationEditorParamsType.CIRCLE_BACKGROUND_OPACITY:
        this.#updateBackgroundOpacity(value);
        break;
    }
  }

  /** @inheritdoc */
  static get defaultPropertiesToUpdate() {
    return [
      [AnnotationEditorParamsType.CIRCLE_THICKNESS, CircleEditor._defaultThickness],
      [
        AnnotationEditorParamsType.CIRCLE_COLOR,
        CircleEditor._defaultColor || AnnotationEditor._defaultLineColor,
      ],
      [
        AnnotationEditorParamsType.CIRCLE_OPACITY,
        Math.round(CircleEditor._defaultOpacity * 100),
      ],
      [
        AnnotationEditorParamsType.CIRCLE_BACKGROUND_COLOR,
        CircleEditor._defaultBackgroundColor || '#ffffff',
      ],
      [
        AnnotationEditorParamsType.CIRCLE_BACKGROUND_OPACITY,
        Math.round(CircleEditor._defaultBackgroundOpacity * 100),
      ],
    ];
  }

  /** @inheritdoc */
  get propertiesToUpdate() {
    return [
      [
        AnnotationEditorParamsType.CIRCLE_THICKNESS,
        this.thickness || CircleEditor._defaultThickness,
      ],
      [
        AnnotationEditorParamsType.CIRCLE_COLOR,
        this.color ||
          CircleEditor._defaultColor ||
          AnnotationEditor._defaultLineColor,
      ],
      [
        AnnotationEditorParamsType.CIRCLE_OPACITY,
        Math.round(100 * (this.opacity ?? CircleEditor._defaultOpacity)),
      ],
      [
        AnnotationEditorParamsType.CIRCLE_BACKGROUND_COLOR,
        this.backgroundcolor ||
          CircleEditor._defaultBackgroundColor ||
          "#ffffff",
      ],
      [
        AnnotationEditorParamsType.CIRCLE_BACKGROUND_OPACITY,
        Math.round(100 * (this.backgroundopacity ?? CircleEditor._defaultBackgroundOpacity)),
      ],
    ];
  }

  /**
   * Update the thickness and make this action undoable.
   * @param {number} thickness
   */
  #updateThickness(thickness) {
    const savedThickness = this.thickness;
    this.addCommands({
      cmd: () => {
        this.thickness = thickness;
        this.#fitToContent();
      },
      undo: () => {
        this.thickness = savedThickness;
        this.#fitToContent();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.CIRCLE_THICKNESS,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the color and make this action undoable.
   * @param {string} color
   */
  #updateColor(color) {
    const savedColor = this.color;
    this.addCommands({
      cmd: () => {
        this.color = color;
        this.#redraw();
      },
      undo: () => {
        this.color = savedColor;
        this.#redraw();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.CIRCLE_COLOR,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the opacity and make this action undoable.
   * @param {number} opacity
   */
  #updateOpacity(opacity) {
    opacity /= 100;
    const savedOpacity = this.opacity;
    this.addCommands({
      cmd: () => {
        this.opacity = opacity;
        this.#redraw();
      },
      undo: () => {
        this.opacity = savedOpacity;
        this.#redraw();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.CIRCLE_OPACITY,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the background color and make this action undoable.
   * @param {string} background color
   */
  #updateBackgroundColor(backgroundcolor) {
    const savedBackgroundColor = this.backgroundcolor;
    this.addCommands({
      cmd: () => {
        this.backgroundcolor = backgroundcolor;
        this.#redraw();
      },
      undo: () => {
        this.backgroundcolor = savedBackgroundColor;
        this.#redraw();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.CIRCLE_BACKGROUND_COLOR,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the background opacity and make this action undoable.
   * @param {number} background opacity
   */
  #updateBackgroundOpacity(backgroundopacity) {
    backgroundopacity /= 100;
    const savedBackgroundOpacity = this.backgroundopacity;
    this.addCommands({
      cmd: () => {
        this.backgroundopacity = backgroundopacity;
        this.#redraw();
      },
      undo: () => {
        this.backgroundopacity = savedBackgroundOpacity;
        this.#redraw();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.CIRCLE_BACKGROUND_OPACITY,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /** @inheritdoc */
  rebuild() {
    if (!this.parent) {
      return;
    }
    super.rebuild();
    if (this.div === null) {
      return;
    }

    if (!this.canvas) {
      this.#createCanvas();
      this.#createObserver();
    }

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilding it,
      // hence we must add it to its parent.
      this.parent.add(this);
      this.#setCanvasDims();
    }
    this.#fitToContent();
  }

  /** @inheritdoc */
  remove() {
    if (this.canvas === null) {
      return;
    }

    if (!this.isEmpty()) {
      this.commit();
    }

    // Destroy the canvas.
    this.canvas.width = this.canvas.height = 0;
    this.canvas.remove();
    this.canvas = null;

    if (this.#canvasContextMenuTimeoutId) {
      clearTimeout(this.#canvasContextMenuTimeoutId);
      this.#canvasContextMenuTimeoutId = null;
    }

    this.#observer.disconnect();
    this.#observer = null;

    super.remove();
  }

  setParent(parent) {
    if (!this.parent && parent) {
      // We've a parent hence the rescale will be handled thanks to the
      // ResizeObserver.
      this._uiManager.removeShouldRescale(this);
    } else if (this.parent && parent === null) {
      // The editor is removed from the DOM, hence we handle the rescale thanks
      // to the onScaleChanging callback.
      // This way, it'll be saved/printed correctly.
      this._uiManager.addShouldRescale(this);
    }
    super.setParent(parent);
  }

  onScaleChanging() {
    const [parentWidth, parentHeight] = this.parentDimensions;
    const width = this.width * parentWidth;
    const height = this.height * parentHeight;
    this.setDimensions(width, height);
  }

  /** @inheritdoc */
  enableEditMode() {
    if (this.#disableEditing || this.canvas === null) {
      return;
    }

    super.enableEditMode();
    this._isDraggable = false;
    this.canvas.addEventListener("pointerdown", this.#boundCanvasPointerdown);
  }

  /** @inheritdoc */
  disableEditMode() {
    if (!this.isInEditMode() || this.canvas === null) {
      return;
    }

    super.disableEditMode();
    this._isDraggable = !this.isEmpty();
    this.div.classList.remove("editing");

    this.canvas.removeEventListener(
      "pointerdown",
      this.#boundCanvasPointerdown
    );
  }

  /** @inheritdoc */
  onceAdded() {
    this._isDraggable = !this.isEmpty();
  }

  /** @inheritdoc */
  isEmpty() {
    return (
      this.paths.length === 0 ||
      (this.paths.length === 1 && this.paths[0].length === 0)
    );
  }

  #getInitialBBox() {
    const {
      parentRotation,
      parentDimensions: [width, height],
    } = this;
    switch (parentRotation) {
      case 90:
        return [0, height, height, width];
      case 180:
        return [width, height, width, height];
      case 270:
        return [width, 0, height, width];
      default:
        return [0, 0, width, height];
    }
  }

  /**
   * Set line styles.
   */
  #setStroke() {
    const { ctx, color, opacity, thickness, backgroundcolor, backgroundopacity, parentScale, scaleFactor } = this;
    ctx.lineWidth = (thickness * parentScale) / scaleFactor;
    this.linewidth = ctx.lineWidth;
    ctx.miterLimit = 10;
    ctx.strokeStyle = this.#rgbaColorWithOpacity(color, opacity);
    ctx.fillStyle =  this.#rgbaColorWithOpacity(backgroundcolor, backgroundopacity);
    // console.log("setStroke: ", ctx.strokeStyle, ctx.lineWidth, ctx.fillStyle, this.backgroundcolor, backgroundcolor);
  }
  #rgbaColorWithOpacity(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Start to draw on the canvas.
   * @param {number} x
   * @param {number} y
   */
  #startDrawing(x, y) {
    this.canvas.addEventListener("contextmenu", noContextMenu);
    this.canvas.addEventListener("pointerleave", this.#boundCanvasPointerleave);
    this.canvas.addEventListener("pointermove", this.#boundCanvasPointermove);
    this.canvas.addEventListener("pointerup", this.#boundCanvasPointerup);
    this.canvas.removeEventListener(
      "pointerdown",
      this.#boundCanvasPointerdown
    );

    this.isEditing = true;
    if (!this.#isCanvasInitialized) {
      this.#isCanvasInitialized = true;
      this.#setCanvasDims();
      this.thickness ||= CircleEditor._defaultThickness;
      this.color ||=
        CircleEditor._defaultColor || AnnotationEditor._defaultLineColor;
      this.opacity ??= CircleEditor._defaultOpacity;
      this.backgroundcolor ||= CircleEditor._defaultBackgroundColor;
      this.backgroundopacity ??= CircleEditor._defaultBackgroundOpacity;
    }
    this.currentPath[0] = [x, y];
    this.startX = x;
    this.startY = y;
    this.#hasSomethingToDraw = false;
    // console.log("startDrawing: currentPath", this.currentPath[0]);
    // this.#setStroke();
    let currentRadius = Math.sqrt(
      Math.pow(this.startX - x, 2) + Math.pow(this.startY - y, 2)
    )
    this.#setStroke();
    this.#requestFrameCallback = () => {
      // this.#drawCircle(this.startX, this.startY, currentRadius);
      if (this.#requestFrameCallback) {
        window.requestAnimationFrame(this.#requestFrameCallback);
        console.log("this.requestFrameCallback: ", this.#requestFrameCallback);
      }
    };
    window.requestAnimationFrame(this.#requestFrameCallback);
    console.log("No this.requestFrameCallback: ", this.#requestFrameCallback);
  }

  /**
   * Draw on the canvas.
   * @param {number} x
   * @param {number} y
   */
  #draw(x, y) {
    const [lastX, lastY] = this.currentPath[0];
    if (x === lastX && y === lastY) {
      return;
    }
    this.currentPath[0] = [x, y];
    this.#hasSomethingToDraw = true;

    const { ctx } = this;
    this.#setStroke();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let currentRadius;
    for (const path of this.paths) {
      currentRadius = Math.sqrt(
        Math.pow(path[0] - path[2], 2) + Math.pow(path[1] - path[3], 2)
      );
      this.#drawCircle(path[0], path[1], currentRadius);
    }
    currentRadius = Math.sqrt(
      Math.pow(this.startX - x, 2) + Math.pow(this.startY - y, 2)
    )
    this.#drawCircle(this.startX, this.startY, currentRadius);

    // console.log("drawCircle: ", this.startX, this.startY, x, y, currentRadius);

  }

  #endPath() {
    if (this.currentPath.length === 0) {
      return;
    }
    this.endX = this.currentPath[0][0];
    this.endY = this.currentPath[0][1];
  }

  /**
   * Stop to draw on the canvas.
   * @param {number} x
   * @param {number} y
   */
  #stopDrawing(x, y) {
    this.#requestFrameCallback = null;

    x = Math.min(Math.max(x, 0), this.canvas.width);
    y = Math.min(Math.max(y, 0), this.canvas.height);
    this.#setStroke();
    this.#draw(x, y);
    this.#endPath();
    // Interpolate the path entered by the user with some
    // Bezier's curves in order to have a smoother path and
    // to reduce the data size used to draw it in the PDF.
   
    
    const currentPath = this.currentPath;
    // console.log(currentPath);
    this.currentPath = [];
    // console.log("stopDrawing: ", currentPath, path2D)
    const cmd = () => {
      // console.log("cmd: ", this.startX, this.startY);
      this.paths.push([this.startX, this.startY, this.endX, this.endY]);
      this.rebuild();
    };

    const undo = () => {
      this.paths.pop();
      if (this.paths.length === 0) {
        this.remove();
      } else {
        if (!this.canvas) {
          this.#createCanvas();
          this.#createObserver();
        }
        this.#fitToContent();
      }
    };

    this.addCommands({ cmd, undo, mustExec: true });
  }

  #drawCircle(x, y, radius) {
    // const width = this.canvas.width;
    // const height = this.canvas.height;
    const { ctx } = this;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    // ctx.fillStyle = this.#rgbaColorWithOpacity(backgroundcolor, backgroundopacity);
    ctx.fill();

    ctx.beginPath();

    // ctx.strokeStyle = this.#rgbaColorWithOpacity(color, opacity);
    ctx.arc(x, y, radius + ctx.lineWidth/2, 0, Math.PI * 2, true);
    ctx.stroke();

    
  }

  // #makeBezierCurve(path2D, x0, y0, x1, y1, x2, y2) {
  //   const prevX = (x0 + x1) / 2;
  //   const prevY = (y0 + y1) / 2;
  //   const x3 = (x1 + x2) / 2;
  //   const y3 = (y1 + y2) / 2;

  //   path2D.bezierCurveTo(
  //     prevX + (2 * (x1 - prevX)) / 3,
  //     prevY + (2 * (y1 - prevY)) / 3,
  //     x3 + (2 * (x1 - x3)) / 3,
  //     y3 + (2 * (y1 - y3)) / 3,
  //     x3,
  //     y3
  //   );
  // }

  // #generateBezierPoints() {
  //   const path = this.currentPath;
  //   if (path.length <= 2) {
  //     return [[path[0], path[0], path.at(-1), path.at(-1)]];
  //   }

  //   const bezierPoints = [];
  //   let i;
  //   let [x0, y0] = path[0];
  //   for (i = 1; i < path.length - 2; i++) {
  //     const [x1, y1] = path[i];
  //     const [x2, y2] = path[i + 1];
  //     const x3 = (x1 + x2) / 2;
  //     const y3 = (y1 + y2) / 2;

  //     // The quadratic is: [[x0, y0], [x1, y1], [x3, y3]].
  //     // Convert the quadratic to a cubic
  //     // (see https://fontforge.org/docs/techref/bezier.html#converting-truetype-to-postscript)
  //     const control1 = [x0 + (2 * (x1 - x0)) / 3, y0 + (2 * (y1 - y0)) / 3];
  //     const control2 = [x3 + (2 * (x1 - x3)) / 3, y3 + (2 * (y1 - y3)) / 3];

  //     bezierPoints.push([[x0, y0], control1, control2, [x3, y3]]);

  //     [x0, y0] = [x3, y3];
  //   }

  //   const [x1, y1] = path[i];
  //   const [x2, y2] = path[i + 1];

  //   // The quadratic is: [[x0, y0], [x1, y1], [x2, y2]].
  //   const control1 = [x0 + (2 * (x1 - x0)) / 3, y0 + (2 * (y1 - y0)) / 3];
  //   const control2 = [x2 + (2 * (x1 - x2)) / 3, y2 + (2 * (y1 - y2)) / 3];

  //   bezierPoints.push([[x0, y0], control1, control2, [x2, y2]]);
  //   return bezierPoints;
  // }

  /**
   * Redraw all the paths.
   */
  #redraw() {
    if (this.isEmpty()) {
      this.#updateTransform();
      return;
    }
    this.#setStroke();

    const { canvas, ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.#updateTransform();
    let currentRadius;
    for (const path of this.paths) {
      currentRadius = Math.sqrt(
        Math.pow(path[0] - path[2], 2) + Math.pow(path[1] - path[3], 2)
      );
      this.#drawCircle(path[0], path[1], currentRadius);
    }
  }

  /**
   * Commit the curves we have in this editor.
   */
  commit() {
    if (this.#disableEditing) {
      return;
    }

    super.commit();

    this.isEditing = false;
    this.disableEditMode();

    // This editor must be on top of the main ink editor.
    this.setInForeground();

    this.#disableEditing = true;
    this.div.classList.add("disabled");

    this.#fitToContent(/* firstTime = */ true);
    this.select();

    this.parent.addCircleEditorIfNeeded(/* isCommitting = */ true);

    // When commiting, the position of this editor is changed, hence we must
    // move it to the right position in the DOM.
    this.moveInDOM();
    this.div.focus({
      preventScroll: true /* See issue #15744 */,
    });
  }

  /** @inheritdoc */
  focusin(event) {
    if (!this._focusEventsAllowed) {
      return;
    }
    super.focusin(event);
    this.enableEditMode();
  }

  /**
   * onpointerdown callback for the canvas we're drawing on.
   * @param {PointerEvent} event
   */
  canvasPointerdown(event) {
    if (event.button !== 0 || !this.isInEditMode() || this.#disableEditing) {
      return;
    }

    // We want to draw on top of any other editors.
    // Since it's the last child, there's no need to give it a higher z-index.
    this.setInForeground();

    event.preventDefault();

    if (!this.div.contains(document.activeElement)) {
      this.div.focus({
        preventScroll: true /* See issue #17327 */,
      });
    }

    this.#startDrawing(event.offsetX, event.offsetY);
  }

  /**
   * onpointermove callback for the canvas we're drawing on.
   * @param {PointerEvent} event
   */
  canvasPointermove(event) {
    event.preventDefault();
    this.#draw(event.offsetX, event.offsetY);
  }

  /**
   * onpointerup callback for the canvas we're drawing on.
   * @param {PointerEvent} event
   */
  canvasPointerup(event) {
    event.preventDefault();
    this.#endDrawing(event);
  }

  /**
   * onpointerleave callback for the canvas we're drawing on.
   * @param {PointerEvent} event
   */
  canvasPointerleave(event) {
    this.#endDrawing(event);
  }

  /**
   * End the drawing.
   * @param {PointerEvent} event
   */
  #endDrawing(event) {
    this.canvas.removeEventListener(
      "pointerleave",
      this.#boundCanvasPointerleave
    );
    this.canvas.removeEventListener(
      "pointermove",
      this.#boundCanvasPointermove
    );
    this.canvas.removeEventListener("pointerup", this.#boundCanvasPointerup);
    this.canvas.addEventListener("pointerdown", this.#boundCanvasPointerdown);

    // Slight delay to avoid the context menu to appear (it can happen on a long
    // tap with a pen).
    if (this.#canvasContextMenuTimeoutId) {
      clearTimeout(this.#canvasContextMenuTimeoutId);
    }
    this.#canvasContextMenuTimeoutId = setTimeout(() => {
      this.#canvasContextMenuTimeoutId = null;
      this.canvas.removeEventListener("contextmenu", noContextMenu);
    }, 10);

    this.#stopDrawing(event.offsetX, event.offsetY);

    this.addToAnnotationStorage();

    // Since the ink editor covers all of the page and we want to be able
    // to select another editor, we just put this one in the background.
    this.setInBackground();
  }

  /**
   * Create the canvas element.
   */
  #createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = 0;
    this.canvas.className = "circleEditorCanvas";
    this.canvas.setAttribute("data-l10n-id", "pdfjs-circle-canvas");

    this.div.append(this.canvas);
    this.ctx = this.canvas.getContext("2d");
  }

  /**
   * Create the resize observer.
   */
  #createObserver() {
    this.#observer = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      if (rect.width && rect.height) {
        this.setDimensions(rect.width, rect.height);
      }
    });
    this.#observer.observe(this.div);
  }

  /** @inheritdoc */
  get isResizable() {
    return !this.isEmpty() && this.#disableEditing;
  }

  /** @inheritdoc */
  render() {
    if (this.div) {
      return this.div;
    }

    let baseX, baseY;
    if (this.width) {
      baseX = this.x;
      baseY = this.y;
    }

    super.render();

    this.div.setAttribute("data-l10n-id", "pdfjs-circle");

    const [x, y, w, h] = this.#getInitialBBox();
    this.setAt(x, y, 0, 0);
    this.setDims(w, h);

    this.#createCanvas();

    if (this.width) {
      // This editor was created in using copy (ctrl+c).
      const [parentWidth, parentHeight] = this.parentDimensions;
      this.setAspectRatio(this.width * parentWidth, this.height * parentHeight);
      this.setAt(
        baseX * parentWidth,
        baseY * parentHeight,
        this.width * parentWidth,
        this.height * parentHeight
      );
      this.#isCanvasInitialized = true;
      this.#setCanvasDims();
      this.setDims(this.width * parentWidth, this.height * parentHeight);
      this.#redraw();
      this.div.classList.add("disabled");
    } else {
      this.div.classList.add("editing");
      this.enableEditMode();
    }

    this.#createObserver();

    return this.div;
  }

  #setCanvasDims() {
    if (!this.#isCanvasInitialized) {
      return;
    }
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.canvas.width = Math.ceil(this.width * parentWidth);
    this.canvas.height = Math.ceil(this.height * parentHeight);
    this.#updateTransform();
  }

  /**
   * When the dimensions of the div change the inner canvas must
   * renew its dimensions, hence it must redraw its own contents.
   * @param {number} width - the new width of the div
   * @param {number} height - the new height of the div
   * @returns
   */
  setDimensions(width, height) {
    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);
    if (
      this.#realWidth === roundedWidth &&
      this.#realHeight === roundedHeight
    ) {
      return;
    }

    this.#realWidth = roundedWidth;
    this.#realHeight = roundedHeight;

    this.canvas.style.visibility = "hidden";

    const [parentWidth, parentHeight] = this.parentDimensions;
    this.width = width / parentWidth;
    this.height = height / parentHeight;
    this.fixAndSetPosition();

    if (this.#disableEditing) {
      this.#setScaleFactor(width, height);
    }

    this.#setCanvasDims();
    this.#redraw();

    this.canvas.style.visibility = "visible";

    // For any reason the dimensions couldn't be in percent but in pixels, hence
    // we must fix them.
    this.fixDims();
  }

  #setScaleFactor(width, height) {
    const padding = this.#getPadding();
    const scaleFactorW = (width - padding) / this.#baseWidth;
    const scaleFactorH = (height - padding) / this.#baseHeight;
    this.scaleFactor = Math.min(scaleFactorW, scaleFactorH);
  }

  /**
   * Update the canvas transform.
   */
  #updateTransform() {
    const padding = this.#getPadding() / 2;
    this.ctx.setTransform(
      this.scaleFactor,
      0,
      0,
      this.scaleFactor,
      this.translationX * this.scaleFactor + padding,
      this.translationY * this.scaleFactor + padding
    );
  }

  // /**
  //  * Convert into a Path2D.
  //  * @param {Array<Array<number>>} bezier
  //  * @returns {Path2D}
  //  */
  // static #buildPath2D(bezier) {
  //   const path2D = new Path2D();
  //   for (let i = 0, ii = bezier.length; i < ii; i++) {
  //     const [first, control1, control2, second] = bezier[i];
  //     if (i === 0) {
  //       path2D.moveTo(...first);
  //     }
  //     path2D.bezierCurveTo(
  //       control1[0],
  //       control1[1],
  //       control2[0],
  //       control2[1],
  //       second[0],
  //       second[1]
  //     );
  //   }
  //   return path2D;
  // }

  static #toPDFCoordinates(points, rect, rotation) {
    const [blX, blY, trX, trY] = rect;

    switch (rotation) {
      case 0:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          points[i] += blX;
          points[i + 1] = trY - points[i + 1];
        }
        break;
      case 90:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          const x = points[i];
          points[i] = points[i + 1] + blX;
          points[i + 1] = x + blY;
        }
        break;
      case 180:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          points[i] = trX - points[i];
          points[i + 1] += blY;
        }
        break;
      case 270:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          const x = points[i];
          points[i] = trX - points[i + 1];
          points[i + 1] = trY - x;
        }
        break;
      default:
        throw new Error("Invalid rotation");
    }
    return points;
  }

  static #fromPDFCoordinates(points, rect, rotation) {
    const [blX, blY, trX, trY] = rect;

    switch (rotation) {
      case 0:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          points[i] -= blX;
          points[i + 1] = trY - points[i + 1];
        }
        break;
      case 90:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          const x = points[i];
          points[i] = points[i + 1] - blY;
          points[i + 1] = x - blX;
        }
        break;
      case 180:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          points[i] = trX - points[i];
          points[i + 1] -= blY;
        }
        break;
      case 270:
        for (let i = 0, ii = points.length; i < ii; i += 2) {
          const x = points[i];
          points[i] = trY - points[i + 1];
          points[i + 1] = trX - x;
        }
        break;
      default:
        throw new Error("Invalid rotation");
    }
    return points;
  }

  static #toPDFCoordinatesForCircle(path, rect, rotation) {
    const [blX, blY, trX, trY] = rect;
    let [centerX, centerY, radius] = path;

    switch (rotation) {
      case 0:
        centerX += blX;
        centerY = trY - centerY;
        break;
      case 90:
        const tempCenterX90 = centerX;
        centerX = centerY + blX;
        centerY = trX - tempCenterX90;
        break;
      case 180:
        centerX = trX - centerX;
        centerY = trY - centerY;
        break;
      case 270:
        const tempCenterX270 = centerX;
        centerX = trY - centerY;
        centerY = tempCenterX270 + blY;
        break;
      default:
        throw new Error("Invalid rotation");
    }

    return [centerX, centerY, radius];
  }

  #serializePaths(scale, translateX, translateY, rect, rotation) {
    const pdf_path = []
    for (const circle of this.paths) {
      // Extract the centerX, centerY, and calculate radius from endX, endY
      const [centerX, centerY, endX, endY] = circle;
      const radius = Math.sqrt(Math.pow(endX - centerX, 2) + Math.pow(endY - centerY, 2));
  
      const scaledCenterX = scale * centerX + scale * translateX;
      const scaledCenterY = scale * centerY + scale * translateY;
      const scaledRadius = scale * radius;
  
      pdf_path.push(CircleEditor.#toPDFCoordinatesForCircle(
        [scaledCenterX, scaledCenterY, scaledRadius], rect, rotation
      ));
    }
  
    // Return the path data for the circle
    return pdf_path;
  }

  /**
   * Get the bounding box containing all the paths.
   * @returns {Array<number>}
   */
  #getBbox() {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    let currentRadius;
    for (const path of this.paths) {
      currentRadius = Math.sqrt(
        Math.pow(path[0] - path[2], 2) + Math.pow(path[1] - path[3], 2)
      );
      xMin = Math.min(xMin, Math.min(path[0] + currentRadius + this.linewidth/2, path[0] - currentRadius - this.linewidth/2));
      yMin = Math.min(yMin, Math.min(path[1] + currentRadius + this.linewidth/2, path[1] - currentRadius - this.linewidth/2));
      xMax = Math.max(xMax, Math.max(path[0] + currentRadius + this.linewidth/2, path[0] - currentRadius - this.linewidth/2));
      yMax = Math.max(yMax, Math.max(path[1] + currentRadius + this.linewidth/2, path[1] - currentRadius - this.linewidth/2));
    }
    // console.log("getBox: ",xMin, yMin, xMax, yMax);
    return [xMin, yMin, xMax, yMax];
  }

  /**
   * The bounding box is computed with null thickness, so we must take
   * it into account for the display.
   * It corresponds to the total padding, hence it should be divided by 2
   * in order to have left/right paddings.
   * @returns {number}
   */
  #getPadding() {
    return this.#disableEditing
      ? Math.ceil(this.thickness * this.parentScale)
      : 0;
  }

  /**
   * Set the div position and dimensions in order to fit to
   * the bounding box of the contents.
   * @returns {undefined}
   */
  #fitToContent(firstTime = false) {
    if (this.isEmpty()) {
      return;
    }

    if (!this.#disableEditing) {
      this.#redraw();
      return;
    }

    const bbox = this.#getBbox();
    const padding = this.#getPadding();
    this.#baseWidth = Math.max(AnnotationEditor.MIN_SIZE, bbox[2] - bbox[0]);
    this.#baseHeight = Math.max(AnnotationEditor.MIN_SIZE, bbox[3] - bbox[1]);

    const width = Math.ceil(padding + this.#baseWidth * this.scaleFactor);
    const height = Math.ceil(padding + this.#baseHeight * this.scaleFactor);

    const [parentWidth, parentHeight] = this.parentDimensions;
    this.width = width / parentWidth;
    this.height = height / parentHeight;

    this.setAspectRatio(width, height);

    const prevTranslationX = this.translationX;
    const prevTranslationY = this.translationY;

    this.translationX = -bbox[0];
    this.translationY = -bbox[1];
    this.#setCanvasDims();
    this.#redraw();

    this.#realWidth = width;
    this.#realHeight = height;

    this.setDims(width, height);
    const unscaledPadding = firstTime ? padding / this.scaleFactor / 2 : 0;
    this.translate(
      prevTranslationX - this.translationX - unscaledPadding,
      prevTranslationY - this.translationY - unscaledPadding
    );
  }

  /** @inheritdoc */
  static deserialize(data, parent, uiManager) {
    if (data instanceof CircleAnnotationElement) {
      return null;
    }
    const editor = super.deserialize(data, parent, uiManager);

    editor.thickness = data.thickness;
    editor.color = Util.makeHexColor(...data.color);
    editor.opacity = data.opacity;
    editor.backgroundcolor = Util.makeHexColor(...data.backgroundcolor);
    editor.backgroundopacity = data.backgroundopacity;

    const [pageWidth, pageHeight] = editor.pageDimensions;
    const width = editor.width * pageWidth;
    const height = editor.height * pageHeight;
    const scaleFactor = editor.parentScale;
    const padding = data.thickness / 2;

    const { paths, rect, rotation } = data;

    for (let { bezier } of paths) {
      bezier = CircleEditor.#fromPDFCoordinates(bezier, rect, rotation);
      const path = [];
      editor.paths.push(path);
      let p0 = scaleFactor * (bezier[0] - padding);
      let p1 = scaleFactor * (bezier[1] - padding);
      for (let i = 2, ii = bezier.length; i < ii; i += 6) {
        const p10 = scaleFactor * (bezier[i] - padding);
        const p11 = scaleFactor * (bezier[i + 1] - padding);
        const p20 = scaleFactor * (bezier[i + 2] - padding);
        const p21 = scaleFactor * (bezier[i + 3] - padding);
        const p30 = scaleFactor * (bezier[i + 4] - padding);
        const p31 = scaleFactor * (bezier[i + 5] - padding);
        path.push([
          [p0, p1],
          [p10, p11],
          [p20, p21],
          [p30, p31],
        ]);
        p0 = p30;
        p1 = p31;
      }
      // const path2D = this.#buildPath2D(path);
      // editor.bezierPath2D.push(path2D);
    }

    return editor;
  }

  /** @inheritdoc */
  serialize() {
    if (this.isEmpty()) {
      return null;
    }
    const rect = this.getRect(0, 0);
    const color = AnnotationEditor._colorManager.convert(this.ctx.strokeStyle);
    const backgroundcolor = AnnotationEditor._colorManager.convert(this.ctx.fillStyle);
    // console.log("circle-serialize: ", color, backgroundcolor);
    console.log("circle-serialize: ", 
      AnnotationEditorType.CIRCLE,
      color,
      this.thickness,
      this.opacity,
      this.linewidth,
      "Paths:", this.paths,
      "print_path: ",this.#serializePaths(
        this.scaleFactor / this.parentScale,
        this.translationX,
        this.translationY,
        rect,
        this.rotation
      ),
      this.pageIndex,
      "Rect------", rect,
      this.rotation,
      this._structTreeParentId,
      backgroundcolor,
      this.backgroundopacity,
  );
    return {
      annotationType: AnnotationEditorType.CIRCLE,
      color,
      thickness: this.thickness,
      linewidth: this.linewidth,
      opacity: this.opacity,
      paths: this.#serializePaths(
        this.scaleFactor / this.parentScale,
        this.translationX,
        this.translationY,
        rect,
        this.rotation
      ),
      backgroundcolor: backgroundcolor,
      backgroundopacity: this.backgroundopacity,
      pageIndex: this.pageIndex,
      rect,
      rotation: this.rotation,
      structTreeParentId: this._structTreeParentId,
    };
  }
}

export { CircleEditor };
