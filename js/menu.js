import {_} from "./libs/i18n.js";
import {__i18n__} from "../data/i18n_db.js";
import {$} from "./libs/lamaiquery.js";
import {create_tz_list} from "./libs/tz.js";
// Only used if ping stats are on
// import {__api__frontsite, __api__base} from "./api_url.js";

let __menu_external_link = `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" fill="none" viewBox="0 0 24 24"><path stroke="#CCC" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 5H8.2c-1.12 0-1.681 0-2.108.218a2 2 0 0 0-.874.874C5 6.52 5 7.08 5 8.2v7.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874c.427.218.987.218 2.105.218h7.606c1.118 0 1.677 0 2.104-.218.376-.192.683-.498.875-.875.218-.427.218-.987.218-2.104V14m1-5V4m0 0h-5m5 0-7 7"/></svg>`;
let __menu_flags = {
	"en": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#00247D" d="M0 9.059V13h5.628zM4.664 31H13v-5.837zM23 25.164V31h8.335zM0 23v3.941L5.63 23zM31.337 5H23v5.837zM36 26.942V23h-5.631zM36 13V9.059L30.371 13zM13 5H4.664L13 10.837z"/><path fill="#CF1B2B" d="M25.14 23l9.712 6.801c.471-.479.808-1.082.99-1.749L28.627 23H25.14zM13 23h-2.141l-9.711 6.8c.521.53 1.189.909 1.938 1.085L13 23.943V23zm10-10h2.141l9.711-6.8c-.521-.53-1.188-.909-1.937-1.085L23 12.057V13zm-12.141 0L1.148 6.2C.677 6.68.34 7.282.157 7.949L7.372 13h3.487z"/><path fill="#EEE" d="M36 21H21v10h2v-5.836L31.335 31H32c1.117 0 2.126-.461 2.852-1.199L25.14 23h3.487l7.215 5.052c.093-.337.158-.686.158-1.052v-.058L30.369 23H36v-2zM0 21v2h5.63L0 26.941V27c0 1.091.439 2.078 1.148 2.8l9.711-6.8H13v.943l-9.914 6.941c.294.07.598.116.914.116h.664L13 25.163V31h2V21H0zM36 9c0-1.091-.439-2.078-1.148-2.8L25.141 13H23v-.943l9.915-6.942C32.62 5.046 32.316 5 32 5h-.663L23 10.837V5h-2v10h15v-2h-5.629L36 9.059V9zM13 5v5.837L4.664 5H4c-1.118 0-2.126.461-2.852 1.2l9.711 6.8H7.372L.157 7.949C.065 8.286 0 8.634 0 9v.059L5.628 13H0v2h15V5h-2z"/><path fill="#CF1B2B" d="M21 15V5h-6v10H0v6h15v10h6V21h15v-6z"/></svg>`,
	"de": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#FFCD05" d="M0 27c0 2.209 1.791 4 4 4h28c2.209 0 4-1.791 4-4v-4H0v4z"/><path fill="#ED1F24" d="M0 14h36v9H0z"/><path fill="#141414" d="M32 5H4C1.791 5 0 6.791 0 9v5h36V9c0-2.209-1.791-4-4-4z"/></svg>`,
	"es": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#C60A1D" d="M36 27c0 2.209-1.791 4-4 4H4c-2.209 0-4-1.791-4-4V9c0-2.209 1.791-4 4-4h28c2.209 0 4 1.791 4 4v18z"/><path fill="#FFC400" d="M0 12h36v12H0z"/><path fill="#EA596E" d="M9 17v3c0 1.657 1.343 3 3 3s3-1.343 3-3v-3H9z"/><path fill="#F4A2B2" d="M12 16h3v3h-3z"/><path fill="#DD2E44" d="M9 16h3v3H9z"/><ellipse fill="#EA596E" cx="12" cy="14.5" rx="3" ry="1.5"/><ellipse fill="#FFAC33" cx="12" cy="13.75" rx="3" ry=".75"/><path fill="#99AAB5" d="M7 16h1v7H7zm9 0h1v7h-1z"/><path fill="#66757F" d="M6 22h3v1H6zm9 0h3v1h-3zm-8-7h1v1H7zm9 0h1v1h-1z"/></svg>`,
	"fr": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#ED2939" d="M36 27c0 2.209-1.791 4-4 4h-8V5h8c2.209 0 4 1.791 4 4v18z"/><path fill="#002495" d="M4 5C1.791 5 0 6.791 0 9v18c0 2.209 1.791 4 4 4h8V5H4z"/><path fill="#EEE" d="M12 5h12v26H12z"/></svg>`
};
let __menu_icons = {
	"trainer": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#FFCC4D" d="M36 34c0 1.104-.896 2-2 2H2c-1.104 0-2-.896-2-2V15c0-1.104.896-2 2-2h32c1.104 0 2 .896 2 2v19z"/><path fill="#6D6E71" d="M34 13H2c-1.104 0-2 .896-2 2h36c0-1.104-.896-2-2-2z"/><path fill="#3B88C3" d="M2 24h32v4H2zm0-6h32v4H2zm0 12h32v4H2z"/><path fill="#FFCC4D" d="M28 17h2v18h-2z"/><path fill="#FFE8B6" d="M22 0H6C4.896 0 4 .896 4 2v34h20V2c0-1.104-.896-2-2-2z"/><path fill="#808285" d="M22 0H6C4.896 0 4 .896 4 2h20c0-1.104-.896-2-2-2z"/><path fill="#55ACEE" d="M6 18h16v4H6zm0 6h16v4H6zm0 6h16v4H6z"/><path fill="#FFE8B6" d="M10 7h2v29h-2zm6 0h2v29h-2z"/><path fill="#269" d="M12 30h4v6h-4z"/><circle fill="#A7A9AC" cx="14" cy="9" r="6"/><circle fill="#E6E7E8" cx="14" cy="9" r="4"/><path fill="#A0041E" d="M17 10h-3c-.552 0-1-.448-1-1V4c0-.552.448-1 1-1s1 .448 1 1v4h2c.552 0 1 .448 1 1s-.448 1-1 1z"/></svg>`,
	"wz": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#F4900C" d="M35.22 30.741l-.024.024c-.97.97-2.542.97-3.511 0L7.835 6.915c-.582-.582-.582-1.525 0-2.107l1.429-1.429c.582-.582 1.525-.582 2.107 0l23.85 23.85c.969.97.969 2.542-.001 3.512z"/><path fill="#66757F" d="M17.765 6.946L14.229 3.41c-.586-.586-1.535-.586-2.121 0L8.573 6.946c-2.128 2.092-3.85 3.015-6.055 3.056-.171 1.573.665 5.193 1.967 6.652 1.692 1.896 4.545 2.495 7.223 2.454-.134-2.363.437-4.422 2.521-6.506l3.535-3.536c.587-.585.587-1.535.001-2.12z"/><path fill="#CCD6DD" d="M2.518 10.002C1.767 10.016.962 9.93.064 9.75c-.707 4.95 7.071 12.728 12.021 12.021-.193-.937-.328-1.819-.376-2.663-4.418-1.409-8.107-5.072-9.191-9.106z"/></svg>`,
	"bosses": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#CCD6DD" d="M35 17c0 9.389-13.223 19-17 19-3.778 0-17-9.611-17-19S8.611 0 18 0s17 7.611 17 17z"/><path fill="#292F33" d="M13.503 14.845c3.124 3.124 4.39 6.923 2.828 8.485-1.562 1.562-5.361.297-8.485-2.828-3.125-3.124-4.391-6.923-2.828-8.485s5.361-.296 8.485 2.828zm8.994 0c-3.124 3.124-4.39 6.923-2.828 8.485 1.562 1.562 5.361.297 8.485-2.828 3.125-3.125 4.391-6.923 2.828-8.485-1.562-1.562-5.361-.297-8.485 2.828zM18 31c-2.347 0-3.575-1.16-3.707-1.293-.391-.391-.391-1.023 0-1.414.387-.387 1.013-.391 1.404-.01.051.047.806.717 2.303.717 1.519 0 2.273-.689 2.305-.719.398-.374 1.027-.363 1.408.029.379.393.38 1.011-.006 1.396C21.575 29.84 20.347 31 18 31z"/></svg>`,
	"bz": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#CCD6DC" d="M35.858 17.376L.079 17.053v11.821c.011 1.084 1.009 2.12 2.52 3.028l2.396 1.133c.732.278 1.531.534 2.393.766l3.585.762c.791.127 1.615.232 2.46.32l9.328.088c.868-.075 1.714-.167 2.524-.285l3.57-.707c.857-.219 1.652-.463 2.378-.73l2.374-1.098c1.507-.893 2.262-1.923 2.251-3.013V17.376z"/><path fill="#66757F" d="M22.885 30.848c-.043-4.36-2.19-5.47-4.825-5.493-2.634-.024-4.759 1.047-4.716 5.407.016 1.606.046 2.96.089 4.12 1.504.156 3.079.254 4.712.269 1.6.014 3.141-.054 4.616-.18.097-1.003.142-2.341.124-4.123zM10.917 28.89l.001.107.003.364.003.271.001.065c.001.052 0 .044 0 0l-.001-.065-.003-.271-.003-.364-.001-.107-.001-.122c-.022-2.18-3.61-3.303-3.589-1.122v.037l.002.204.002.158.005.47.001.067.051 5.218c1.106.297 2.302.556 3.585.762l-.056-5.753v.081zm17.878-.992l.005.506v.027l.003.27c.001.118.001.15 0 0l-.003-.27v-.027l-.005-.506-.001-.058c-.022-2.18-3.589-1.123-3.567 1.057v.036l.057 5.753c1.279-.186 2.47-.426 3.57-.707l-.06-6.1.001.019zM4.931 26.534c-.022-2.18-2.417-3.292-2.396-1.112v.041l.063 6.439c.676.406 1.483.785 2.396 1.133l-.052-5.321c.003.208.006.582-.011-1.18zm26.237.237l.012 1.137v-.047.047l.053 5.34c.906-.334 1.705-.701 2.374-1.098l-.064-6.448c-.021-2.18-2.396-1.111-2.375 1.069zM2.972 5.225c-.276 0-.5.224-.5.5v12.37c0 .276.224.5.5.5s.5-.224.5-.5V5.725c0-.277-.223-.5-.5-.5z"/><path fill="#DD2F45" d="M3.207 5.936c1.478.269 3.682 1.102 4.246 1.424.564.322.215.484-.322.725-.538.242-3.441 1.021-3.87 1.102-.431.082-.054-3.251-.054-3.251z"/><path fill="#66757F" d="M11.969 2.976c-.276 0-.5.224-.5.5v12.37c0 .276.224.5.5.5s.5-.224.5-.5V3.476c0-.277-.224-.5-.5-.5z"/><path fill="#226798" d="M12.203 3.687c1.478.269 3.682 1.102 4.247 1.425.564.322.215.484-.322.725-.538.242-3.44 1.021-3.87 1.102-.432.081-.055-3.252-.055-3.252z"/><path fill="#66757F" d="M21.339 2.976c-.276 0-.5.224-.5.5v12.37c0 .276.224.5.5.5s.5-.224.5-.5V3.476c0-.277-.224-.5-.5-.5z"/><path fill="#DD2F45" d="M21.574 3.687c1.478.269 3.681 1.102 4.246 1.425.564.322.215.484-.322.725-.537.242-3.44 1.021-3.871 1.102-.431.081-.053-3.252-.053-3.252z"/><path fill="#66757F" d="M30.335 5.225c-.276 0-.5.224-.5.5v12.37c0 .276.224.5.5.5s.5-.224.5-.5V5.725c0-.277-.224-.5-.5-.5z"/><path fill="#226798" d="M30.57 5.936c1.478.269 3.681 1.102 4.246 1.425.564.322.215.484-.322.725-.537.242-3.44 1.021-3.871 1.102-.43.081-.053-3.252-.053-3.252z"/><path fill="#E9EFF3" d="M35.858 17.444c.033 3.312-7.949 5.924-17.829 5.835C8.148 23.19.112 20.431.08 17.121c-.033-3.312 7.95-5.924 17.83-5.835 9.879.09 17.915 2.847 17.948 6.158z"/><path fill="#7450A0" d="M33.257 18.209c.029 2.995-6.788 5.361-15.226 5.286-8.44-.077-15.305-2.567-15.334-5.562-.029-2.994 6.787-5.36 15.227-5.284 8.437.077 15.304 2.566 15.333 5.56z"/><path fill="#E9EFF3" d="M26.766 19.378l5.83-3.939-1.8-1.106s-3.63 3.394-4.822 4.548c-.876-.455-2.073-.837-3.486-1.104l2.439-5.303-2.463-.294-1.094 5.419c-1.059-.145-2.202-.233-3.401-.244-.928-.008-1.823.031-2.671.106l-1.183-5.357-2.457.251 2.491 5.235c-1.64.226-3.037.604-4.036 1.085-1.271-1.227-4.847-4.573-4.847-4.573l-1.778 1.074 5.814 3.98c-.541.397-.847.84-.843 1.311.018 1.766 4.303 3.237 9.573 3.285 5.268.048 9.527-1.346 9.51-3.113-.004-.445-.281-.872-.776-1.261z"/><path fill="#5C903F" d="M26.427 20.862c.013 1.321-3.732 2.357-8.363 2.315-4.631-.042-8.396-1.146-8.409-2.467-.013-1.32 3.731-2.356 8.362-2.314 4.63.041 8.396 1.146 8.41 2.466z"/></svg>`,
	"wevents": `
<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#66757F" d="M28.815 4h1.996v1h-1.996z"/><path fill="#CCD6DD" d="M2 12v20c0 2.209 1.791 4 4 4h24c2.209 0 4-1.791 4-4V12H2z"/><path fill="#DD2E44" d="M30 4H6C3.791 4 2 5.791 2 8v5h32V8c0-2.209-1.791-4-4-4z"/><path d="M8.836 8.731c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.27.667 1.27 1.489 0 .822-.569 1.489-1.27 1.489zm6 0c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.27.667 1.27 1.489 0 .822-.569 1.489-1.27 1.489zm6 0c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.271.667 1.271 1.489-.001.822-.57 1.489-1.271 1.489zm6 0c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.271.667 1.271 1.489-.001.822-.57 1.489-1.271 1.489z" fill="#292F33"/><path fill="#66757F" d="M27.315.179c-1.277 0-2.383.802-2.994 1.97-.606-1.143-1.717-1.97-3.006-1.97-1.277 0-2.383.802-2.994 1.97-.606-1.143-1.717-1.97-3.006-1.97-1.277 0-2.383.802-2.994 1.97-.606-1.143-1.717-1.97-3.006-1.97-1.934 0-3.5 1.819-3.5 4.005 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.48-.374-.793-.729-1.018-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095s1.5.905 1.5 1.905h1.016c-.003.062-.016.121-.016.184 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.479-.374-.792-.729-1.017-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095S16.815 3 16.815 4h1.016c-.003.062-.016.121-.016.184 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.479-.374-.792-.729-1.017-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095S22.815 3 22.815 4h1.016c-.003.062-.016.121-.016.184 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.479-.374-.792-.729-1.017-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095S28.815 3 28.815 4h1.996C30.79 2 29.235.179 27.315.179z"/><path d="M11 15h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zM6 20h4v4H6zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zM6 25h4v4H6zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zM6 30h4v4H6zm5 0h4v4h-4zm5 0h4v4h-4z" fill="#FFF"/></svg>`,
	"wstats": `
<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#CCD6DD" d="M31 2H5C3.343 2 2 3.343 2 5v26c0 1.657 1.343 3 3 3h26c1.657 0 3-1.343 3-3V5c0-1.657-1.343-3-3-3z"/><path fill="#E1E8ED" d="M31 1H5C2.791 1 1 2.791 1 5v26c0 2.209 1.791 4 4 4h26c2.209 0 4-1.791 4-4V5c0-2.209-1.791-4-4-4zm0 2c1.103 0 2 .897 2 2v4h-6V3h4zm-4 16h6v6h-6v-6zm0-2v-6h6v6h-6zM25 3v6h-6V3h6zm-6 8h6v6h-6v-6zm0 8h6v6h-6v-6zM17 3v6h-6V3h6zm-6 8h6v6h-6v-6zm0 8h6v6h-6v-6zM3 5c0-1.103.897-2 2-2h4v6H3V5zm0 6h6v6H3v-6zm0 8h6v6H3v-6zm2 14c-1.103 0-2-.897-2-2v-4h6v6H5zm6 0v-6h6v6h-6zm8 0v-6h6v6h-6zm12 0h-4v-6h6v4c0 1.103-.897 2-2 2z"/><path fill="#5C913B" d="M13 33H7V16c0-1.104.896-2 2-2h2c1.104 0 2 .896 2 2v17z"/><path fill="#3B94D9" d="M29 33h-6V9c0-1.104.896-2 2-2h2c1.104 0 2 .896 2 2v24z"/><path fill="#DD2E44" d="M21 33h-6V23c0-1.104.896-2 2-2h2c1.104 0 2 .896 2 2v10z"/></svg>`,
	"tstats": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#CCD6DD" d="M31 2H5C3.343 2 2 3.343 2 5v26c0 1.657 1.343 3 3 3h26c1.657 0 3-1.343 3-3V5c0-1.657-1.343-3-3-3z"/><path fill="#E1E8ED" d="M31 1H5C2.791 1 1 2.791 1 5v26c0 2.209 1.791 4 4 4h26c2.209 0 4-1.791 4-4V5c0-2.209-1.791-4-4-4zm0 2c1.103 0 2 .897 2 2v4h-6V3h4zm-4 16h6v6h-6v-6zm0-2v-6h6v6h-6zM25 3v6h-6V3h6zm-6 8h6v6h-6v-6zm0 8h6v6h-6v-6zM17 3v6h-6V3h6zm-6 8h6v6h-6v-6zm0 8h6v6h-6v-6zM3 5c0-1.103.897-2 2-2h4v6H3V5zm0 6h6v6H3v-6zm0 8h6v6H3v-6zm2 14c-1.103 0-2-.897-2-2v-4h6v6H5zm6 0v-6h6v6h-6zm8 0v-6h6v6h-6zm12 0h-4v-6h6v4c0 1.103-.897 2-2 2z"/><path fill="#DD2E44" d="M4.998 33c-.32 0-.645-.076-.946-.239-.973-.523-1.336-1.736-.813-2.709l7-13c.299-.557.845-.939 1.47-1.031.626-.092 1.258.118 1.705.565l6.076 6.076 9.738-18.59c.512-.978 1.721-1.357 2.699-.843.979.512 1.356 1.721.844 2.7l-11 21c-.295.564-.841.953-1.47 1.05-.627.091-1.266-.113-1.716-.563l-6.1-6.099-5.724 10.631C6.4 32.619 5.71 33 4.998 33z"/></svg>`,
	"armor": `<svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 36 36"><path fill="#CCD6DD" d="M33 3c-7-3-15-3-15-3S10 0 3 3C0 18 3 31 18 36c15-5 18-18 15-33z"/><path fill="#55ACEE" d="M18 33.884C6.412 29.729 1.961 19.831 4.76 4.444 11.063 2.029 17.928 2 18 2c.071 0 6.958.04 13.24 2.444 2.799 15.387-1.652 25.285-13.24 29.44z"/><path fill="#269" d="M31.24 4.444C24.958 2.04 18.071 2 18 2v31.884c11.588-4.155 16.039-14.053 13.24-29.44z"/></svg>`
}

