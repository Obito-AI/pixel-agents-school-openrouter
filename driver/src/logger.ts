const RESET = '\u001b[0m';
const DIM = '\u001b[2m';
const GREEN = '\u001b[32m';
const YELLOW = '\u001b[33m';
const RED = '\u001b[31m';

export function info(message: string): void {
  console.log(`${GREEN}${message}${RESET}`);
}

export function warn(message: string): void {
  console.warn(`${YELLOW}${message}${RESET}`);
}

export function error(message: string): void {
  console.error(`${RED}${message}${RESET}`);
}

export function dim(message: string): void {
  console.log(`${DIM}${message}${RESET}`);
}
