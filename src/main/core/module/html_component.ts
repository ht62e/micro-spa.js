import Container, { ContainerInfo } from "../container/container";
import Module from "./module";
import SourceRepository from "../source_repository";
import HTMLComponentAdapter from "../adapter/html_component_adapter";
import { Result, ActionType, Parcel } from "../common/dto";

export default abstract class HTMLComponent implements Module {
    protected isFetched: boolean = false;
    protected isMounted: boolean = false;
    protected isInitialized: boolean = false;
    protected source: string;
    protected wrapperElement: HTMLDivElement;
    protected currentContainer: Container;
    protected subContainerInfos = new Map<string, ContainerInfo>();

    protected htmlAdapter: HTMLComponentAdapter = null;

    private exitResolver: (value?: boolean | PromiseLike<boolean>) => void;
    private exitForWaitResolver: (value?: Result | PromiseLike<Result>) => void;
    private passMessageResolver: (value?: any | PromiseLike<any>) => void;

    protected abstract onCreate(): void;
    protected abstract loadSubContainerInfos(): void;
    public abstract async mount(elementAttachHandler: (element: HTMLDivElement, ownerModuleName: string) => Container): Promise<boolean>;
    public abstract changeModuleCssPosition(left: string, top: string);
    public abstract changeModuleCssSize(width: string, height: string);

    constructor(protected name: string, protected sourceUri: string, protected moduleIndex: number) {
        this.onCreate();
    }

    public dispatchResizeEvent(): void {
        if (!this.wrapperElement) return;

        this.subContainerInfos.forEach((containerInfo: ContainerInfo) => {
            containerInfo.container.onResize();
        });
    }

    public async fetch(): Promise<boolean> {
        const repository = SourceRepository.getInstance();
        this.source = await repository.fetch(this.sourceUri);
        
        this.loadSubContainerInfos();

        this.isFetched = true;
        return null;
    }

    public initialize(parcel: Parcel): void {
        this.subContainerInfos.forEach((containerInfo: ContainerInfo) => {
            containerInfo.container.initialize(parcel);
        });

        this.htmlAdapter.triggerOnInitializeHandler(parcel);
    }

    public show(): void {
        this.wrapperElement.style.display = "";
        this.wrapperElement.style.visibility = "";
        this.htmlAdapter.triggerOnShowHandler(false, null);

        this.subContainerInfos.forEach((containerInfo: ContainerInfo) => {
            containerInfo.container.onShow();
        });
    }

    public hide(): void {
        if (this.wrapperElement.style.visibility !== "hidden") {
            this.wrapperElement.style.display = "none";
        }
        this.htmlAdapter.triggerOnHideHandler(null);
    }

    

    public waitForExit(): Promise<Result> {
        return new Promise(resolve => {
            this.exitForWaitResolver = resolve;
        });
    }

    async exit(actionType: ActionType): Promise<boolean> {
        //通常、backナビゲーション時にcontainerオブジェクト経由でコールされる
        return new Promise(resolve => {
            this.exitResolver = resolve;
            this.htmlAdapter.triggerOnExitHandler(actionType);
        });
    }

    public continueExitProcess(result: Result) {
        if (this.exitResolver) {
            this.exitResolver(true);
            this.exitResolver = null;
        }
        if (this.exitForWaitResolver) {
            this.exitForWaitResolver(result);
            this.exitForWaitResolver = null;
        }
    }

    public cancelExitProcess() {
        if (this.exitResolver) {
            this.exitResolver(false);
            this.exitResolver = null;
        }        
    }

    public async passMessage(command: string, message?: any): Promise<any> {
        return new Promise(resolve => {
            this.passMessageResolver = resolve;
            this.htmlAdapter.triggerOnReceiveMessage(command, message);
        });
    }

    public returnMessageResponse(messageResponse: any) {
        if (this.passMessage) {
            this.passMessageResolver(messageResponse);
            this.passMessageResolver = null;
        }
    }

    public getElement(): HTMLDivElement {
        throw this.wrapperElement;
    }

    public getCurrentContainer(): Container {
        return this.currentContainer;
    }

    public getSubContainerNames(): Array<string> {
        let ary = new Array<string>();
        this.subContainerInfos.forEach((c: ContainerInfo) => {
            ary.push(c.name);
        });
        return ary;
    }

    public getName(): string {
        return this.name;
    }

    public getCaption(): string {
        return this.name;
    }
    
}