let __menu_content = `
	<input type="checkbox" id="menu-click">
	<label for="menu-click" class="menu-btn"><span class="bold">${_("☰  Menu")}</span></label>
	<header>
		<ul id="menu-links">
		<li class="menuitem bold"><a href="./">${__menu_icons["trainer"]} ${_("Trainer")}</a></li>
		<li class="menuitem bold"><a href="wz.html">${__menu_icons["wz"]} ${_("WZ status")}</a></li>
		<li class="menuitem bold"><a href="bosses.html">${__menu_icons["bosses"]} ${_("Bosses status")}</a></li>
		<li class="menuitem bold"><a href="bz.html">${__menu_icons["bz"]} ${_("BZ status")}</a></li>
		<li class="menuitem bold"><a href="wevents.html">${__menu_icons["wevents"]} ${_("WZ events")}</a></li>
		<li class="menuitem bold"><a href="wstats.html">${__menu_icons["wstats"]} ${_("WZ statistics")}</a></li>
		<li class="menuitem"><a href="https://poludnica.shinyapps.io/configs/" target="_blank">
			${__menu_icons["tstats"]} ${_("Trainer statistics")}
			${__menu_external_link}</a></li>
		<li class="menuitem"><a href="https://poludnica.shinyapps.io/rcalc/" target="_blank">
		${__menu_icons["armor"]} ${_("Armor calculator")}
		${__menu_external_link}</a></li>
		<li class="menuitem">
		<div id="menu-lang">
			<input type="checkbox" id="menu-lang-switch">
			<label for="menu-lang-switch" id="menu-lang-current"></label>
			<div id="menu-lang-list" class="menu-lang-list"></div>
		</div>
		</li>
		</ul>
	</header>
`;
let __menu_footer = `
		<div id="tz"><div id="tztitle">${_("Timezone:")}&nbsp;</div><select id="tzchooser"></select></div>
		<p><i>CoRT is a free and open source website, feel free to check out its
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">source code</a>, and report
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">bugs</a>.
		See also the <a href="https://discord.gg/P5BJRtTx3R">Discord server</a>!</i></p>
		<p> <!--VERSION-->Version: 20250820.193441
`;

