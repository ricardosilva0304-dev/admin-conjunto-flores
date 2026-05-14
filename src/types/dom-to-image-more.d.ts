declare module "dom-to-image-more" {
    interface Options {
        scale?: number;
        bgcolor?: string;
        width?: number;
        height?: number;
        style?: Partial<CSSStyleDeclaration>;
        filter?: (node: HTMLElement) => boolean;
    }
    const domtoimage: {
        toPng(node: HTMLElement, options?: Options): Promise<string>;
        toJpeg(node: HTMLElement, options?: Options): Promise<string>;
        toSvg(node: HTMLElement, options?: Options): Promise<string>;
        toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
    };
    export default domtoimage;
}