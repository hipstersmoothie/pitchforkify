function getMinutes(time: number) {
  return Math.trunc((time / 60) % 60);
}

function getSeconds(time: number) {
  return Math.trunc(time % 60);
}

function getHours(time: number) {
  return Math.trunc(time / 3600);
}

function pad(num: number, len: number): string {
  return `${num}`.padStart(len, "0");
}

export function formatTime(timeInSeconds: number): string {
  const hours = getHours(timeInSeconds);
  const minutes = getMinutes(timeInSeconds);
  const seconds = getSeconds(timeInSeconds);
  const hasHours = hours > 0;

  const hourString = hasHours ? pad(hours, 2) : undefined;
  const minuteString = pad(minutes, 2);
  const secondString = pad(seconds, 2);

  return hourString === undefined
    ? `${minuteString}:${secondString}`
    : `${hourString}:${minuteString}:${secondString}`;
}
