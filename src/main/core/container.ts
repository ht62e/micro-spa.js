import Module from "./module";
import RuntimeError from "./runtime_error";
import { Parcel, Result, ActionType } from "./dto";

export default class Container {
    private activeModule: Module;
    private mountedModules: Map<string, Module> = new Map<string, Module>();
    private moduleChangeHistory = new Array<Module>();
    private inBackProcess: boolean = false;

    constructor(private id: string, private bindDomElement: HTMLDivElement) {
        this.bindDomElement.style.position = "relative";
    }

    public getId(): string {
        return this.id;
    }

    public async addModule(module: Module): Promise<boolean> {
        await module.mount(this);
        this.mountedModules.set(module.getName(), module);

        return true;
    }

    public addModuleElement(element: HTMLDivElement) {
        this.bindDomElement.appendChild(element);
    }

    public getElement(): HTMLDivElement {
        return this.bindDomElement;
    }

    public getActiveModule(): Module {
        return this.activeModule;
    }

    public activateModule(module: Module): void {
        if (!this.mountedModules.has(module.getName())) throw new RuntimeError("指定されたモジュールはマウントされていません。");
        this.mountedModules.forEach((m: Module) => {
            if (m === module) {
                m.show();
                this.activeModule = m;
            } else {
                m.hide();
            }
        })
    }

    public hideModule(): void {
        this.activeModule.hide();
    }

    public onResize(): void {       
        this.mountedModules.forEach((module: Module) => {
            module.dispachResizeEvent();
        })
    }

    public async forward(module: Module, parcel?: Parcel): Promise<Result> {
        if (this.moduleChangeHistory.indexOf(module) !== -1) return;

        module.initialize(parcel);

        this.activateModule(module);
        this.moduleChangeHistory.push(module);

        const result = await module.waitForExit();

        if (!this.inBackProcess) {
            //backメソッドではなく、モジュールの自主的な終了の場合はページを前に戻す
            this.showPreviousModule();
        }

        this.inBackProcess = false;

        return result;
    }

    public back(): void {
        this.inBackProcess = true;
        this.activeModule.exit(ActionType.BACK).then(exited => {
            if (!exited) return;
            this.showPreviousModule();
        })
    }

    private showPreviousModule(): void {
        if (this.moduleChangeHistory.length > 0) {
            this.moduleChangeHistory.pop();
        }
        if (this.moduleChangeHistory.length > 0) {
            this.activateModule(this.moduleChangeHistory[this.moduleChangeHistory.length - 1]);
        } else {
            this.hideModule();
        }
    }
}

export interface ContainerInfo {
    name: string;
    container: Container;
}