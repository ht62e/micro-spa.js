import Container from "./container";
import DialogResult from "./dialog_result";
import DialogWindow, { WindowOptions as DialogWindowOptions } from "./window";
import Overlay from "./overlay";
import Module from "./module";

export default class OvarlayManager {
    private static instance = new OvarlayManager();
    private viewPortEl: HTMLElement = null;

    public overlayLastFocusedElement: HTMLElement = null;

    private overlays: Map<string, Overlay>;

    private previousMouseX: number = 0;
    private previousMouseY: number = 0;

    constructor() {
        this.overlays = new Map<string, Overlay>();
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
    }

    public static getInstance(): OvarlayManager {
        return OvarlayManager.instance;
    }

    private onMouseMove(event: MouseEvent) {
        let deltaX = event.x - this.previousMouseX;
        let deltaY = event.y - this.previousMouseY;
        this.previousMouseX = event.x;
        this.previousMouseY = event.y;
        this.overlays.forEach(overlay => {
            overlay.__dispachMouseMoveEvent(event.x, event.y, deltaX, deltaY);
        })
    }

    private onMouseUp(event: MouseEvent) {
        this.overlays.forEach(overlay => {
            overlay.__dispachMouseUpEvent(event.x, event.y);
        })        
    }

    private onFocusIn(event: FocusEvent) {
        if (this.overlayLastFocusedElement) {
            //TODO 仮実装
            //this.overlayLastFocusedElement.focus();
        }
        this.overlayLastFocusedElement = null;
    }

    public setViewPortElement(element: HTMLElement) {
        if (this.viewPortEl !== null) {
            this.viewPortEl.removeEventListener("focusin", this.onFocusIn);
        }
        this.viewPortEl = element;
        this.viewPortEl.addEventListener("focusin", this.onFocusIn.bind(this));
    }
    
    public createWindow(overlayName: string, caption: string, options?: DialogWindowOptions): DialogWindow {
        let overlay = new DialogWindow(this.viewPortEl, caption, options);
        overlay.changeZIndex(1000);
        this.overlays.set(overlayName, overlay);
        return overlay;
    }

    public showPopupMenu(overlayName: string): DialogResult {
        return null;
    }


    public showDialogWindow(overlayName: string): DialogResult {
        let overlay = this.overlays.get(overlayName);
        return null;
    }

    public showModalWindow(overlayName: string): DialogResult {
        return null;
    }
}
