function isSubset(big, small) {
  return small.every(v => big.includes(v));
}

function In(parent, match) {
	return match.includes(parent);
} 

module.exports = {
  In, 
  isSubset
}