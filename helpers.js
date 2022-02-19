/** @param {NS} ns **/
export function formatMoney(amount) {
	if (amount > 1000) {
		if (amount > 1000000) {
			if (amount > 1000000000) {
				if (amount > 1000000000000) {
					return (amount / 1000000000000).toFixed(3) + " t";
				}
				return (amount / 1000000000).toFixed(3) + " b";
			}
			return (amount / 1000000).toFixed(3) + " m";
		}
		return (amount / 1000).toFixed(3) + " k";
	}
	return amount.toFixed(3) + "  ";
}