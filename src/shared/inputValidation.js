/**
 * input validation
 * @param {unknown} input The input you want to test
 * @param {string} type The type you want the input to be
 * @param {boolean} required Whether the input is required or not
 *
 */
const inputValidation = (input, type, required) => {
    if (required && !input) {
        throw new Error("input is required");
    }
    if (input && typeof input !== type) {
        throw new Error(`input must be a ${type}`);
    }
};
export default inputValidation;
