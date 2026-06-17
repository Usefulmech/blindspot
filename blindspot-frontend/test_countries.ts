import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import countryToCurrency from 'country-to-currency';
import getSymbolFromCurrency from 'currency-symbol-map';

countries.registerLocale(enLocale);

const rawInput = "Nigeria";
const code = countries.getAlpha2Code(rawInput, 'en');
console.log('Code:', code);
if (code) {
  const cur = countryToCurrency[code];
  console.log('Currency:', cur);
  if (cur) {
    console.log('Symbol:', getSymbolFromCurrency(cur));
  }
}
