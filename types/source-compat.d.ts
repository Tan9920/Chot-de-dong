declare module 'next/server' { export class NextResponse extends Response { static json(body: any, init?: ResponseInit): NextResponse; static redirect(url: string | URL, init?: ResponseInit): NextResponse; cookies: any; constructor(body?: BodyInit | null, init?: ResponseInit); } export class NextRequest extends Request { nextUrl: URL; cookies: any; } }
declare module 'next/headers' { export function cookies(): any; export function headers(): any; }
declare module 'next' { export type Metadata = any; }
declare module 'react' { export type ReactNode = any; export function useRef<T>(initialValue: T): { current: T };
  export function useState<T = any>(initial: T | (() => T)): [T, (value: any) => void]; export function useEffect(effect: any, deps?: any[]): void; export function useMemo<T = any>(factory: () => T, deps?: any[]): T; const React: any; export default React; }
declare namespace JSX { interface ElementChildrenAttribute { children: {}; } interface IntrinsicElements { [elemName: string]: any; } type Element = any; }
declare module 'fs' { const value: any; export = value; }
declare module 'fs/promises' { const value: any; export = value; }
declare module 'path' { const value: any; export = value; }
declare module 'crypto' { export function randomUUID(...args: any[]): string; export function scryptSync(...args: any[]): any; export function randomBytes(...args: any[]): any; export function createHash(...args: any[]): any; export function timingSafeEqual(...args: any[]): boolean; const value: any; export default value; }
declare var process: any; type Buffer = any; declare var Buffer: any; declare namespace NodeJS { interface Timeout {} }

declare module 'os' { export function platform(...args: any[]): any; export function arch(...args: any[]): any; const value: any; export default value; }
