type JumpListener = () => void;

const JUMP_KEYS = new Set(["Space", "ArrowUp"]);

/**
 * Normalizes keyboard/touch/pointer input into a single "jump" intent.
 * Only prevents default scrolling for jump keys while the game is active.
 */
export class InputManager {
  private listeners = new Set<JumpListener>();
  private active = false;
  private target: HTMLElement | Window;

  constructor(target: HTMLElement | Window = window) {
    this.target = target;
  }

  onJump(listener: JumpListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Call when the game becomes active so Space/ArrowUp stop scrolling the page. */
  setActive(active: boolean): void {
    this.active = active;
  }

  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    this.target.addEventListener("pointerdown", this.handlePointerDown as EventListener);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.target.removeEventListener("pointerdown", this.handlePointerDown as EventListener);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!JUMP_KEYS.has(event.code)) return;
    if (this.active) event.preventDefault();
    this.emitJump();
  };

  private handlePointerDown = (): void => {
    this.emitJump();
  };

  private emitJump(): void {
    for (const listener of this.listeners) listener();
  }
}
