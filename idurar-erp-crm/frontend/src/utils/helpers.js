function get(obj, key) {
  return key.split('.').reduce(function (o, x) {
    return o === undefined || o === null ? o : o[x];
  }, obj);
}

/*
 convert indexes to properties
*/
export function valueByString(obj, string, devider) {
  if (devider === undefined) {
    devider = '|';
  }
  return string
    .split(devider)
    .map(function (key) {
      return get(obj, key);
    })
    .join(' ');
}

/*
  Regex to validate phone number format
*/
export const validatePhoneNumber = /^(?:[+\d()\-\s]+)$/;
