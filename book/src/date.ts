export default function toISOStringLocal(date: Date) {
  function pad(num: number) {
    if (num < 10) {
      return "0" + num;
    }
    return num;
  }
  return date.getFullYear() +
    "-" + pad(date.getMonth() + 1) +
    "-" + pad(date.getDate()) +
    "T" + pad(date.getHours()) +
    ":" + pad(date.getMinutes()) +
    ":" + pad(date.getSeconds()) +
    "." + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    "Z";
}
