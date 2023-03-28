const bundle = {
    "en": require('./i18n/locale-en'),
    "fr": require('./i18n/locale-fr')
};
const DEFAULT_LANG = 'en';
var currentLang = DEFAULT_LANG;

var translate = function (key, parameter) {
    const selectedLang = currentLang;
    if (!bundle || !bundle[selectedLang]) {
        console.warn('Missing locale file for [' + selectedLang + ']');
        return key;
    }

    let translation = bundle[selectedLang][key];
    if (!translation) {
        // Fallback to English
        translation = bundle[DEFAULT_LANG][key];
    }
    if(parameter) {
        translation = translation.replace(`{{${parameter.key}}}`, parameter.value)
    }
    if (translation) {
        return translation;
    }
    console.warn('Missing translation for [' + key + '] key in [' + selectedLang + '] locale');
    return key;
};

function setLanguage(lang) {
    currentLang = lang;
}

module.exports = {
    setLanguage,
    translate
}