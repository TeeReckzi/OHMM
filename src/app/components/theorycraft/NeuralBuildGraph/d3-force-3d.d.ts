// Minimal type declarations for d3-force-3d (no @types package available)
declare module "d3-force-3d" {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
    source: NodeDatum | string | number;
    target: NodeDatum | string | number;
    index?: number;
  }

  export interface Force<NodeDatum extends SimulationNodeDatum> {
    (alpha: number): void;
    initialize?(nodes: NodeDatum[], random: () => number, nDim: number): void;
  }

  export interface Simulation<NodeDatum extends SimulationNodeDatum> {
    tick(iterations?: number): Simulation<NodeDatum>;
    restart(): Simulation<NodeDatum>;
    stop(): Simulation<NodeDatum>;
    nodes(): NodeDatum[];
    nodes(nodes: NodeDatum[]): Simulation<NodeDatum>;
    alpha(): number;
    alpha(alpha: number): Simulation<NodeDatum>;
    alphaMin(): number;
    alphaMin(min: number): Simulation<NodeDatum>;
    alphaDecay(): number;
    alphaDecay(decay: number): Simulation<NodeDatum>;
    alphaTarget(): number;
    alphaTarget(target: number): Simulation<NodeDatum>;
    velocityDecay(): number;
    velocityDecay(decay: number): Simulation<NodeDatum>;
    force(name: string): Force<NodeDatum> | undefined;
    force(name: string, force: Force<NodeDatum> | null): Simulation<NodeDatum>;
    find(x: number, y?: number, z?: number, radius?: number): NodeDatum | undefined;
    on(typenames: string): ((...args: any[]) => void) | undefined;
    on(typenames: string, listener: ((...args: any[]) => void) | null): Simulation<NodeDatum>;
    numDimensions(): number;
    numDimensions(nDim: number): Simulation<NodeDatum>;
    randomSource(): () => number;
    randomSource(source: () => number): Simulation<NodeDatum>;
  }

  export interface ForceLink<NodeDatum extends SimulationNodeDatum, LinkDatum extends SimulationLinkDatum<NodeDatum>> extends Force<NodeDatum> {
    links(): LinkDatum[];
    links(links: LinkDatum[]): ForceLink<NodeDatum, LinkDatum>;
    id(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => string | number;
    id(id: (node: NodeDatum, i: number, nodes: NodeDatum[]) => string | number): ForceLink<NodeDatum, LinkDatum>;
    distance(): (link: LinkDatum, i: number, links: LinkDatum[]) => number;
    distance(distance: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)): ForceLink<NodeDatum, LinkDatum>;
    strength(): (link: LinkDatum, i: number, links: LinkDatum[]) => number;
    strength(strength: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)): ForceLink<NodeDatum, LinkDatum>;
    iterations(): number;
    iterations(iterations: number): ForceLink<NodeDatum, LinkDatum>;
  }

  export interface ForceManyBody<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    strength(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    strength(strength: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): ForceManyBody<NodeDatum>;
    theta(): number;
    theta(theta: number): ForceManyBody<NodeDatum>;
    distanceMin(): number;
    distanceMin(distance: number): ForceManyBody<NodeDatum>;
    distanceMax(): number;
    distanceMax(distance: number): ForceManyBody<NodeDatum>;
  }

  export interface ForceCenter<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    x(): number;
    x(x: number): ForceCenter<NodeDatum>;
    y(): number;
    y(y: number): ForceCenter<NodeDatum>;
    z(): number;
    z(z: number): ForceCenter<NodeDatum>;
    strength(): number;
    strength(strength: number): ForceCenter<NodeDatum>;
  }

  export interface ForcePositional<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    strength(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    strength(strength: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): ForcePositional<NodeDatum>;
    x(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    x(x: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): ForcePositional<NodeDatum>;
    y(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    y(y: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): ForcePositional<NodeDatum>;
    z(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    z(z: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): ForcePositional<NodeDatum>;
  }

  export function forceSimulation<NodeDatum extends SimulationNodeDatum>(
    nodes?: NodeDatum[],
    numDimensions?: number,
  ): Simulation<NodeDatum>;

  export function forceLink<NodeDatum extends SimulationNodeDatum, LinkDatum extends SimulationLinkDatum<NodeDatum>>(
    links?: LinkDatum[],
  ): ForceLink<NodeDatum, LinkDatum>;

  export function forceManyBody<NodeDatum extends SimulationNodeDatum>(): ForceManyBody<NodeDatum>;

  export function forceCenter<NodeDatum extends SimulationNodeDatum>(
    x?: number,
    y?: number,
    z?: number,
  ): ForceCenter<NodeDatum>;

  export function forceX<NodeDatum extends SimulationNodeDatum>(
    x?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number),
  ): ForcePositional<NodeDatum>;

  export function forceY<NodeDatum extends SimulationNodeDatum>(
    y?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number),
  ): ForcePositional<NodeDatum>;

  export function forceZ<NodeDatum extends SimulationNodeDatum>(
    z?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number),
  ): ForcePositional<NodeDatum>;

  export function forceCollide<NodeDatum extends SimulationNodeDatum>(
    radius?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number),
  ): Force<NodeDatum> & {
    radius(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    radius(radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): any;
    strength(): number;
    strength(strength: number): any;
    iterations(): number;
    iterations(iterations: number): any;
  };

  export function forceRadial<NodeDatum extends SimulationNodeDatum>(
    radius?: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number),
    x?: number,
    y?: number,
    z?: number,
  ): Force<NodeDatum> & {
    radius(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    radius(radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): any;
    strength(): (node: NodeDatum, i: number, nodes: NodeDatum[]) => number;
    strength(strength: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)): any;
    x(): number;
    x(x: number): any;
    y(): number;
    y(y: number): any;
    z(): number;
    z(z: number): any;
  };
}
