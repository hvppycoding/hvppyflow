import { app } from "../../scripts/app.js";
import { KoreanInput } from "./korean_input.js";


app.registerExtension({
    name: "hvppyflow.toggle_korean_input",
    async setup() {
        try {
            const { krSvgMarkup, enSvgMarkup } = await import("./input_icons.js");
            // Korean input handling setup
            let korean_input = new KoreanInput();

            // Top bar button setup
            const { ComfyButton } = await import("../../scripts/ui/components/button.js");
            const { ComfyButtonGroup } = await import("../../scripts/ui/components/buttonGroup.js");

            let b_isKorean = false; // true = Korean, false = English

            const iconContainer = document.createElement('span');
            iconContainer.innerHTML = enSvgMarkup;
            iconContainer.style.display = 'flex';
            iconContainer.style.alignItems = 'center';
            iconContainer.style.justifyContent = 'center';
            iconContainer.style.width = '1.2rem';
            iconContainer.style.height = '1.2rem';

            const langButton = new ComfyButton({
                content: iconContainer,
                tooltip: "HvppyFlow: Korean/English (Ctrl+Space)",
                classList: "comfyui-button comfyui-menu-mobile-collapse",
            });

            console.log(langButton);
            // langButton.element.innerHTML = svg;

            const updateButton = (isKorean) => {
                if (isKorean) {
                    iconContainer.innerHTML = krSvgMarkup;
                } else {
                    iconContainer.innerHTML = enSvgMarkup;
                }
                langButton.element.classList.toggle("primary", isKorean); // Highlight when Korean mode is active
            };

            const setLang = (ko) => {
                if (ko === b_isKorean) return;
                b_isKorean = ko;
                if (b_isKorean) {
                    korean_input.setKoreanMode();
                } else {
                    korean_input.setEnglishMode();
                }
                updateButton(b_isKorean);
            };

            const toggleLang = () => {
                setLang(!b_isKorean);
            };

            langButton.action = () => {
                toggleLang();
            };

            const onKeyDown = (ev) => {
                // Ctrl + Space to toggle language mode
                if (ev.code === "Space" && ev.ctrlKey && !ev.repeat) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    toggleLang();
                    return;
                }
                if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') {
                    korean_input.handleKeyDown(ev);
                }
            };

            document.addEventListener("keydown", onKeyDown, true);
            document.addEventListener("mousedown", (e) => { korean_input.reset(); }, true);

            const cmGroup = new ComfyButtonGroup(langButton.element);
            app.menu?.settingsGroup.element.before(cmGroup.element);
        } catch (e) {
            console.error(e);
            console.log('ComfyUI is outdated. New style menu based features are disabled.');
        }
    }
});