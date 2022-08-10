import { OlliVisSpec } from "olli-adapters/src/Types";
/**
 * The configuration object outlining how an accessible visualization should be rendered based on a {@link OlliVisSpec}.
 */
declare type OlliConfigOptions = {
    visualization: OlliVisSpec;
    domId: string;
    renderType?: 'tree' | 'table';
    ariaLabel?: string;
};
/**
 *
 * @param config The {@link OlliConfigOptions} object to specify how an accessible visualization should be generated.
 */
export declare function olli(config: OlliConfigOptions): void;
export {};
//# sourceMappingURL=index.d.ts.map