// Lumen Moth — keyboard + mouse input. Both steer the moth: arrow keys /
// WASD accelerate it, and moving the mouse makes it ease toward the cursor.
// Space or a mouse click fires the pulse. Enter starts, R restarts.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: null, y: null, movedAt: -1e9, down: false };
    this.pressed = new Set(); // edge-triggered keys, consumed once per frame
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key);
      this.keys.add(event.key);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key);
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (event.clientX - rect.left) * scaleX;
      this.mouse.y = (event.clientY - rect.top) * scaleY;
      this.mouse.movedAt = performance.now() / 1000;
    });
    canvas.addEventListener('mousedown', (event) => {
      this.mouse.down = true;
      this.pressed.add('MouseClick');
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (event.clientX - rect.left) * scaleX;
      this.mouse.y = (event.clientY - rect.top) * scaleY;
      this.mouse.movedAt = performance.now() / 1000;
      event.preventDefault();
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  // Direction from held move keys, normalised.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  // True once for the frame the key went down (or the mouse was clicked).
  wasPressed(key) {
    return this.pressed.has(key);
  }

  endFrame() {
    this.pressed.clear();
  }
}
