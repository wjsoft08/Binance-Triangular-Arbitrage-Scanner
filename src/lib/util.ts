export const stringInArray = (value: string, array: string[]) =>
  array.some((element) => value.includes(element));
