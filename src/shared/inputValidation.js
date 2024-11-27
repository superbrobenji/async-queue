/**
 * input validation
 * @param {unknown} input The input you want to test
 * @param {string} type The type you want the input to be
 * @param {boolean} required Whether the input is required or not
 *
 */
const inputValidation = (input, type, required) => {
    if (required && !input && input !== 0) {
        throw new SyntaxError("input is required");
    }
    if (input && typeof input !== type) {
        throw new TypeError(`input must be a ${type}, but got ${typeof input}`);
    }
};
export default inputValidation;