$(document).ready(function() {

	$("#menu").html(__menu_content);
	$("#footer").html(__menu_footer);

	let langs = {
		"en": "EN",
		"de": "DE",
		"es": "ES",
		"fr": "FR"
	};
	for (let l in langs) {
		$("#menu-lang-list").append(`
			<a href="#" class="langoption" id="menu-lang-${l}">
				${__menu_flags[l]} ${langs[l]}
			</a>`);
		$(`#menu-lang-${l}`).on("click", function () {
			localStorage.setItem("lang", l);
			window.location.reload();
		});
	}

	let currentlang = "en";
	let storedlang = localStorage.getItem("lang");
	if (__i18n__.supported_lang.includes(storedlang))
		currentlang = storedlang;
	$("#menu-lang-current").text(__menu_flags[currentlang] + " " + langs[currentlang]);
	$("body").on("click", function(event) {
		let prevent_in = ["menu-lang-list", "menu-lang-current", "menu-lang-switch"];
		if (!prevent_in.includes(event.target.id))
			$("#menu-lang-list").css("display", "none");
		else
			$("#menu-lang-list").css("display", "block");
	});

	create_tz_list("#tzchooser");

	/*
	$("body").prepend(`
		<div class="card" style="background-color:#ff3333; font-weight: bold; text-align:center;">
		&#9888;&#65039; I'm doing heavy maintenance tasks on the server this weekend. There
		may be some disruptions.
		</div>
	`);
	*/

});

/*
// get basic hit statistics
function get_hits() {
	let head = document.getElementsByTagName("head")[0];
	let script = document.createElement("script");
	script.type = "text/javascript";
	script.src = __api__base + "/ping.js?p=/" +
		     window.location.pathname.split("/").pop();
	script.setAttribute("defer", "");
	head.appendChild(script);
}
if (window.location.origin == __api__frontsite)
	setTimeout(get_hits, 2000);
*/
