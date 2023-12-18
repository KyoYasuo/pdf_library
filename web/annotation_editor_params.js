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

import { AnnotationEditorParamsType } from "pdfjs-lib";

class AnnotationEditorParams {
  /**
   * @param {AnnotationEditorParamsOptions} options
   * @param {EventBus} eventBus
   */
  constructor(options, eventBus) {
    this.eventBus = eventBus;
    this.#bindListeners(options);
  }

  #bindListeners({
    editorFreeTextFontSize,
    editorFreeTextColor,
    editorInkColor,
    editorInkThickness,
    editorInkOpacity,
    editorSquareColor,
    editorSquareThickness,
    editorSquareOpacity,
    editorSquareBackgroundColor,
    editorSquareBackgroundOpacity,
    editorCircleColor,
    editorCircleThickness,
    editorCircleOpacity,
    editorCircleBackgroundColor,
    editorCircleBackgroundOpacity,
    editorStampAddImage,
  }) {
    const dispatchEvent = (typeStr, value) => {
      this.eventBus.dispatch("switchannotationeditorparams", {
        source: this,
        type: AnnotationEditorParamsType[typeStr],
        value,
      });
    };
    editorFreeTextFontSize.addEventListener("input", function () {
      dispatchEvent("FREETEXT_SIZE", this.valueAsNumber);
    });
    editorFreeTextColor.addEventListener("input", function () {
      dispatchEvent("FREETEXT_COLOR", this.value);
    });
    editorInkColor.addEventListener("input", function () {
      dispatchEvent("INK_COLOR", this.value);
    });
    editorInkThickness.addEventListener("input", function () {
      dispatchEvent("INK_THICKNESS", this.valueAsNumber);
    });
    editorInkOpacity.addEventListener("input", function () {
      dispatchEvent("INK_OPACITY", this.valueAsNumber);
    });
    editorSquareColor.addEventListener("input", function () {
      dispatchEvent("SQUARE_COLOR", this.value);
    });
    editorSquareThickness.addEventListener("input", function () {
      dispatchEvent("SQUARE_THICKNESS", this.valueAsNumber);
    });
    editorSquareOpacity.addEventListener("input", function () {
      dispatchEvent("SQUARE_OPACITY", this.valueAsNumber);
    });
    editorSquareBackgroundColor.addEventListener("input", function () {
      dispatchEvent("SQUARE_BACKGROUND_COLOR", this.value);
    });
    editorSquareBackgroundOpacity.addEventListener("input", function () {
      dispatchEvent("SQUARE_BACKGROUND_OPACITY", this.valueAsNumber);
    });
    editorCircleColor.addEventListener("input", function () {
      dispatchEvent("CIRCLE_COLOR", this.value);
    });
    editorCircleThickness.addEventListener("input", function () {
      dispatchEvent("CIRCLE_THICKNESS", this.valueAsNumber);
    });
    editorCircleOpacity.addEventListener("input", function () {
      dispatchEvent("CIRCLE_OPACITY", this.valueAsNumber);
    });
    editorCircleBackgroundColor.addEventListener("input", function () {
      dispatchEvent("CIRCLE_BACKGROUND_COLOR", this.value);
    });
    editorCircleBackgroundOpacity.addEventListener("input", function () {
      dispatchEvent("CIRCLE_BACKGROUND_OPACITY", this.valueAsNumber);
    });
    editorStampAddImage.addEventListener("click", () => {
      dispatchEvent("CREATE");
    });

    this.eventBus._on("annotationeditorparamschanged", evt => {
      for (const [type, value] of evt.details) {
        switch (type) {
          case AnnotationEditorParamsType.FREETEXT_SIZE:
            editorFreeTextFontSize.value = value;
            break;
          case AnnotationEditorParamsType.FREETEXT_COLOR:
            editorFreeTextColor.value = value;
            break;
          case AnnotationEditorParamsType.INK_COLOR:
            editorInkColor.value = value;
            break;
          case AnnotationEditorParamsType.INK_THICKNESS:
            editorInkThickness.value = value;
            break;
          case AnnotationEditorParamsType.INK_OPACITY:
            editorInkOpacity.value = value;
            break;
          case AnnotationEditorParamsType.SQUARE_COLOR:
            editorSquareColor.value = value;
            break;
          case AnnotationEditorParamsType.SQUARE_THICKNESS:
            editorSquareThickness.value = value;
            break;
          case AnnotationEditorParamsType.SQUARE_OPACITY:
            editorSquareOpacity.value = value;
            break;
          case AnnotationEditorParamsType.SQUARE_BACKGROUND_COLOR:
            editorSquareBackgroundColor.value = value;
            break;
          case AnnotationEditorParamsType.SQUARE_BACKGROUND_OPACITY:
            editorSquareBackgroundOpacity.value = value;
            break;
          case AnnotationEditorParamsType.CIRCLE_COLOR:
            editorCircleColor.value = value;
            break;
          case AnnotationEditorParamsType.CIRCLE_THICKNESS:
            editorCircleThickness.value = value;
            break;
          case AnnotationEditorParamsType.CIRCLE_OPACITY:
            editorCircleOpacity.value = value;
            break;
          case AnnotationEditorParamsType.CIRCLE_BACKGROUND_COLOR:
            editorCircleBackgroundColor.value = value;
            break;
          case AnnotationEditorParamsType.CIRCLE_BACKGROUND_OPACITY:
            editorCircleBackgroundOpacity.value = value;
            break;
        }
      }
    });
  }
}

export { AnnotationEditorParams };
