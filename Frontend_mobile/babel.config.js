// react-native-css-interop/babel.js (used by nativewind/babel) unconditionally
// requires 'react-native-worklets/plugin'. We stub it out here to avoid build
// failures when using react-native-webrtc (which requires Old Architecture).
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react-native-worklets/plugin') {
    return function () { return { visitor: {} }; };
  }
  return originalLoad.apply(this, arguments);
};

module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", {jsxImportSource: "nativewind", worklets: false}],
            "nativewind/babel",
        ],
    };
};



