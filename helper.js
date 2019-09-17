/**
 * Returns n, clamped between the two given values.
 *
 * @n {number}
 * @lower {number}
 * @upper {number}
 * @return {number}
 */
function clamp(n, lower, upper) {
	return Math.max(lower, Math.min(n, upper));
}

/**
 * Returns the nth colour in the gradient given the initial colour and the colour change per step as a string in hexadecimal format.
 *
 * @param {number} initColour
 * @param {number} step - The amount of change in this colour for each step in the gradient.
 * @param {number} n - The number of steps away from the intial colour the gradient colour is.
 * @return {string} - The gradient colour in hexadecimal as a string. Always returned with two digits.
 */
function getGradientColour(initColour, step, n) {
	var value = Math.round(initColour + n * step);
	var hexStr = value.toString(16);
	// Pad with leading 0 if necessary
	if (hexStr.length < 2) {
		hexStr = '0' + hexStr;
	}
	return hexStr;
}

/**
 * Returns a random number from 0-1 with a normal distribution by taking the mean of n random numbers.
 *
 * @param {number} n
 * @return {number}
 */
function randNorm(n) {
	var ret = 0;
	for (var i = 0; i < n; i++) {
		ret += Math.random();
	}
	return ret / n;
}

/**
 * Returns a random number with a normal distribution that has the given mean and maximum deviation, rounded to the nearest integer.
 *
 * @param {number} mean
 * @param {number} maxDeviation
 * @return {number}
 */
function genNorm(mean, maxDeviation) {
	var deviation = randNorm(RAND_NORM_QUANTITY);
	if (Math.random() < 0.5) {
		deviation *= -1;
	}
	var result = mean + (deviation * maxDeviation);
	return Math.round(result);
}