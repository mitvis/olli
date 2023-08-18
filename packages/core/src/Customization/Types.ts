export const tokenType = ['name', 'index', 'type', 'children', 'data', 'size', 'level', 'parent', 'quartile', 'aggregate', 'instructions'] as const;
export type TokenType = typeof tokenType[number];

/* Intended to grow in complexity as we expand customization options */
export type CustomizeSetting = {[k in TokenType]: boolean};