import getSymbolFromCurrency from 'currency-symbol-map';
import countryToCurrency from 'country-to-currency';

console.log(countryToCurrency['US']);
console.log(countryToCurrency['GB']);
console.log(getSymbolFromCurrency('USD'));
console.log(getSymbolFromCurrency('GBP'));
